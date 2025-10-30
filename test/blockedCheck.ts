import * as readline from "node:readline";
import type { IllegalMessageResult } from "../src/types";
import { isIllegalMessage } from "../src/webhook-handler";

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

console.log("Type a message (or type 'q' to quit):");

function ask() {
	rl.question("> ", (input) => {
		if (input.toLowerCase() === "q" || input.toLowerCase() === "quit") {
			console.log("Peace out");
			rl.close();
			return;
		}

		const result: IllegalMessageResult = isIllegalMessage(input);
		if (result.containsIllegalContent) {
			console.log(`The message is illegal: ${result}\nBOTS BEGONE 🤬`);
		} else {
			console.log(`The message is legal.`);
		}

		ask();
	});
}

ask();
