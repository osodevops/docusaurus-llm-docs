/**
 * Sanitize a string for use as a filename
 */
export function sanitizeFilename(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\-_.]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
/**
 * Sanitize a string for use as a URL slug
 */
export function sanitizeSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\-_/]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
/**
 * Extract a clean title from a doc ID
 */
export function docIdToTitle(docId) {
    // Get the last segment
    const lastSegment = docId.split('/').pop() || docId;
    // Convert kebab-case or snake_case to Title Case
    return lastSegment
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}
/**
 * Clean up markdown content
 */
export function cleanMarkdown(content) {
    return content
        // Remove multiple consecutive blank lines
        .replace(/\n{3,}/g, '\n\n')
        // Remove leading/trailing whitespace
        .trim();
}
/**
 * Escape special characters for use in markdown
 */
export function escapeMarkdown(text) {
    return text.replace(/([\\`*_{}[\]()#+\-.!])/g, '\\$1');
}
/**
 * Remove any remaining HTML tags from markdown
 */
export function stripHtmlTags(content) {
    // Preserve code blocks
    const codeBlocks = [];
    let processed = content.replace(/```[\s\S]*?```/g, (match) => {
        codeBlocks.push(match);
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });
    // Remove HTML tags
    processed = processed.replace(/<[^>]*>/g, '');
    // Restore code blocks
    processed = processed.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => codeBlocks[parseInt(index)]);
    return processed;
}
//# sourceMappingURL=sanitize.js.map