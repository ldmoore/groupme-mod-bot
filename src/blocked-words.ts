// Filter for blocked words. Matches if the message contains any of the strings exactly
// (ie. not as substrings of other words or with space between two words in a given string).

const blockedWords: string[] = [
	"nude",
	"horny",
	"crypto",
	"bitcoin",
	"telegram",
	"onlyfans",
	"giveaway",
	"followers",
	"promo",
	"megan moroney",
	"billie eilish",
	"sabrina carpenter",
	"tate mcrae",
	"olivia rodrigo",
	"ariana grande",
];

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

function wordToPattern(w: string): string {
	const parts = w.trim().split(/\s+/).map(escapeRegExp);
	return parts.join("\\s+");
}

// Build a single regex that matches when a blocked word is:
//  - at the start or preceded by whitespace: (^|\s)
//  - the blocked word (supports multi-word entries via \s+ between parts)
//  - followed by one of: 's  OR punctuation . , ? !  OR whitespace OR end of string
const pattern: RegExp = new RegExp(
	`(^|\\s)(?:${blockedWords.map(wordToPattern).join("|")})(?:'s|[.,?!]|\\s|$)`,
	"iu",
);

/**
 * Checks if a message contains any blocked words.
 * @param message - The message to check.
 * @returns True if the message contains a blocked word, false otherwise.
 */
export default function containsBlockedWord(message: string): boolean {
	return pattern.test(message);
}
