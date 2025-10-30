import type { Context } from "hono";
import { Hono } from "hono";
import { groupMeWebhookHandler } from "./webhook-handler";

const app = new Hono<{ Bindings: Env }>();

app.post("/webhook", async (c: Context) => {
	return groupMeWebhookHandler(c);
});

export default app;
