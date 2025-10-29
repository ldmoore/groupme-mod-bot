import containsBlockedSequence from "../src/blocked-sequences";

test("giving away billie eilish", () => {
	expect(
		containsBlockedSequence("I'm giving away free Billie Eilish tickets!"),
	).toBe(true);
});

test("macbook air", () => {
	expect(
		containsBlockedSequence("Selling my MacBook Air for a great price."),
	).toBe(true);
});

test("full season pass", () => {
	expect(
		containsBlockedSequence(
			"Get your full season pass for football games now!",
		),
	).toBe(true);
});

test("text me on gmail", () => {
	expect(
		containsBlockedSequence("You can text me on Gmail for more details."),
	).toBe(true);
});

test("no blocked sequence", () => {
	expect(containsBlockedSequence("This message is clean and safe.")).toBe(
		false,
	);
});

test("tate mcrae tickets", () => {
	expect(
		containsBlockedSequence("I have extra Tate McRae tickets for sale."),
	).toBe(true);
});

test("partial blocked sequence", () => {
	expect(containsBlockedSequence("I'm giving away free Billie tickets!")).toBe(
		false,
	);
});

test("clean message", () => {
	expect(containsBlockedSequence("This message is safe and clean.")).toBe(
		false,
	);
});

test("empty message", () => {
	expect(containsBlockedSequence("")).toBe(false);
});

test("emojis in blocked sequence", () => {
	expect(
		containsBlockedSequence("I'm giving away free Billie Eilish tickets! 🎟️🎤"),
	).toBe(true);
});

test("blocked sequence with different casing", () => {
	expect(
		containsBlockedSequence("Selling My MacBook Air for a Great Price."),
	).toBe(true);
});

test("car selling scam", () => {
	expect(
		containsBlockedSequence("Clean used 2012 Honda Accord for sale for $3000."),
	).toBe(true);
});
