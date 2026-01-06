/**
 * Sanitize a string for use as a filename
 */
export declare function sanitizeFilename(name: string): string;
/**
 * Sanitize a string for use as a URL slug
 */
export declare function sanitizeSlug(name: string): string;
/**
 * Extract a clean title from a doc ID
 */
export declare function docIdToTitle(docId: string): string;
/**
 * Clean up markdown content
 */
export declare function cleanMarkdown(content: string): string;
/**
 * Escape special characters for use in markdown
 */
export declare function escapeMarkdown(text: string): string;
/**
 * Remove any remaining HTML tags from markdown
 */
export declare function stripHtmlTags(content: string): string;
//# sourceMappingURL=sanitize.d.ts.map