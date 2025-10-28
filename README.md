# GroupMe Ad Auto-Removal
GroupMe bot for instantly removing spam, scam, and advertisement messages... **BOTS BEGONE 🤬**!

Additions to the filter are welcome, open a PR with changes to `src/blocked.ts`.

## Cloudflare Workers Setup

1. Sign up for [Cloudflare Workers](https://workers.dev). The free tier is more than enough for most use cases.
2. Clone this project and install dependencies with `npm install`
3. Run `wrangler login` to login to your Cloudflare account in wrangler
4. Run `wrangler deploy` to publish the API to Cloudflare Workers

## Configuration (set on Cloudflare)

**Blocked Words:**

- Exact words that would constitute a removal. 
    - Ex. "giveaway", "promo", "tate mcrae"
    - "tate mcrae" is considered one word because "tate" will always appear next to "mcrae"
- Edit `src/blocked-words.ts`

**Blocked Phrases**

- Exact phrases that would constitute a removal. 
    - Ex. "click the link below", "free cash giveaway"
- Edit `src/blocked-phrases.ts`

**Blocked Sequences**

- Groupings of words that when appearing in the given order constitutes a removal. Only cares about the order in which the words appear, not what might be between them. 
    - Ex. "tyler the creator tickets", "free macbook air", "selling lease"
    - This would catch the messages: "Hi! I'm selling my lease." and "Hi! My roommate is selling her lease."
- Edit `src/blocked-sequences.ts`

**Secrets:**

- Set `GROUPME_ACCESS_TOKEN` to your personal account access token. It will delete messages as you.
- Set `GROUPME_BOT_ID` to your GroupMe bot ID

**Contributing**

Review the docs on [contributing](/CONTRIBUTING.md).
