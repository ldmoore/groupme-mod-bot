import containsBlockedWord from "../src/blocked-words";

test("nude", () => {
	expect(containsBlockedWord("This is a nude photo.")).toBe(true);
});

test("horny", () => {
	expect(containsBlockedWord("Feeling horny today!")).toBe(true);
});

test("crypto", () => {
	expect(containsBlockedWord("Buy my crypto.")).toBe(true);
});

test("no blocked word", () => {
	expect(containsBlockedWord("This message is clean and safe.")).toBe(false);
});

test("megan moroney", () => {
	expect(containsBlockedWord("Selling Megan Moroney concert tickets.")).toBe(
		true,
	);
});

test("partial blocked word", () => {
	expect(containsBlockedWord("This is a promotional offer.")).toBe(false);
});

test("clean message", () => {
	expect(containsBlockedWord("This message is safe and clean.")).toBe(false);
});

test("empty message", () => {
	expect(containsBlockedWord("")).toBe(false);
});

test("begining of message", () => {
	expect(containsBlockedWord("Billie Eilish tickets!")).toBe(true);
});

test("end of message", () => {
	expect(containsBlockedWord("Get your Olivia Rodrigo")).toBe(true);
});

test("blocked word with exclamation mark", () => {
	expect(containsBlockedWord("Feeling horny!")).toBe(true);
});

test("blocked word with apostrophe s", () => {
	expect(containsBlockedWord("Go to Megan Moroney's concert.")).toBe(true);
});

test("blocked word with plural s", () => {
	expect(containsBlockedWord("Buy some cryptos.")).toBe(true);
});

test("blocked word with comma", () => {
	expect(containsBlockedWord("This nude, is a photo.")).toBe(true);
});

test("blocked word with period", () => {
	expect(containsBlockedWord("This is a crypto.")).toBe(true);
});

test("blocked word with question mark", () => {
	expect(containsBlockedWord("Want to see Megan Moroney?")).toBe(true);
});
