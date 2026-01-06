import fs from 'fs/promises';
import path from 'path';

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Write content to a file, creating parent directories if needed
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Read a file's content
 */
export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * List all files in a directory matching a pattern
 */
export async function listFiles(dirPath: string, pattern?: RegExp): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true, recursive: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isFile()) {
      const fullPath = path.join(entry.parentPath || entry.path, entry.name);
      if (!pattern || pattern.test(fullPath)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Get the relative path from one path to another
 */
export function getRelativePath(from: string, to: string): string {
  return path.relative(path.dirname(from), to);
}

/**
 * Normalize a URL path (ensure leading slash, no trailing slash)
 */
export function normalizeUrlPath(urlPath: string): string {
  let normalized = urlPath.replace(/\\/g, '/');

  // Ensure leading slash
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  // Remove trailing slash (except for root)
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

/**
 * Convert a URL path to a file system path
 */
export function urlPathToFilePath(urlPath: string): string {
  let filePath = urlPath.replace(/^\//, '');

  // Handle index pages
  if (filePath === '' || filePath.endsWith('/')) {
    filePath = filePath + 'index';
  }

  // Ensure .md extension
  if (!filePath.endsWith('.md')) {
    filePath = filePath + '.md';
  }

  return filePath;
}
