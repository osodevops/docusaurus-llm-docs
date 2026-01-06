import path from 'path';
import { loadConfig } from './utils/config.js';
import { parseSidebar, countPages } from './parsers/sidebar-parser.js';
import { processDocusaurusBuild, discoverPagesFromBuild } from './services/docusaurus-parser.js';
import { injectSidebarLinks } from './services/sidebar-injector.js';
import { generateLlmsTxt } from './generators/llms-txt.js';
import { generateMarkdownFiles } from './generators/markdown-files.js';
import { createMarkdownArchive } from './generators/archive.js';
import { ensureDir, writeFile, fileExists } from './utils/filesystem.js';
import { log, logGroup, logGroupEnd, logError, logWarning, setOutput } from './utils/logger.js';
import type { GenerationResult, GenerationStats, ProcessedDocs, DocSection } from './types/index.js';

async function main(): Promise<void> {
  const stats: GenerationStats = {
    startTime: new Date(),
    pagesProcessed: 0,
    sectionsProcessed: 0,
    filesWritten: 0,
    errors: [],
    warnings: [],
  };

  try {
    log('');
    log('===========================================');
    log('  Docusaurus LLM Docs Generator');
    log('===========================================');
    log('');

    // 1. Load configuration
    logGroup('Loading configuration');
    const config = loadConfig();
    log(`Build directory: ${config.buildDir}`);
    log(`Output directory: ${config.outputDir}`);
    log(`Base URL: ${config.baseUrl}`);
    log(`Product name: ${config.productName}`);
    logGroupEnd();

    // 2. Validate build directory exists
    if (!(await fileExists(config.buildDir))) {
      throw new Error(`Build directory not found: ${config.buildDir}`);
    }

    // 3. Parse sidebar structure (or discover from build)
    logGroup('Parsing documentation structure');
    let sections: DocSection[] = [];
    let docs: ProcessedDocs;

    if (await fileExists(config.sidebarPath)) {
      log(`Using sidebar: ${config.sidebarPath}`);
      sections = await parseSidebar(config.sidebarPath);
      stats.sectionsProcessed = sections.length;
      log(`Found ${sections.length} top-level sections with ${countPages(sections)} pages`);
      logGroupEnd();

      // 4. Process Docusaurus build output
      logGroup('Processing Docusaurus build');
      docs = await processDocusaurusBuild(config, sections);
    } else {
      logWarning(`Sidebar not found at ${config.sidebarPath}, discovering pages from build`);
      logGroupEnd();

      // Discover pages from build output
      logGroup('Discovering pages from build output');
      const discoveredPages = await discoverPagesFromBuild(config.buildDir, config);
      log(`Discovered ${discoveredPages.length} pages`);

      // Create a single section for all discovered pages
      sections = [{
        name: 'docs',
        label: 'Documentation',
        pages: discoveredPages,
        subsections: [],
        depth: 0,
        order: 0,
      }];

      docs = {
        sections,
        pages: new Map(discoveredPages.map(p => [p.id, p])),
        totalPages: discoveredPages.length,
      };
    }

    stats.pagesProcessed = docs.totalPages;
    log(`Processed ${docs.totalPages} documentation pages`);
    logGroupEnd();

    // 5. Create output directory
    await ensureDir(config.outputDir);

    // 6. Generate llms.txt
    logGroup('Generating llms.txt');
    const llmsTxt = generateLlmsTxt(docs, config);
    const llmsTxtPath = path.join(config.outputDir, 'llms.txt');
    await writeFile(llmsTxtPath, llmsTxt);
    log(`Generated: llms.txt`);
    logGroupEnd();

    // 7. Generate markdown files
    logGroup('Generating markdown files');
    const filesGenerated = await generateMarkdownFiles(docs, config);
    stats.filesWritten = filesGenerated;
    log(`Generated ${filesGenerated} markdown files`);
    logGroupEnd();

    // 8. Create markdown.zip archive
    logGroup('Creating markdown.zip archive');
    const markdownDir = path.join(config.outputDir, 'markdown');
    const zipPath = path.join(config.outputDir, 'markdown.zip');
    await createMarkdownArchive(markdownDir, zipPath);
    log(`Created: markdown.zip`);
    logGroupEnd();

    // 9. Inject sidebar links into built HTML (if enabled)
    if (config.injectSidebar) {
      logGroup('Injecting LLM Resources into sidebar');
      const injectedCount = await injectSidebarLinks(config);
      log(`Sidebar injection complete: ${injectedCount} files updated`);
      logGroupEnd();
    }

    // 10. Set GitHub Actions outputs
    const result: GenerationResult = {
      llmsTxtPath,
      markdownZipPath: zipPath,
      markdownDir,
      filesGenerated,
      sectionsCount: stats.sectionsProcessed,
    };

    await setOutput('llms_txt_path', result.llmsTxtPath);
    await setOutput('markdown_zip_path', result.markdownZipPath);
    await setOutput('files_generated', result.filesGenerated);
    await setOutput('sections_count', result.sectionsCount);

    // 11. Print summary
    stats.endTime = new Date();
    const duration = (stats.endTime.getTime() - stats.startTime.getTime()) / 1000;

    log('');
    log('===========================================');
    log('  Generation Complete!');
    log('===========================================');
    log('');
    log(`  Pages processed:  ${stats.pagesProcessed}`);
    log(`  Files generated:  ${stats.filesWritten}`);
    log(`  Sections:         ${stats.sectionsProcessed}`);
    log(`  Duration:         ${duration.toFixed(2)}s`);
    log('');
    log('  Output files:');
    log(`    - ${llmsTxtPath}`);
    log(`    - ${zipPath}`);
    log(`    - ${markdownDir}/`);
    log('');

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stats.errors.push(message);

    logError(message);

    if (error instanceof Error && error.stack) {
      log('');
      log('Stack trace:');
      log(error.stack);
    }

    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  logError(`Unexpected error: ${error}`);
  process.exit(1);
});
