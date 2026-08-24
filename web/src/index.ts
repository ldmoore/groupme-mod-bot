import { Hono } from "hono";
import { handleGroupMeWebhook } from "../../bot/src/groupme/webhook-handler";

const app = new Hono<{ Bindings: Env }>();

app.post("/webhook/:secret", async (c) => {
	const provided_secret = c.req.param("secret");

	if (provided_secret !== c.env.WEBHOOK_SECRET) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const result = await handleGroupMeWebhook(await c.req.json(), c.env);
	if (!result) {
		return undefined as unknown as Response;
	}

	return c.json(result.body, result.status);
});

export default app;
