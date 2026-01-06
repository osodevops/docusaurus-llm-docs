import type { ProcessedDocs, Config } from '../types/index.js';
/**
 * Generate all markdown files from processed documentation
 */
export declare function generateMarkdownFiles(docs: ProcessedDocs, config: Config): Promise<number>;
/**
 * Generate an index.md file for a directory
 */
export declare function generateDirectoryIndex(dirPath: string, pages: Array<{
    title: string;
    filePath: string;
    description?: string;
}>): Promise<void>;
/**
 * Copy static assets referenced in markdown files
 */
export declare function copyReferencedAssets(_docs: ProcessedDocs, _buildDir: string, _outputDir: string): Promise<number>;
//# sourceMappingURL=markdown-files.d.ts.map