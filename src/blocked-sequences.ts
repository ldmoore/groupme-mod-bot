// Filter for blocked sequences in messages.
// Filters based on sequences and the order they appear in the message.
// Matches if the words appear in a message in the order given, even if there are words between them.

const blockedSequences: string[] = [
	"giving away billie eilish",
	"giving away sabrina carpenter",
	"giving away tate mcrae",
	"selling tate mcrae",
	"my tate mcrae",
	"tate mcrae tickets",
	"sabrina carpenter tickets",
	"billie eilish tickets",
	"macbook air",
	"season ticket",
	"season football",
	"macbook pro",
	"sell my season",
	"sell billie eilish",
	"sell sabrina carpenter",
	"sell tate mcrae",
	"sell my ps5",
	"give away ps5",
	"ps5 for free",
	"ps5 out for free",
	"text me on gmail",
	"invited to join my group",
	"full season pass",
	"football full season",
	"full season football",
	"full football season",
	"full season tickets",
	"individual games",
	"my tyler the creator tickets",
	"tickets to kendrick lamar",
	"my carolina football tickets",
	"duke basketball game tickets",
	"duke football game tickets",
	"duke football tickets",
	"duke basketball tickets",
	"duke tickets",
	"carolina football tickets",
	"carolina football game tickets",
	"carolina basketball tickets",
	"carolina basketball game tickets",
	"tyler the creator tickets",
	"tyler the creator concert tickets",
	"kendrick lamar tickets",
	"kendrick lamar concert tickets",
	"free ps5",
	"free ps5 giveaway",
	"struggling to keep up with classes",
	"message me to get grades up",
	"i'll make sure your classwork gets done",
	"boost your grades",
	"text me for help with online classes",
	"text me for help with classes",
	"contact me for help with classes",
	"contact me for help with online classes",
	"i'll do your classwork for you",
	"free macbook",
	"free macbook air",
	"free macbook pro",
	"giveaway macbook",
	"giveaway macbook air",
	"giveaway macbook pro",
	"selling macbook",
	"selling macbook air",
	"selling macbook pro",
	"sell macbook",
	"click the link",
	"check my bio",
	"dm me for collab",
	"message me for promotion",
	"contact me for help with classes",
	"i'll do your classwork for you",
	"boost your grades",
	"free iphone",
	"win a macbook",
	"join my team",
];

/**
 *
 * @param message - The message to check.
 * @returns - True if the message contains a blocked sequence, false otherwise.
 */
export default function containsBlockedSequence(message: string): boolean {
	const lowerMessage: string = message.toLowerCase();
	let found: boolean = false;
	for (const sequence of blockedSequences) {
		const parts: string[] = sequence.toLowerCase().split(/\s+/);
		let currentIndex: number = 0;
		for (const part of parts) {
			currentIndex = lowerMessage.indexOf(part, currentIndex);
			if (currentIndex === -1) {
				found = false;
				break;
			}
			currentIndex += part.length;
		}
		if (found) {
			return true;
		}
	}
	return false;
}
