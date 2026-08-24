import { isIllegalMessage } from "../moderation/engine";
import { deleteMessage, getGroupData, postMessage, removeUser } from "./client";

export type GroupMeBotEnv = {
	GROUPME_ACCESS_TOKEN: string;
	GROUPME_BOT_ID: string;
	GROUPME_BOT_ID_ERROR_ALERTS?: string;
	STAGING?: boolean | string;
};

export type GroupMeWebhookPayload = {
	text?: string;
	group_id: string;
	id: string;
	sender_id: string;
};

type GroupMeWebhookResponse = {
	body: { status: string };
	status: 200;
};

export async function handleGroupMeWebhook(
	body: GroupMeWebhookPayload,
	env: GroupMeBotEnv,
): Promise<GroupMeWebhookResponse | undefined> {
	const text = (body.text || "").toLowerCase();
	const group_id = body.group_id;
	const message_id = body.id;
	const sender_user_id = body.sender_id;

	console.log(
		`Message received in group ${group_id} from user ${sender_user_id}: "${text}"`,
	);

	const staging = !!env.STAGING;

	if (isIllegalMessage(text).valueOf()) {
		console.log("Banned content detected:", text);

		const token = env.GROUPME_ACCESS_TOKEN;
		const bot_id = env.GROUPME_BOT_ID;

		// Staging instance will not remove users, only flag the message
		if (staging) {
			await postMessage(bot_id, "BOTS BEGONE 🤬");
			return;
		}

		try {
			const groupData = await getGroupData(token, group_id);

			const member = groupData.response.members.find(
				(member) => member.user_id === sender_user_id,
			);
			if (!member) {
				console.warn(`User ${sender_user_id} not found in group ${group_id}`);
				return { body: { status: "user not found" }, status: 200 };
			}
			const membership_id = member.id;

			await deleteMessage(token, group_id, message_id);
			await removeUser(token, group_id, membership_id);

			if (Math.floor(Math.random() * 1000000) === 462926) {
				await postMessage(bot_id, "BOTS BEGONE 🤬");
			}
		} catch (err) {
			console.warn("General error handling blocked content", err);
			if (env.GROUPME_BOT_ID_ERROR_ALERTS) {
				await postMessage(
					env.GROUPME_BOT_ID_ERROR_ALERTS,
					"⚠️ Error occurred in production! Check access token validity in CF environment variables.",
				);
			}
			throw err;
		}
	} else {
		console.log("Message passed moderation check.");
	}

	return { body: { status: "ok" }, status: 200 };
}
