/**
 * Create a ZIP archive of all markdown files
 */
export declare function createMarkdownArchive(markdownDir: string, outputPath: string): Promise<string>;
/**
 * Create a tarball archive (alternative format)
 */
export declare function createMarkdownTarball(markdownDir: string, outputPath: string): Promise<string>;
/**
 * Calculate the total size of files in a directory
 */
export declare function calculateDirectorySize(dirPath: string): Promise<number>;
//# sourceMappingURL=archive.d.ts.map