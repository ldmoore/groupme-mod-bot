import type { Context } from "hono";
import containsBlockedPhrase from "./blocked-phrases";
import containsBlockSequence from "./blocked-sequences";
import containsBlockedWord from "./blocked-words";

export function isIllegalMessage(message: string): boolean {
	return (
		containsBlockedWord(message) ||
		containsBlockedPhrase(message) ||
		containsBlockSequence(message)
	);
}

async function safeFetch(
	url: string,
	options?: RequestInit,
	label?: string,
	error_bot_id?: string,
) {
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
		if (error_bot_id && res.status === 401)
			notifyError(
				"[ALERT] Unauthorized error! Check access token validity",
				error_bot_id,
			);
		return { res, text };
	} catch (err) {
		console.error(`[HTTP] Error${label ? ` - ${label}` : ""}:`, err);
		throw err;
	}
}

async function notifyError(text: string, bot_id: string) {
	try {
		await safeFetch(
			`https://api.groupme.com/v3/bots/post`,
			{
				method: "POST",
				body: JSON.stringify({ bot_id, text }),
			},
			"Post Staging Error Message",
		);
	} catch (err) {
		console.error("Failed to send error notification:", err);
	}
}

export async function groupMeWebhookHandler(c: Context) {
	const body = await c.req.json();
	console.log("Incoming webhook:", JSON.stringify(body));

	const text = (body.text || "").toLowerCase();
	const group_id = body.group_id;
	const message_id = body.id;
	const sender_user_id = body.sender_id;

	console.log(
		`Message received in group ${group_id} from user ${sender_user_id}: "${text}"`,
	);

	const staging = !!c.env.STAGING;
	const error_bot_id = c.env.GROUPME_ERROR_BOT_ID || "";

	if (isIllegalMessage(text).valueOf()) {
		console.log("Banned content detected:", text);

		const token = c.env.GROUPME_ACCESS_TOKEN;
		const bot_id = c.env.GROUPME_BOT_ID;

		// Staging instance will not remove users, only flag the message
		if (staging) {
			await safeFetch(
				`https://api.groupme.com/v3/bots/post`,
				{
					method: "POST",
					body: JSON.stringify({ bot_id, text: "BOTS BEGONE 🤬" }),
				},
				"Post Bot Message",
				error_bot_id,
			);
			return;
		}

		console.log("Fetching group data to resolve membership_id...");
		const { text: groupRaw } = await safeFetch(
			`https://api.groupme.com/v3/groups/${group_id}?token=${token}`,
			undefined,
			"Get Group Data",
			error_bot_id,
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
			error_bot_id,
		);

		await safeFetch(
			`https://api.groupme.com/v3/groups/${group_id}/members/${membership_id}/remove?token=${token}`,
			{ method: "POST" },
			"Remove User",
			error_bot_id,
		);

		await safeFetch(
			`https://api.groupme.com/v3/groups/${group_id}/members/${membership_id}/remove?token=${token}`,
			{ method: "POST" },
			"Remove User",
			error_bot_id,
		);

		if (Math.floor(Math.random() * 1000000) === 462926) {
			await safeFetch(
				`https://api.groupme.com/v3/bots/post`,
				{
					method: "POST",
					body: JSON.stringify({ bot_id, text: "BOTS BEGONE 🤬" }),
				},
				"Post Bot Message",
				error_bot_id,
			);
		}
	} else {
		console.log("Message passed moderation check.");
	}

	return c.json({ status: "ok" }, 200);
}
