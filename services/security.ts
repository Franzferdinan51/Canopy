
/**
 * Sanitizes user input for use in LLM prompts to prevent Prompt Injection.
 * Flattens the string to a single line and escapes double quotes.
 *
 * @param input The user-controlled string to sanitize
 * @returns A safe string to be interpolated into a prompt
 */
export const sanitizeForPrompt = (input: string): string => {
  if (!input) return "";
  return input
    .replace(/"/g, '\\"')    // Escape double quotes
    .replace(/[\r\n]+/g, ' ') // Replace newlines with space
    .trim();
};
