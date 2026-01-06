import type { Config, DocSection, DocPage, ProcessedDocs } from '../types/index.js';
/**
 * Process Docusaurus build output and populate documentation content
 */
export declare function processDocusaurusBuild(config: Config, sections: DocSection[]): Promise<ProcessedDocs>;
/**
 * Discover documentation pages from build output (without sidebar)
 * Useful as a fallback when sidebar isn't available
 */
export declare function discoverPagesFromBuild(buildDir: string, config: Config): Promise<DocPage[]>;
//# sourceMappingURL=docusaurus-parser.d.ts.map