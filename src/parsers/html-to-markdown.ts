import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import type { ParsedHtmlContent } from '../types/index.js';

// Initialize Turndown with sensible defaults for documentation
const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '_',
  strongDelimiter: '**',
  linkStyle: 'inlined',
});

// Custom rule: Handle fenced code blocks with language
turndown.addRule('fencedCodeBlock', {
  filter: (node) => {
    return (
      node.nodeName === 'PRE' &&
      node.firstChild !== null &&
      node.firstChild.nodeName === 'CODE'
    );
  },
  replacement: (_content, node) => {
    const codeElement = node.firstChild as Element;
    const className = codeElement.getAttribute?.('class') || '';
    const languageMatch = className.match(/language-(\w+)/);
    const language = languageMatch ? languageMatch[1] : '';

    // Get innerHTML and convert <br> tags to newlines (Docusaurus Prism code blocks use <br>)
    let code = codeElement.innerHTML || codeElement.textContent || '';
    code = code
      .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> to newlines
      .replace(/<[^>]*>/g, '')         // Remove all other HTML tags
      .replace(/&lt;/g, '<')           // Decode HTML entities
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'");

    return `\n\`\`\`${language}\n${code.trim()}\n\`\`\`\n`;
  },
});

// Custom rule: Handle inline code
turndown.addRule('inlineCode', {
  filter: (node) => {
    return node.nodeName === 'CODE' && node.parentNode?.nodeName !== 'PRE';
  },
  replacement: (content) => {
    if (!content.trim()) return '';
    // Escape backticks inside inline code
    const backtickCount = (content.match(/`+/g) || []).reduce(
      (max, match) => Math.max(max, match.length),
      0
    );
    const delimiter = '`'.repeat(backtickCount + 1);
    return `${delimiter}${content}${delimiter}`;
  },
});

// Custom rule: Handle Docusaurus admonitions (notes, tips, warnings, etc.)
turndown.addRule('admonitions', {
  filter: (node) => {
    const className = node.getAttribute?.('class') || '';
    return (
      node.nodeName === 'DIV' &&
      (className.includes('admonition') || className.includes('alert'))
    );
  },
  replacement: (content, node) => {
    const element = node as Element;
    const className = element.getAttribute?.('class') || '';

    // Determine admonition type
    let type = 'NOTE';
    if (className.includes('warning') || className.includes('caution')) {
      type = 'WARNING';
    } else if (className.includes('tip')) {
      type = 'TIP';
    } else if (className.includes('danger') || className.includes('error')) {
      type = 'CAUTION';
    } else if (className.includes('info')) {
      type = 'NOTE';
    }

    // Format as GitHub-style alert
    const lines = content.trim().split('\n');
    const formattedContent = lines.map((line) => `> ${line}`).join('\n');

    return `\n> [!${type}]\n${formattedContent}\n`;
  },
});

// Custom rule: Remove navigation elements
turndown.addRule('removeNavigation', {
  filter: ['nav', 'footer', 'aside'],
  replacement: () => '',
});

// Custom rule: Handle tables properly
turndown.addRule('tableCell', {
  filter: ['th', 'td'],
  replacement: (content, node) => {
    const element = node as Element;
    const isHeader = element.nodeName === 'TH';
    const cleanContent = content.replace(/\n/g, ' ').trim();
    return isHeader ? ` ${cleanContent} |` : ` ${cleanContent} |`;
  },
});

turndown.addRule('tableRow', {
  filter: 'tr',
  replacement: (content, node) => {
    const element = node as Element;
    const isHeaderRow = element.parentNode?.nodeName === 'THEAD';

    let result = '|' + content + '\n';

    // Add separator after header row
    if (isHeaderRow) {
      const cellCount = element.querySelectorAll('th').length;
      result += '|' + ' --- |'.repeat(cellCount) + '\n';
    }

    return result;
  },
});

/**
 * Convert Docusaurus HTML output to clean Markdown
 */
export function convertHtmlToMarkdown(
  html: string,
  stripHtml: boolean = true
): ParsedHtmlContent {
  const $ = cheerio.load(html);

  // Extract metadata
  const title = extractTitle($);
  const description = extractDescription($);

  // Get the main content area
  const article = $('article').first();

  // If no article tag, try to find the main content container
  const contentElement = article.length > 0 ? article : $('.markdown, .theme-doc-markdown, main');

  // Remove unwanted elements before conversion
  contentElement.find([
    'nav',
    'footer',
    'aside',
    '.theme-doc-breadcrumbs',
    '.theme-doc-toc-mobile',
    '.theme-doc-toc-desktop',
    '.theme-doc-footer',
    '.pagination-nav',
    '.theme-edit-this-page',
    '.theme-last-updated',
    'script',
    'style',
    '.hash-link',
    '.anchor',
    '[aria-hidden="true"]',
  ].join(', ')).remove();

  // Remove the first h1 if it matches the title (to avoid duplication)
  const firstH1 = contentElement.find('h1').first();
  if (firstH1.length > 0 && firstH1.text().trim() === title) {
    firstH1.remove();
  }

  // Get the HTML content
  const contentHtml = contentElement.html() || '';

  // Convert to markdown
  let content = turndown.turndown(contentHtml);

  // Post-processing cleanup
  content = cleanupMarkdown(content);

  // Optionally strip any remaining HTML tags
  if (stripHtml) {
    content = removeRemainingHtml(content);
  }

  // Add title as h1 at the beginning
  if (title) {
    content = `# ${title}\n\n${content}`;
  }

  return {
    content: content.trim(),
    title,
    description,
  };
}

/**
 * Extract page title from HTML
 */
function extractTitle($: cheerio.CheerioAPI): string {
  // Try various sources for the title
  const sources = [
    () => $('article h1').first().text(),
    () => $('h1').first().text(),
    () => $('meta[property="og:title"]').attr('content'),
    () => $('title').text().split('|')[0],
  ];

  for (const source of sources) {
    const title = source()?.trim();
    if (title) {
      return title;
    }
  }

  return 'Untitled';
}

/**
 * Extract page description from HTML metadata
 */
function extractDescription($: cheerio.CheerioAPI): string | undefined {
  const sources = [
    () => $('meta[name="description"]').attr('content'),
    () => $('meta[property="og:description"]').attr('content'),
  ];

  for (const source of sources) {
    const description = source()?.trim();
    if (description) {
      return description;
    }
  }

  return undefined;
}

/**
 * Clean up markdown content after conversion
 */
function cleanupMarkdown(content: string): string {
  return (
    content
      // Remove excessive blank lines
      .replace(/\n{3,}/g, '\n\n')
      // Fix code block spacing
      .replace(/```(\w*)\n\n/g, '```$1\n')
      .replace(/\n\n```/g, '\n```')
      // Remove trailing spaces
      .replace(/[ \t]+$/gm, '')
      // Ensure newline at end
      .trim() + '\n'
  );
}

/**
 * Remove any remaining HTML tags from markdown (preserve code blocks)
 */
function removeRemainingHtml(content: string): string {
  // Preserve code blocks
  const codeBlocks: string[] = [];
  let processed = content.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODEBLOCK_${codeBlocks.length - 1}__`;
  });

  // Preserve inline code
  const inlineCode: string[] = [];
  processed = processed.replace(/`[^`]+`/g, (match) => {
    inlineCode.push(match);
    return `__INLINECODE_${inlineCode.length - 1}__`;
  });

  // Remove HTML tags
  processed = processed.replace(/<[^>]*>/g, '');

  // Restore inline code
  processed = processed.replace(/__INLINECODE_(\d+)__/g, (_, index) => inlineCode[parseInt(index)]);

  // Restore code blocks
  processed = processed.replace(/__CODEBLOCK_(\d+)__/g, (_, index) => codeBlocks[parseInt(index)]);

  return processed;
}
