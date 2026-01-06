import { z } from 'zod';
import path from 'path';
import type { Config } from '../types/index.js';

const configSchema = z.object({
  buildDir: z.string().default('./build'),
  outputDir: z.string().default('./llm-docs'),
  baseUrl: z
    .string()
    .url('BASE_URL must be a valid URL')
    .transform((url) => url.replace(/\/$/, '')), // Remove trailing slash
  productName: z.string().min(1, 'PRODUCT_NAME is required'),
  tagline: z.string().default(''),
  sidebarPath: z.string().default('./sidebars.js'),
  includeDescriptions: z.boolean().default(true),
  stripHtml: z.boolean().default(true),
  workspaceDir: z.string(),
});

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): Config {
  const workspaceDir = process.env.WORKSPACE_DIR || process.env.GITHUB_WORKSPACE || process.cwd();

  const raw = {
    buildDir: resolvePath(process.env.BUILD_DIR || './build', workspaceDir),
    outputDir: resolvePath(process.env.OUTPUT_DIR || './llm-docs', workspaceDir),
    baseUrl: process.env.BASE_URL,
    productName: process.env.PRODUCT_NAME,
    tagline: process.env.TAGLINE || '',
    sidebarPath: resolvePath(process.env.SIDEBAR_PATH || './sidebars.js', workspaceDir),
    includeDescriptions: parseBool(process.env.INCLUDE_DESCRIPTIONS, true),
    stripHtml: parseBool(process.env.STRIP_HTML, true),
    workspaceDir,
  };

  const result = configSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }

  return result.data;
}

/**
 * Resolve a path relative to the workspace directory
 */
function resolvePath(inputPath: string, workspaceDir: string): string {
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }
  return path.resolve(workspaceDir, inputPath);
}

/**
 * Parse a boolean from environment variable string
 */
function parseBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return value.toLowerCase() === 'true' || value === '1';
}
