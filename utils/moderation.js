const BLOCKED_WORDS = [
  'nude', 'nudes', 'naked', 'sex', 'porn', 'nsfw', 'xxx', 
  'boobs', 'dick', 'pussy', 'asshole', 'cock', 'vagina'
];

/**
 * Basic heuristic scanner to mock AI content safety.
 * Checks for inappropriate words in text content and filenames.
 * @param {string} content - Text to scan
 * @param {string} filename - Filename to scan (optional)
 * @returns {object} { flagged: boolean, reason: string | null }
 */
const moderateContent = (content = '', filename = '') => {
  const normalizedContent = content.toLowerCase();
  const normalizedFilename = filename.toLowerCase();

  for (const word of BLOCKED_WORDS) {
    // Check post/caption content
    if (normalizedContent.includes(word)) {
      return {
        flagged: true,
        reason: `AI Content Safety: Potential inappropriate keyword "${word}" detected in text.`
      };
    }

    // Check media file names
    if (normalizedFilename && normalizedFilename.includes(word)) {
      return {
        flagged: true,
        reason: `AI Content Safety: Potential inappropriate filename keyword "${word}" detected.`
      };
    }
  }

  return { flagged: false, reason: null };
};

module.exports = { moderateContent };
