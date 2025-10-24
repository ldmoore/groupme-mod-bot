import { Hono } from "hono";
import bannedWords from "./blocked";
import containsBlockedWord from "./blocked-words";

const app = new Hono<{ Bindings: Env }>();

async function safeFetch(url: string, options?: RequestInit, label?: string) {
	try {
		console.log(
			`[HTTP] Request${label ? ` - ${label}` : ""}:`,
			url,
			options || {},
		);
		const res = await fetch(url, options);
		const text = await res.text();
		console.log(
			`[HTTP] Response${label ? ` - ${label}` : ""}:`,
			res.status,
			text,
		);
		return { res, text };
	} catch (err) {
		console.error(`[HTTP] Error${label ? ` - ${label}` : ""}:`, err);
		throw err;
	}
}

function isIlligalMessage(message: string): boolean {
	return containsBlockedWord(message);
}

app.post("/webhook", async (c) => {
	const body = await c.req.json();
	console.log("Incoming webhook:", JSON.stringify(body));

	const text = (body.text || "").toLowerCase();
	const group_id = body.group_id;
	const message_id = body.id;
	const sender_user_id = body.sender_id;

	console.log(
		`Message received in group ${group_id} from user ${sender_user_id}: "${text}"`,
	);

	if (isIlligalMessage(text)) {
		console.log("Banned content detected:", text);

		const token = c.env.GROUPME_ACCESS_TOKEN;
		const bot_id = c.env.GROUPME_BOT_ID;

		console.log("Fetching group data to resolve membership_id...");
		const { text: groupRaw } = await safeFetch(
			`https://api.groupme.com/v3/groups/${group_id}?token=${token}`,
			undefined,
			"Get Group Data",
		);
		const groupData = JSON.parse(groupRaw);
		type GroupMember = { user_id: string; id: string };
		const member = groupData.response.members.find(
			(m: GroupMember) => m.user_id === sender_user_id,
		);
		if (!member) {
			console.warn(`User ${sender_user_id} not found in group ${group_id}`);
			return c.json({ status: "user not found" }, 200);
		}
		const membership_id = member.id;
		console.log(
			`Resolved membership_id for user ${sender_user_id}: ${membership_id}`,
		);

		await safeFetch(
			`https://api.groupme.com/v3/conversations/${group_id}/messages/${message_id}?token=${token}`,
			{ method: "DELETE" },
			"Delete Message",
		);

		await safeFetch(
			`https://api.groupme.com/v3/groups/${group_id}/members/${membership_id}/remove?token=${token}`,
			{ method: "POST" },
			"Remove User",
		);

		await safeFetch(
			`https://api.groupme.com/v3/groups/${group_id}/members/${membership_id}/remove?token=${token}`,
			{ method: "POST" },
			"Remove User",
		);

		if (Math.floor(Math.random() * 1000000) === 462926) {
			await safeFetch(
				`https://api.groupme.com/v3/bots/post`,
				{
					method: "POST",
					body: JSON.stringify({ bot_id, text: "BOTS BEGONE 🤬" }),
				},
				"Post Bot Message",
			);
		}
	} else {
		console.log("Message passed moderation check.");
	}

	return c.json({ status: "ok" }, 200);
});

export default app;
