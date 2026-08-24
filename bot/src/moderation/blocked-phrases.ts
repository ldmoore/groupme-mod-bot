// Filter for blocked phrases in messages.

export const blockedPhrases: string[] = [
	"click the link below",
	"contact me on whatsapp",
	"contact me on telegram",
	"verify your account",
	"free cash giveaway",
	"you have been selected",
	"remote position",
];

/**
 *
 * @param message - The message to check.
 * @returns - True if the message contains a blocked phrase, false otherwise.
 */
export default function containsBlockedPhrase(message: string): boolean {
	const lowerMessage: string = message.toLowerCase();
	for (const phrase of blockedPhrases) {
		if (lowerMessage.includes(phrase.toLowerCase())) {
			return true;
		}
	}
	return false;
}
