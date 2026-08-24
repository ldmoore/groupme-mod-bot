# Testing Guide

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
npm test -- blocked-phrases.test.ts
```

## Test Structure

The bot test suite lives in `bot/test` and covers the bot boundary directly.

### `blocked-words.test.ts`

Tests individual word blocking functionality. The bot blocks messages containing specific standalone words or words with common punctuation.

### `blocked-phrases.test.ts`

Tests phrase blocking for common spam and scam phrases such as "click the link below", "contact me on whatsapp", and "free cash giveaway".

### `blocked-sequences.test.ts`

Tests ordered multi-word sequences that indicate spam or scams, including ticket sales, product sales, and vehicle sale patterns.

### `webhook-handler.test.ts`

Tests GroupMe webhook behavior through `handleGroupMeWebhook()`:

- clean message handling
- staging-mode bot replies
- production message deletion and member removal
- user-not-found handling
- network and authorization errors
- optional error alert bot messages
- the rare bot-message branch

## Local Message Check

The script in `bot/test/blockCheck.ts` can be used to test `isIllegalMessage()` interactively:

```bash
npm run check
```

## Configuration

Jest is configured via `jest.config.js` at the repo root.
