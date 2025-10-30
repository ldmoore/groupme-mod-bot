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

### 4. `webhook-handler.test.ts`

Tests the webhook handler and message processing logic. This is the most comprehensive test file covering the entire bot workflow.

**Components tested:**

#### `isIllegalMessage()` Function
- Blocked words detection
- Blocked phrases detection
- Blocked sequences detection
- Clean message validation
- Empty message handling

#### `groupMeWebhookHandler()` Function
- **Clean message handling**: Returns OK status without taking action
- **Staging mode**: Posts bot message without removing users
- **Production mode**: Deletes message and removes offending user
- **User not found handling**: Returns appropriate error when user isn't in group
- **Case sensitivity**: Detects spam regardless of case
- **Real-world spam examples**: Tests actual spam messages (car scams, ticket scams)
- **Error handling**: Handles network errors during API calls
- **Random bot message**: Tests the rare easter egg bot message
- **Logging coverage**: Tests console logging for HTTP requests/responses/errors

**Example:**
```typescript
test("should delete message and remove user for illegal content", async () => {
  // Mock webhook request with spam content
  (mockContext.req?.json as jest.Mock)?.mockResolvedValue({
    text: "Click the link below to buy crypto",
    group_id: "12345",
    id: "msg_001",
    sender_id: "user_001",
  });

  // ... mock API responses ...

  await groupMeWebhookHandler(mockContext as Context);

  // Verify fetch was called 4 times: get group, delete message, remove user x2
  expect(mockFetch).toHaveBeenCalledTimes(4);
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

### To add a webhook handler test:

Add a new test in the appropriate `describe` block:

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