/**
 * Security utilities for the application.
 */

/**
 * Sanitizes input text to prevent Prompt Injection attacks in LLM prompts.
 *
 * @param input - The raw input string from user or untrusted source.
 * @param maxLength - Maximum allowed length (default: 1000).
 * @returns The sanitized, flattened string.
 */
export const sanitizeForPrompt = (input: string, maxLength: number = 1000): string => {
  if (!input) return "";

  // 1. Flatten: Replace newlines, carriage returns, and tabs with spaces
  // This prevents structure injection where users try to insert new instructions on new lines.
  let sanitized = input.replace(/[\r\n\t]+/g, ' ');

  // 2. Trim whitespace
  sanitized = sanitized.trim();

  // 3. Length Limit to prevent context flooding
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

/**
 * Validates if a string is a valid URL.
 * Used to prevent passing malicious non-URL strings to the AI's "browse" context.
 *
 * @param urlString - The string to validate.
 * @returns True if valid URL, false otherwise.
 */
export const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (e) {
    return false;
  }
};
