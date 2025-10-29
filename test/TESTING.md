# Testing Guide

## Prerequisites

Before running tests, ensure you have the following installed:

```bash
npm install --save-dev jest @types/jest ts-jest
```

## Running Tests

To run all tests:

```bash
npm test
```

To run tests in watch mode:

```bash
npm test -- --watch
```

To run a specific test file:

```bash
npm test blocked-phrases.test.ts
```

## Test Structure

The test suite is organized into four main test files:

### 1. `blocked-words.test.ts`

Tests individual word blocking functionality. The bot blocks messages containing specific standalone words or words with common punctuation.

**Features tested:**
- Basic word detection (e.g. "promo", "crypto")
- Celebrity names (e.g. "Megan Moroney", "Billie Eilish", "Olivia Rodrigo")
- Word boundaries with punctuation (!, ?, ., ',s, plural s)
- Position in message (beginning, middle, end)
- Case-insensitive matching

**Example:**
```typescript
test("blocked word with apostrophe s", () => {
  expect(containsBlockedWord("Go to Megan Moroney's concert.")).toBe(true);
});
```

### 2. `blocked-phrases.test.ts`

Tests multi-word phrase blocking. These are common spam/scam phrases that appear together.

**Blocked phrases include:**
- "click the link below"
- "contact me on whatsapp"
- "contact me on telegram"
- "verify your account"
- "free cash giveaway"
- "you have been selected"

**Features tested:**
- Phrase detection within larger messages
- Case-insensitive matching
- Clean message validation
- Empty message handling

**Example:**
```typescript
test("click the link below", () => {
  expect(containsBlockedPhrase("Please click the link below to verify")).toBe(true);
});
```

### 3. `blocked-sequences.test.ts`

Tests multi-word sequences that indicate spam or scams (ticket sales, product sales, etc.).

**Blocked sequences include:**
- "giving away [artist name]"
- "MacBook Air"
- "full season pass"
- "text me on gmail"
- Celebrity ticket sales (Tate McRae, Billie Eilish, etc.)
- Vehicle sales patterns

**Features tested:**
- Multi-word sequence detection
- Case-insensitive matching
- Sequences with emojis
- Partial sequence rejection (ensures full sequence is present)

**Example:**
```typescript
test("car selling scam", () => {
  expect(containsBlockedSequence("Clean used 2012 Honda Accord for sale for $3000.")).toBe(true);
});
```

### 4. `integration.test.ts`

Tests the complete `isIllegalMessage()` function that combines all three blocking mechanisms.

**Features tested:**
- End-to-end message validation
- Combination of multiple blocking rules
- Real-world spam examples
- Safe message validation
- Empty message handling

**Test messages:**
- "Hello, how are you?" - Clean message (expected: false)
- "This message is safe and clean." - Clean message (expected: false)
- Real spam example with phone number and DM request (expected: true)

**Example:**
```typescript
test(`blocked phrase test: "[message content]"`, () => {
  expect(isIllegalMessage(msg.content)).toBe(msg.expected);
});
```

## Adding New Tests

### To add a blocked word test:

```typescript
test("your word description", () => {
  expect(containsBlockedWord("Message containing the word")).toBe(true);
});
```

### To add a blocked phrase test:

```typescript
test("your phrase description", () => {
  expect(containsBlockedPhrase("Message with the phrase in it")).toBe(true);
});
```

### To add a blocked sequence test:

```typescript
test("your sequence description", () => {
  expect(containsBlockedSequence("Message with sequence here")).toBe(true);
});
```

### To add an integration test:

Add a new entry to the `testMessages` array:

```typescript
const testMessages: TestMessage[] = [
  // ... existing messages
  { 
    content: "Your test message content here", 
    expected: true // or false
  },
];
```

## Configuration

Jest is configured via `jest.config.js`: