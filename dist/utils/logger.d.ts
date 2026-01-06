/**
 * Simple logger for GitHub Actions compatible output
 */
/**
 * Log a message to stdout
 */
export declare function log(message: string): void;
/**
 * Log an error message
 */
export declare function logError(message: string): void;
/**
 * Log a warning message
 */
export declare function logWarning(message: string): void;
/**
 * Log a debug message (only visible when ACTIONS_STEP_DEBUG is set)
 */
export declare function logDebug(message: string): void;
/**
 * Start a collapsible log group
 */
export declare function logGroup(title: string): void;
/**
 * End a collapsible log group
 */
export declare function logGroupEnd(): void;
/**
 * Set an output variable for GitHub Actions
 */
export declare function setOutput(name: string, value: string | number): Promise<void>;
//# sourceMappingURL=logger.d.ts.map