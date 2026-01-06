/**
 * Simple logger for GitHub Actions compatible output
 */

const isGitHubActions = !!process.env.GITHUB_ACTIONS;

/**
 * Log a message to stdout
 */
export function log(message: string): void {
  console.log(message);
}

/**
 * Log an error message
 */
export function logError(message: string): void {
  if (isGitHubActions) {
    console.log(`::error::${message}`);
  } else {
    console.error(`ERROR: ${message}`);
  }
}

/**
 * Log a warning message
 */
export function logWarning(message: string): void {
  if (isGitHubActions) {
    console.log(`::warning::${message}`);
  } else {
    console.warn(`WARNING: ${message}`);
  }
}

/**
 * Log a debug message (only visible when ACTIONS_STEP_DEBUG is set)
 */
export function logDebug(message: string): void {
  if (isGitHubActions) {
    console.log(`::debug::${message}`);
  } else if (process.env.DEBUG) {
    console.log(`DEBUG: ${message}`);
  }
}

/**
 * Start a collapsible log group
 */
export function logGroup(title: string): void {
  if (isGitHubActions) {
    console.log(`::group::${title}`);
  } else {
    console.log(`\n=== ${title} ===`);
  }
}

/**
 * End a collapsible log group
 */
export function logGroupEnd(): void {
  if (isGitHubActions) {
    console.log('::endgroup::');
  }
}

/**
 * Set an output variable for GitHub Actions
 */
export async function setOutput(name: string, value: string | number): Promise<void> {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    const fs = await import('fs/promises');
    await fs.appendFile(outputFile, `${name}=${value}\n`);
  } else {
    log(`Output ${name}=${value}`);
  }
}
