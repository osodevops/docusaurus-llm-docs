import type { DocSection, DocPage } from '../types/index.js';
/**
 * Parse a Docusaurus sidebars.js file and return structured sections
 */
export declare function parseSidebar(sidebarPath: string): Promise<DocSection[]>;
/**
 * Flatten all pages from sections into a single array
 */
export declare function flattenSections(sections: DocSection[]): DocPage[];
/**
 * Count total pages in sections
 */
export declare function countPages(sections: DocSection[]): number;
//# sourceMappingURL=sidebar-parser.d.ts.map