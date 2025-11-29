import type { Context } from "hono";
import { Hono } from "hono";
import { groupMeWebhookHandler } from "./webhook-handler";

const app = new Hono<{ Bindings: Env }>();

app.post("/webhook/:secret", async (c: Context) => {
	const provided_secret = c.req.param("secret");

	if (provided_secret !== c.env.WEBHOOK_SECRET){
		return c.json({error: "Unauthorized"}, 401)
	}
	return groupMeWebhookHandler(c);
});

export default app;
