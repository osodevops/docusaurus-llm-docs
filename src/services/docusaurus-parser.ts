import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import type { Config, DocSection, DocPage, ProcessedDocs } from '../types/index.js';
import { convertHtmlToMarkdown } from '../parsers/html-to-markdown.js';
import { transformLinks } from '../parsers/link-transformer.js';
import { flattenSections } from '../parsers/sidebar-parser.js';
import { log, logDebug, logWarning } from '../utils/logger.js';

/**
 * Process Docusaurus build output and populate documentation content
 */
export async function processDocusaurusBuild(
  config: Config,
  sections: DocSection[]
): Promise<ProcessedDocs> {
  const pages = new Map<string, DocPage>();

  // Get all pages from sections
  const allPages = flattenSections(sections);
  log(`Found ${allPages.length} pages in sidebar configuration`);

  // Build a mapping of doc IDs to HTML files
  const htmlFiles = await findHtmlFiles(config.buildDir);
  const htmlMap = buildHtmlMapping(htmlFiles, config.buildDir);

  logDebug(`Found ${htmlFiles.length} HTML files in build directory`);

  // Process each page
  let processedCount = 0;
  let skippedCount = 0;

  for (const page of allPages) {
    const htmlPath = findHtmlForPage(page, htmlMap, config.buildDir);

    if (!htmlPath) {
      logWarning(`Could not find HTML file for: ${page.id}`);
      skippedCount++;
      continue;
    }

    try {
      // Read and convert HTML to markdown
      const html = await fs.readFile(htmlPath, 'utf-8');
      const { content, title, description } = convertHtmlToMarkdown(html, config.stripHtml);

      // Transform internal links
      const transformedContent = transformLinks(content, config.baseUrl, page.urlPath);

      // Update page with content
      page.content = transformedContent;
      page.title = title || page.title;
      page.description = description || page.description;

      pages.set(page.id, page);
      processedCount++;

      logDebug(`Processed: ${page.id} -> ${page.filePath}`);
    } catch (error) {
      logWarning(`Failed to process ${page.id}: ${error}`);
      skippedCount++;
    }
  }

  log(`Processed ${processedCount} pages, skipped ${skippedCount}`);

  // Also update pages in sections with their content
  updateSectionsWithContent(sections, pages);

  return {
    sections,
    pages,
    totalPages: pages.size,
  };
}

/**
 * Find all HTML files in the build directory
 */
async function findHtmlFiles(buildDir: string): Promise<string[]> {
  const pattern = path.join(buildDir, '**/*.html');
  return glob(pattern, {
    ignore: [
      '**/404.html',
      '**/search/**',
      '**/assets/**',
    ],
  });
}

/**
 * Build a mapping from URL paths to HTML files
 */
function buildHtmlMapping(htmlFiles: string[], buildDir: string): Map<string, string> {
  const mapping = new Map<string, string>();

  for (const htmlFile of htmlFiles) {
    // Get relative path from build dir
    let relativePath = path.relative(buildDir, htmlFile);

    // Normalize path separators
    relativePath = relativePath.replace(/\\/g, '/');

    // Remove .html extension
    let urlPath = relativePath.replace(/\.html$/, '');

    // Handle index.html files
    if (urlPath.endsWith('/index')) {
      urlPath = urlPath.slice(0, -6) || '/';
    } else if (urlPath === 'index') {
      urlPath = '/';
    }

    // Ensure leading slash
    if (!urlPath.startsWith('/')) {
      urlPath = '/' + urlPath;
    }

    mapping.set(urlPath, htmlFile);

    // Also map without leading slash for flexibility
    mapping.set(urlPath.substring(1), htmlFile);
  }

  return mapping;
}

/**
 * Find the HTML file for a given page
 */
function findHtmlForPage(
  page: DocPage,
  htmlMap: Map<string, string>,
  _buildDir: string
): string | null {
  // Try various path formats
  const pathsToTry = [
    page.urlPath,
    page.urlPath.substring(1), // Without leading slash
    page.id,
    `/${page.id}`,
    `${page.urlPath}/index`,
    `${page.id}/index`,
  ];

  for (const tryPath of pathsToTry) {
    if (htmlMap.has(tryPath)) {
      // htmlMap stores absolute paths from glob
      return htmlMap.get(tryPath)!;
    }
  }

  // Fallback: try to find by filename matching
  const filename = page.id.split('/').pop();
  for (const [urlPath, htmlPath] of htmlMap) {
    if (urlPath.endsWith(filename!) || urlPath.endsWith(`/${filename}`)) {
      // htmlMap stores absolute paths from glob
      return htmlPath;
    }
  }

  return null;
}

/**
 * Update sections with content from processed pages
 */
function updateSectionsWithContent(
  sections: DocSection[],
  pages: Map<string, DocPage>
): void {
  for (const section of sections) {
    // Update pages in this section
    for (let i = 0; i < section.pages.length; i++) {
      const pageWithContent = pages.get(section.pages[i].id);
      if (pageWithContent) {
        section.pages[i] = pageWithContent;
      }
    }

    // Update index page
    if (section.indexPage) {
      const indexWithContent = pages.get(section.indexPage.id);
      if (indexWithContent) {
        section.indexPage = indexWithContent;
      }
    }

    // Recursively update subsections
    updateSectionsWithContent(section.subsections, pages);
  }
}

/**
 * Discover documentation pages from build output (without sidebar)
 * Useful as a fallback when sidebar isn't available
 */
export async function discoverPagesFromBuild(
  buildDir: string,
  config: Config
): Promise<DocPage[]> {
  const htmlFiles = await findHtmlFiles(buildDir);
  const pages: DocPage[] = [];

  for (const htmlFile of htmlFiles) {
    const relativePath = path.relative(buildDir, htmlFile);
    const urlPath = '/' + relativePath.replace(/\.html$/, '').replace(/\\/g, '/');

    // Skip certain paths
    if (urlPath.includes('/assets/') || urlPath.includes('/search/')) {
      continue;
    }

    try {
      const html = await fs.readFile(htmlFile, 'utf-8');
      const { content, title, description } = convertHtmlToMarkdown(html, config.stripHtml);

      const transformedContent = transformLinks(content, config.baseUrl, urlPath);

      // Derive file path from URL path
      let filePath = urlPath.replace(/^\//, '');
      if (!filePath || filePath.endsWith('/')) {
        filePath += 'index';
      }
      filePath += '.md';

      pages.push({
        id: urlPath.replace(/^\//, '') || 'index',
        title,
        description,
        urlPath,
        filePath,
        content: transformedContent,
        section: 'docs',
        depth: 0,
        order: pages.length,
      });
    } catch (error) {
      logWarning(`Failed to process ${htmlFile}: ${error}`);
    }
  }

  return pages;
}
