// Filter for blocked words. Matches if the message contains any of the strings exactly 
// (ie. not as substrings of other words or with space between two words in a given string).

const blocked: string[] = [
	"nude",
	"horny",
	"tate mcrae",
	"megan moroney",
	"lease",
];

/**
 * Escapes special characters in a string for use in a regular expression.
 * @param s - The string to escape.
 * @returns The escaped string.
 */
function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

/**
 * Converts a word or phrase into a regex pattern.
 * @param w - The word or phrase to convert.
 * @returns The regex pattern.
 */
function wordToPattern(w: string): string {
	const parts = w.trim().split(/\s+/).map(escapeRegExp);
	return parts.join('\\s+');
}

// Build a single regex that matches when a blocked word is:
//  - at the start or preceded by whitespace: (^|\s)
//  - the blocked word (supports multi-word entries via \s+ between parts)
//  - followed by one of: 's  OR punctuation . , ? !  OR whitespace OR end of string
const pattern: RegExp = new RegExp(
	`(^|\\s)(?:${blocked.map(wordToPattern).join('|')})(?:'s|[.,?!]|\\s|$)`,
	'iu'
);

/**
 * Checks if a message contains any blocked words.
 * @param message - The message to check.
 * @returns True if the message contains a blocked word, false otherwise.
 */
export default function containsBlockedWord(message: string): boolean {
	return pattern.test(message);
}