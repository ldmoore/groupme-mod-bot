import containsBlockedPhrase from "../src/blocked-phrases";

describe(containsBlockedPhrase, () => {
	test("click the link below", () => {
		expect(containsBlockedPhrase("Please click the link below to verify")).toBe(
			true,
		);
	});

	test("contact me on whatsapp", () => {
		expect(
			containsBlockedPhrase("You can contact me on WhatsApp for more info"),
		).toBe(true);
	});

	test("free cash giveaway", () => {
		expect(containsBlockedPhrase("Join our free cash giveaway now!")).toBe(
			true,
		);
	});

	test("no blocked phrase", () => {
		expect(containsBlockedPhrase("This message is clean and safe.")).toBe(
			false,
		);
	});

	test("you have been selected", () => {
		expect(
			containsBlockedPhrase(
				"Congratulations! You have been selected for a prize.",
			),
		).toBe(true);
	});

	test("verify your account", () => {
		expect(
			containsBlockedPhrase("Please verify your account to continue."),
		).toBe(true);
	});

	test("clean message", () => {
		expect(containsBlockedPhrase("This message is safe and clean.")).toBe(
			false,
		);
	});

	test("empty message", () => {
		expect(containsBlockedPhrase("")).toBe(false);
	});

	test("non space separated blocked phrase", () => {
		expect(containsBlockedPhrase("100%free cash giveaway")).toBe(true);
	});
});
