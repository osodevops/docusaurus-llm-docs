import type { ProcessedDocs, Config } from '../types/index.js';
/**
 * Generate the llms.txt index file content
 */
export declare function generateLlmsTxt(docs: ProcessedDocs, config: Config): string;
/**
 * Generate a table of contents for llms.txt
 */
export declare function generateTableOfContents(docs: ProcessedDocs): string[];
/**
 * Generate statistics section for llms.txt
 */
export declare function generateStats(docs: ProcessedDocs): string[];
//# sourceMappingURL=llms-txt.d.ts.map