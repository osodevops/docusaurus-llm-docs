import path from 'path';

/**
 * Transform all internal links in markdown content to absolute URLs with .md extension
 */
export function transformLinks(
  content: string,
  baseUrl: string,
  currentUrlPath: string
): string {
  // Match markdown links: [text](url)
  return content.replace(
    /\[([^\]]*)\]\(([^)]+)\)/g,
    (_match, text, href) => {
      const transformedHref = transformSingleLink(href, baseUrl, currentUrlPath);
      return `[${text}](${transformedHref})`;
    }
  );
}

/**
 * Transform a single link URL
 */
export function transformSingleLink(
  href: string,
  baseUrl: string,
  currentUrlPath: string
): string {
  // Skip external links
  if (isExternalLink(href)) {
    return href;
  }

  // Skip anchor-only links (but keep them)
  if (href.startsWith('#')) {
    return href;
  }

  // Skip mailto and tel links
  if (href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href;
  }

  // Skip data URLs
  if (href.startsWith('data:')) {
    return href;
  }

  // Extract the base path from the baseUrl (e.g., "/kafka-backup-docs" from "https://site.com/kafka-backup-docs")
  const baseUrlObj = new URL(baseUrl);
  const basePath = baseUrlObj.pathname.replace(/\/$/, ''); // Remove trailing slash

  // Strip the base path from href if it already contains it (common in Docusaurus builds)
  let cleanHref = href;
  if (basePath && cleanHref.startsWith(basePath)) {
    cleanHref = cleanHref.substring(basePath.length) || '/';
  }

  // Handle relative URLs
  const absolutePath = resolveRelativeUrl(cleanHref, currentUrlPath);

  // Convert to markdown file path
  const mdPath = toMarkdownPath(absolutePath);

  // Combine with base URL
  return `${baseUrl}${mdPath}`;
}

/**
 * Check if a URL is external
 */
function isExternalLink(href: string): boolean {
  return (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//')
  );
}

/**
 * Resolve a relative URL to an absolute path
 */
function resolveRelativeUrl(href: string, currentUrlPath: string): string {
  // Already absolute
  if (href.startsWith('/')) {
    return href;
  }

  // Get current directory
  const currentDir = path.dirname(currentUrlPath);

  // Split href into path and anchor
  const [pathPart, anchor] = href.split('#');

  // Resolve the path
  const parts = [...currentDir.split('/').filter(Boolean), ...pathPart.split('/').filter(Boolean)];
  const resolved: string[] = [];

  for (const part of parts) {
    if (part === '..') {
      resolved.pop();
    } else if (part !== '.') {
      resolved.push(part);
    }
  }

  let result = '/' + resolved.join('/');

  // Re-add anchor if present
  if (anchor) {
    result += '#' + anchor;
  }

  return result;
}

/**
 * Convert a URL path to a markdown file path
 */
function toMarkdownPath(urlPath: string): string {
  // Split path and anchor
  const [pathPart, anchor] = urlPath.split('#');

  // Remove trailing slash
  let cleanPath = pathPart.replace(/\/$/, '');

  // Remove .html extension if present
  cleanPath = cleanPath.replace(/\.html$/, '');

  // Handle empty path (root)
  if (cleanPath === '' || cleanPath === '/') {
    cleanPath = '/index';
  }

  // Add .md extension if not present and doesn't have another extension
  if (!cleanPath.endsWith('.md') && !path.extname(cleanPath)) {
    cleanPath = cleanPath + '.md';
  } else if (!cleanPath.endsWith('.md')) {
    // Replace other extensions with .md
    cleanPath = cleanPath.replace(/\.[^.]+$/, '.md');
  }

  // Re-add anchor if present
  if (anchor) {
    cleanPath += '#' + anchor;
  }

  return cleanPath;
}

/**
 * Extract all internal links from markdown content
 */
export function extractInternalLinks(content: string): string[] {
  const links: string[] = [];
  const regex = /\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const href = match[2];
    if (!isExternalLink(href) && !href.startsWith('#') && !href.startsWith('mailto:')) {
      links.push(href);
    }
  }

  return links;
}

/**
 * Validate that all internal links point to existing pages
 */
export function validateLinks(
  content: string,
  availablePaths: Set<string>,
  currentPath: string
): { valid: boolean; brokenLinks: string[] } {
  const links = extractInternalLinks(content);
  const brokenLinks: string[] = [];

  for (const href of links) {
    const absolutePath = resolveRelativeUrl(href.split('#')[0], currentPath);
    const mdPath = toMarkdownPath(absolutePath);

    // Check if the path exists (without extension variants)
    const pathWithoutExt = mdPath.replace(/\.md$/, '');
    const variants = [
      mdPath,
      pathWithoutExt,
      pathWithoutExt + '/index.md',
      pathWithoutExt + '.md',
    ];

    const exists = variants.some(
      (v) => availablePaths.has(v) || availablePaths.has(v.replace(/^\//, ''))
    );

    if (!exists) {
      brokenLinks.push(href);
    }
  }

  return {
    valid: brokenLinks.length === 0,
    brokenLinks,
  };
}
