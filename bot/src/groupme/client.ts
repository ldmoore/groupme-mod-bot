export type GroupMeGroupMember = {
	user_id: string;
	id: string;
};

type GroupMeGroupData = {
	response: {
		members: GroupMeGroupMember[];
	};
};

async function safeFetch(url: string, options?: RequestInit, label?: string) {
	try {
		const res = await fetch(url, options);
		const text = await res.text();
		if (!res.ok) throw new Error(`HTTP ${res.status} - ${text}`);
		return { res, text };
	} catch (err) {
		console.error(`[HTTP] Error${label ? ` - ${label}` : ""}:`, err);
		throw err;
	}
}

export async function postMessage(bot_id: string, text: string) {
	await safeFetch(
		"https://api.groupme.com/v3/bots/post",
		{
			method: "POST",
			body: JSON.stringify({ bot_id, text }),
		},
		"Post Bot Message",
	);
}

export async function getGroupData(
	token: string,
	group_id: string,
): Promise<GroupMeGroupData> {
	const { text: groupRaw } = await safeFetch(
		`https://api.groupme.com/v3/groups/${group_id}?token=${token}`,
		undefined,
		"Get Group Data",
	);
	return JSON.parse(groupRaw);
}

export async function deleteMessage(
	token: string,
	group_id: string,
	message_id: string,
) {
	await safeFetch(
		`https://api.groupme.com/v3/conversations/${group_id}/messages/${message_id}?token=${token}`,
		{ method: "DELETE" },
		"Delete Message",
	);
}

export async function removeUser(
	token: string,
	group_id: string,
	membership_id: string,
) {
	await safeFetch(
		`https://api.groupme.com/v3/groups/${group_id}/members/${membership_id}/remove?token=${token}`,
		{ method: "POST" },
		"Remove User",
	);
}
