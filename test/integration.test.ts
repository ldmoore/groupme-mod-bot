import { isIllegalMessage } from "../src/index";

const testMessages: TestMessage[] = [
	{ content: "Hello, how are you?", expected: false },
	{ content: "This message is safe and clean.", expected: false },
	{
		content:
			"Clean used 2012 Honda Accord For Sale For $3000 Perfect condition no problems at all Just need some space I bought a new car 2016 Honda accord Dm for more information and if you're interested (585) 365-3185",
		expected: true,
	},
];

type TestMessage = {
	content: string;
	expected: boolean;
};

for (const msg of testMessages) {
	test(`blocked phrase test: "${msg.content}"`, () => {
		expect(isIllegalMessage(msg.content)).toBe(msg.expected);
	});
}

test("empty message", () => {
	expect(isIllegalMessage("")).toBe(false);
});
