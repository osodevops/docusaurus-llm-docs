/**
 * Generate llms-full.txt content with all documentation in a single file
 * Following the Cloudflare format with <page> delimiters
 */
export function generateLlmsFullTxt(docs, config) {
    const lines = [];
    // Header
    lines.push(`# ${config.productName} Documentation`);
    lines.push('');
    if (config.tagline) {
        lines.push(config.tagline);
        lines.push('');
    }
    lines.push('> This file contains the complete documentation in a single file for LLM consumption.');
    lines.push(`> For a lightweight index, see ${config.baseUrl}/llms.txt`);
    lines.push(`> For individual markdown files, download ${config.baseUrl}/markdown.zip`);
    lines.push('');
    // Process all sections and pages
    for (const section of docs.sections) {
        processSection(section, lines, config);
    }
    return lines.join('\n');
}
/**
 * Process a section and its pages/subsections
 */
function processSection(section, lines, config) {
    // Process pages in this section
    for (const page of section.pages) {
        addPageBlock(page, lines, config);
    }
    // Process subsections
    for (const subsection of section.subsections) {
        processSection(subsection, lines, config);
    }
}
/**
 * Add a single page block in the Cloudflare format
 */
function addPageBlock(page, lines, config) {
    const htmlUrl = `${config.baseUrl}${page.urlPath}`;
    const mdUrl = `${config.baseUrl}${page.urlPath}.md`;
    lines.push('<page>');
    lines.push('---');
    lines.push(`title: ${page.title}`);
    if (page.description) {
        lines.push(`description: ${page.description}`);
    }
    lines.push(`source_url:`);
    lines.push(`  html: ${htmlUrl}`);
    lines.push(`  md: ${mdUrl}`);
    lines.push('---');
    lines.push('');
    // Add the page content
    if (page.content) {
        lines.push(page.content.trim());
    }
    lines.push('');
    lines.push('</page>');
    lines.push('');
}
//# sourceMappingURL=llms-full.js.map