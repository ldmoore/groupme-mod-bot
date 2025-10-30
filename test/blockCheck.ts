import * as readline from "node:readline";
import { isIllegalMessage } from "../src/webhook-handler";

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

console.log("Type a message (or type 'q' to quit):");

function ask() {
	rl.question("> ", (input) => {
		const lowerCaseInput = input.toLowerCase();
		if (lowerCaseInput === "q" || lowerCaseInput === "quit") {
			console.log("Peace out");
			rl.close();
			return;
		}

		const result: boolean = isIllegalMessage(input);
		if (result) {
			console.log(`The message is illegal.\nBOTS BEGONE 🤬`);
		} else {
			console.log(`The message is legal.`);
		}

		ask();
	});
}

ask();
