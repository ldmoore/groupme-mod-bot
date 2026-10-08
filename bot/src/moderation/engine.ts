import containsBlockedPhrase from "./blocked-phrases";
import containsBlockSequence from "./blocked-sequences";
import containsBlockedWord from "./blocked-words";

export function isIllegalMessage(message: string): boolean {
	return (
		containsBlockedWord(message) ||
		containsBlockedPhrase(message) ||
		containsBlockSequence(message)
	);
}
