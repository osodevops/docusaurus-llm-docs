import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { log, logDebug } from '../utils/logger.js';
/**
 * Create a ZIP archive of all markdown files
 */
export async function createMarkdownArchive(markdownDir, outputPath) {
    return new Promise((resolve, reject) => {
        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', {
            zlib: { level: 9 }, // Maximum compression
        });
        let fileCount = 0;
        output.on('close', () => {
            const sizeKB = (archive.pointer() / 1024).toFixed(2);
            log(`Archive created: ${sizeKB} KB, ${fileCount} files`);
            resolve(outputPath);
        });
        output.on('error', (err) => {
            reject(new Error(`Failed to write archive: ${err.message}`));
        });
        archive.on('error', (err) => {
            reject(new Error(`Archive creation failed: ${err.message}`));
        });
        archive.on('entry', () => {
            fileCount++;
        });
        archive.on('warning', (err) => {
            if (err.code === 'ENOENT') {
                logDebug(`Archive warning: ${err.message}`);
            }
            else {
                reject(err);
            }
        });
        // Pipe archive data to the file
        archive.pipe(output);
        // Add the markdown directory to the archive
        // Files will be at markdown/... in the archive
        archive.directory(markdownDir, 'markdown');
        // Finalize the archive
        archive.finalize();
    });
}
/**
 * Create a tarball archive (alternative format)
 */
export async function createMarkdownTarball(markdownDir, outputPath) {
    return new Promise((resolve, reject) => {
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('tar', {
            gzip: true,
            gzipOptions: { level: 9 },
        });
        output.on('close', () => {
            resolve(outputPath);
        });
        output.on('error', (err) => {
            reject(err);
        });
        archive.on('error', (err) => {
            reject(err);
        });
        archive.pipe(output);
        archive.directory(markdownDir, 'markdown');
        archive.finalize();
    });
}
/**
 * Calculate the total size of files in a directory
 */
export async function calculateDirectorySize(dirPath) {
    let totalSize = 0;
    const processDirectory = async (dir) => {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await processDirectory(fullPath);
            }
            else if (entry.isFile()) {
                const stats = await fs.promises.stat(fullPath);
                totalSize += stats.size;
            }
        }
    };
    await processDirectory(dirPath);
    return totalSize;
}
//# sourceMappingURL=archive.js.map