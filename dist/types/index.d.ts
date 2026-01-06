/**
 * Configuration types
 */
export interface Config {
    buildDir: string;
    outputDir: string;
    baseUrl: string;
    productName: string;
    tagline: string;
    sidebarPath: string;
    includeDescriptions: boolean;
    stripHtml: boolean;
    injectSidebar: boolean;
    workspaceDir: string;
}
/**
 * Docusaurus sidebar types
 */
export type SidebarItem = SidebarItemDoc | SidebarItemCategory | SidebarItemLink | string;
export interface SidebarItemDoc {
    type: 'doc';
    id: string;
    label?: string;
    className?: string;
}
export interface SidebarItemCategory {
    type: 'category';
    label: string;
    items: SidebarItem[];
    collapsed?: boolean;
    collapsible?: boolean;
    className?: string;
    link?: {
        type: 'doc' | 'generated-index';
        id?: string;
        title?: string;
        description?: string;
        slug?: string;
    };
}
export interface SidebarItemLink {
    type: 'link';
    label: string;
    href: string;
    className?: string;
}
export interface SidebarItemHtml {
    type: 'html';
    value: string;
    className?: string;
}
export interface Sidebar {
    [key: string]: SidebarItem[];
}
/**
 * Processed documentation types
 */
export interface DocPage {
    id: string;
    title: string;
    description?: string;
    urlPath: string;
    filePath: string;
    content: string;
    section: string;
    depth: number;
    order: number;
}
export interface DocSection {
    name: string;
    label: string;
    pages: DocPage[];
    subsections: DocSection[];
    depth: number;
    order: number;
    indexPage?: DocPage;
}
export interface ProcessedDocs {
    sections: DocSection[];
    pages: Map<string, DocPage>;
    totalPages: number;
}
/**
 * HTML parsing types
 */
export interface ParsedHtmlContent {
    content: string;
    title: string;
    description?: string;
}
/**
 * Output types
 */
export interface GenerationResult {
    llmsTxtPath: string;
    llmsFullTxtPath: string;
    markdownZipPath: string;
    markdownDir: string;
    filesGenerated: number;
    sectionsCount: number;
}
/**
 * Statistics types
 */
export interface GenerationStats {
    startTime: Date;
    endTime?: Date;
    pagesProcessed: number;
    sectionsProcessed: number;
    filesWritten: number;
    errors: string[];
    warnings: string[];
}
/**
 * File mapping for build output
 */
export interface BuildFileMapping {
    htmlPath: string;
    urlPath: string;
    docId: string;
}
//# sourceMappingURL=index.d.ts.map