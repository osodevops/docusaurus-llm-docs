/**
 * Generate the llms.txt index file content
 */
export function generateLlmsTxt(docs, config) {
    const lines = [];
    // Header
    lines.push(`# ${config.productName} Documentation`);
    lines.push('');
    // Tagline
    if (config.tagline) {
        lines.push(config.tagline);
        lines.push('');
    }
    // Tip about markdown archive
    lines.push('> [!TIP]');
    lines.push(`> A complete archive of all documentation in Markdown format is available at ${config.baseUrl}/markdown.zip`);
    lines.push('');
    // Generate sections
    for (const section of docs.sections) {
        lines.push(...generateSection(section, config, 0));
    }
    return lines.join('\n');
}
/**
 * Generate a section and its contents
 */
function generateSection(section, config, depth) {
    const lines = [];
    const indent = '  '.repeat(depth);
    // Section header (## for top-level, ### for nested, etc.)
    const headerLevel = Math.min(depth + 2, 6); // ##, ###, ####, etc., max ######
    const headerPrefix = '#'.repeat(headerLevel);
    lines.push(`${headerPrefix} ${section.label}`);
    lines.push('');
    // Index page for section (if exists)
    if (section.indexPage) {
        lines.push(formatPageLink(section.indexPage, config, indent));
    }
    // Pages in this section
    for (const page of section.pages) {
        lines.push(formatPageLink(page, config, indent));
    }
    // Subsections
    for (const subsection of section.subsections) {
        lines.push(...generateSection(subsection, config, depth + 1));
    }
    lines.push('');
    return lines;
}
/**
 * Format a single page link
 */
function formatPageLink(page, config, indent) {
    const url = `${config.baseUrl}/${page.filePath}`;
    let line = `${indent}- [${page.title}](${url})`;
    // Add description if available and enabled
    if (config.includeDescriptions && page.description) {
        // Truncate long descriptions
        const maxDescLength = 100;
        let desc = page.description;
        if (desc.length > maxDescLength) {
            desc = desc.substring(0, maxDescLength - 3) + '...';
        }
        line += `: ${desc}`;
    }
    return line;
}
/**
 * Generate a table of contents for llms.txt
 */
export function generateTableOfContents(docs) {
    const lines = [];
    lines.push('## Table of Contents');
    lines.push('');
    for (const section of docs.sections) {
        lines.push(`- [${section.label}](#${slugify(section.label)})`);
        for (const subsection of section.subsections) {
            lines.push(`  - [${subsection.label}](#${slugify(subsection.label)})`);
        }
    }
    lines.push('');
    return lines;
}
/**
 * Convert a label to a URL-safe slug
 */
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}
/**
 * Generate statistics section for llms.txt
 */
export function generateStats(docs) {
    const lines = [];
    lines.push('---');
    lines.push('');
    lines.push(`_This documentation contains ${docs.totalPages} pages across ${docs.sections.length} sections._`);
    lines.push('');
    return lines;
}
//# sourceMappingURL=llms-txt.js.map