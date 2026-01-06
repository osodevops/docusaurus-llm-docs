/**
 * Ensure a directory exists, creating it if necessary
 */
export declare function ensureDir(dirPath: string): Promise<void>;
/**
 * Write content to a file, creating parent directories if needed
 */
export declare function writeFile(filePath: string, content: string): Promise<void>;
/**
 * Read a file's content
 */
export declare function readFile(filePath: string): Promise<string>;
/**
 * Check if a file exists
 */
export declare function fileExists(filePath: string): Promise<boolean>;
/**
 * List all files in a directory matching a pattern
 */
export declare function listFiles(dirPath: string, pattern?: RegExp): Promise<string[]>;
/**
 * Get the relative path from one path to another
 */
export declare function getRelativePath(from: string, to: string): string;
/**
 * Normalize a URL path (ensure leading slash, no trailing slash)
 */
export declare function normalizeUrlPath(urlPath: string): string;
/**
 * Convert a URL path to a file system path
 */
export declare function urlPathToFilePath(urlPath: string): string;
//# sourceMappingURL=filesystem.d.ts.map