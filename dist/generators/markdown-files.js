import path from 'path';
import { writeFile, ensureDir } from '../utils/filesystem.js';
import { logDebug } from '../utils/logger.js';
/**
 * Generate all markdown files from processed documentation
 */
export async function generateMarkdownFiles(docs, config) {
    const markdownDir = path.join(config.outputDir, 'markdown');
    await ensureDir(markdownDir);
    let filesGenerated = 0;
    for (const [, page] of docs.pages) {
        // Skip pages without content
        if (!page.content || page.content.trim() === '') {
            logDebug(`Skipping empty page: ${page.id}`);
            continue;
        }
        const filePath = path.join(markdownDir, page.filePath);
        // Ensure parent directory exists
        await ensureDir(path.dirname(filePath));
        // Write the markdown file
        await writeFile(filePath, page.content);
        filesGenerated++;
        logDebug(`Generated: ${page.filePath}`);
    }
    return filesGenerated;
}
/**
 * Generate an index.md file for a directory
 */
export async function generateDirectoryIndex(dirPath, pages) {
    const lines = [];
    // Get directory name for title
    const dirName = path.basename(dirPath);
    const title = dirName.charAt(0).toUpperCase() + dirName.slice(1).replace(/-/g, ' ');
    lines.push(`# ${title}`);
    lines.push('');
    lines.push('## Pages in this section');
    lines.push('');
    for (const page of pages) {
        const relativePath = path.relative(dirPath, page.filePath);
        lines.push(`- [${page.title}](${relativePath})`);
        if (page.description) {
            lines.push(`  ${page.description}`);
        }
    }
    lines.push('');
    await writeFile(path.join(dirPath, 'index.md'), lines.join('\n'));
}
/**
 * Copy static assets referenced in markdown files
 */
export async function copyReferencedAssets(_docs, _buildDir, _outputDir) {
    // For now, we skip asset copying as LLM docs are text-focused
    // This could be extended to handle images if needed
    return 0;
}
//# sourceMappingURL=markdown-files.js.map