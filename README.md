# GroupMe Ad Auto-Removal

## Cloudflare Workers Setup

1. Sign up for [Cloudflare Workers](https://workers.dev). The free tier is more than enough for most use cases.
2. Clone this project and install dependencies with `npm install`
3. Run `wrangler login` to login to your Cloudflare account in wrangler
4. Run `wrangler deploy` to publish the API to Cloudflare Workers

## Configuration (set on Cloudflare)

**Blocked Words:**

- Edit `src/blocked.ts`

**Secrets:**

- Set `GROUPME_ACCESS_TOKEN` to your personal account access token. It will delete messages as you.
- Set `GROUPME_BOT_ID` to your GroupMe bot ID