/**
 * Security utilities for Canopy.
 */

/**
 * Sanitizes input text to be safe for inclusion in LLM prompts.
 * Prevents Prompt Injection by neutralizing control characters and delimiters.
 *
 * @param input The user input string.
 * @param maxLength Maximum allowed length (default 500).
 * @returns Sanitized string.
 */
export const sanitizeForPrompt = (input: string | undefined | null, maxLength: number = 500): string => {
  if (!input) return "";

  // 1. Trim whitespace
  let clean = String(input).trim();

  // 2. Truncate to prevent token exhaustion / DoS
  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength);
  }

  // 3. Remove/Replace control characters and newlines
  // Replacing newlines with spaces is critical to prevent injecting new "System" lines in some formats
  clean = clean.replace(/[\r\n]+/g, " ");

  // 4. Replace backticks with single quotes to prevent code block injection
  clean = clean.replace(/`/g, "'");

  return clean;
};
