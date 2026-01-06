/**
 * Transform all internal links in markdown content to absolute URLs with .md extension
 */
export declare function transformLinks(content: string, baseUrl: string, currentUrlPath: string): string;
/**
 * Transform a single link URL
 */
export declare function transformSingleLink(href: string, baseUrl: string, currentUrlPath: string): string;
/**
 * Extract all internal links from markdown content
 */
export declare function extractInternalLinks(content: string): string[];
/**
 * Validate that all internal links point to existing pages
 */
export declare function validateLinks(content: string, availablePaths: Set<string>, currentPath: string): {
    valid: boolean;
    brokenLinks: string[];
};
//# sourceMappingURL=link-transformer.d.ts.map