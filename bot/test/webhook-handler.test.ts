import type {
	GroupMeBotEnv,
	GroupMeWebhookPayload,
} from "../src/groupme/webhook-handler";
import { handleGroupMeWebhook } from "../src/groupme/webhook-handler";
import { isIllegalMessage } from "../src/moderation/engine";

type TestMessage = {
	content: string;
	expected: boolean;
};

const testMessages: TestMessage[] = [
	{ content: "Hello, how are you?", expected: false },
	{ content: "This message is safe and clean.", expected: false },
	{
		content:
			"clean used 2012 honda accord for sale for $3000 Perfect condition no problems at all Just need some space I bought a new car 2016 Honda accord Dm for more information and if you're interested (585) 365-3185",
		expected: true,
	},
];

global.fetch = jest.fn();

const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();
const mockConsoleError = jest.spyOn(console, "error").mockImplementation();
const mockConsoleWarn = jest.spyOn(console, "warn").mockImplementation();

afterAll(() => {
	mockConsoleLog.mockRestore();
	mockConsoleError.mockRestore();
	mockConsoleWarn.mockRestore();
});

describe("isIllegalMessage", () => {
	describe("test messages", () => {
		for (const msg of testMessages) {
			test(`blocked phrase test: "${msg.content.toLowerCase()}"`, () => {
				expect(isIllegalMessage(msg.content).valueOf()).toBe(msg.expected);
			});
		}

		test("empty message", () => {
			expect(isIllegalMessage("").valueOf()).toBe(false);
		});
	});

	describe("blocked phrases", () => {
		test("should detect 'click the link below'", () => {
			expect(
				isIllegalMessage("Please click the link below to verify").valueOf(),
			).toBe(true);
		});

		test("should detect 'contact me on whatsapp'", () => {
			expect(isIllegalMessage("You can contact me on whatsapp").valueOf()).toBe(
				true,
			);
		});

		test("should detect 'verify your account'", () => {
			expect(
				isIllegalMessage("Please verify your account to continue").valueOf(),
			).toBe(true);
		});

		test("should detect 'free cash giveaway'", () => {
			expect(
				isIllegalMessage("Join our free cash giveaway now!").valueOf(),
			).toBe(true);
		});
	});

	describe("blocked sequences", () => {
		test("should detect ticket giveaways", () => {
			expect(
				isIllegalMessage("giving away free billie eilish tickets").valueOf(),
			).toBe(true);
		});

		test("should detect product sales", () => {
			expect(
				isIllegalMessage("Selling my macbook air for cheap").valueOf(),
			).toBe(true);
		});

		test("should detect season pass scams", () => {
			expect(isIllegalMessage("Get your full season pass now").valueOf()).toBe(
				true,
			);
		});

		test("should detect car selling scams", () => {
			expect(
				isIllegalMessage(
					"Clean used 2012 Honda Accord for sale for $3000",
				).valueOf(),
			).toBe(true);
		});
	});

	describe("clean messages", () => {
		test("should allow normal conversation", () => {
			expect(isIllegalMessage("Hello, how are you?").valueOf()).toBe(false);
			expect(isIllegalMessage("This message is safe and clean").valueOf()).toBe(
				false,
			);
		});

		test("should handle empty messages", () => {
			expect(isIllegalMessage("").valueOf()).toBe(false);
		});
	});
});

describe("handleGroupMeWebhook", () => {
	const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
	let mockEnv: GroupMeBotEnv;

	function payload(
		overrides: Partial<GroupMeWebhookPayload> = {},
	): GroupMeWebhookPayload {
		return {
			text: "Hello, how are you?",
			group_id: "12345",
			id: "msg_001",
			sender_id: "user_001",
			...overrides,
		};
	}

	beforeEach(() => {
		jest.clearAllMocks();
		mockFetch.mockReset();

		mockEnv = {
			GROUPME_ACCESS_TOKEN: "test_token",
			GROUPME_BOT_ID: "test_bot_id",
			STAGING: false,
		};
	});

	describe("clean messages", () => {
		test("should return ok status for clean messages", async () => {
			const result = await handleGroupMeWebhook(payload(), mockEnv);

			expect(result).toEqual({ body: { status: "ok" }, status: 200 });
			expect(mockFetch).not.toHaveBeenCalled();
		});

		test("should handle empty text messages", async () => {
			const result = await handleGroupMeWebhook(payload({ text: "" }), mockEnv);

			expect(result).toEqual({ body: { status: "ok" }, status: 200 });
			expect(mockFetch).not.toHaveBeenCalled();
		});

		test("should handle missing text field", async () => {
			const result = await handleGroupMeWebhook(
				payload({ text: undefined }),
				mockEnv,
			);

			expect(result).toEqual({ body: { status: "ok" }, status: 200 });
			expect(mockFetch).not.toHaveBeenCalled();
		});
	});

	describe("staging mode", () => {
		test("should only post bot message in staging mode", async () => {
			mockEnv.STAGING = true;

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				text: async () => JSON.stringify({ success: true }),
			} as Response);

			const result = await handleGroupMeWebhook(
				payload({ text: "Buy my crypto now!" }),
				mockEnv,
			);

			expect(result).toBeUndefined();
			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.groupme.com/v3/bots/post",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({
						bot_id: "test_bot_id",
						text: "BOTS BEGONE 🤬",
					}),
				}),
			);
		});
	});

	describe("production mode - illegal message handling", () => {
		test("should delete message and remove user for illegal content", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				text: async () =>
					JSON.stringify({
						response: {
							members: [
								{ user_id: "user_001", id: "membership_001" },
								{ user_id: "user_002", id: "membership_002" },
							],
						},
					}),
			} as Response);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				text: async () => JSON.stringify({ success: true }),
			} as Response);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				text: async () => JSON.stringify({ success: true }),
			} as Response);

			const result = await handleGroupMeWebhook(
				payload({ text: "Click the link below to buy crypto" }),
				mockEnv,
			);

			expect(mockFetch).toHaveBeenCalledTimes(3);
			expect(mockFetch).toHaveBeenNthCalledWith(
				1,
				"https://api.groupme.com/v3/groups/12345?token=test_token",
				undefined,
			);
			expect(mockFetch).toHaveBeenNthCalledWith(
				2,
				"https://api.groupme.com/v3/conversations/12345/messages/msg_001?token=test_token",
				{ method: "DELETE" },
			);
			expect(mockFetch).toHaveBeenNthCalledWith(
				3,
				"https://api.groupme.com/v3/groups/12345/members/membership_001/remove?token=test_token",
				{ method: "POST" },
			);
			expect(result).toEqual({ body: { status: "ok" }, status: 200 });
		});

		test("should handle user not found in group", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				text: async () =>
					JSON.stringify({
						response: {
							members: [
								{ user_id: "user_001", id: "membership_001" },
								{ user_id: "user_002", id: "membership_002" },
							],
						},
					}),
			} as Response);

			const result = await handleGroupMeWebhook(
				payload({ text: "Buy my crypto", sender_id: "user_999" }),
				mockEnv,
			);

			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(result).toEqual({
				body: { status: "user not found" },
				status: 200,
			});
		});
	});

	describe("case sensitivity", () => {
		test("should detect illegal content regardless of case", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				text: async () =>
					JSON.stringify({
						response: {
							members: [{ user_id: "user_001", id: "membership_001" }],
						},
					}),
			} as Response);

			mockFetch.mockResolvedValue({
				ok: true,
				status: 200,
				text: async () => JSON.stringify({ success: true }),
			} as Response);

			const result = await handleGroupMeWebhook(
				payload({ text: "CLICK THE LINK BELOW" }),
				mockEnv,
			);

			expect(mockFetch).toHaveBeenCalled();
			expect(result).toEqual({ body: { status: "ok" }, status: 200 });
		});
	});

	describe("real-world spam examples", () => {
		test("should handle car selling scam", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				text: async () =>
					JSON.stringify({
						response: {
							members: [{ user_id: "user_001", id: "membership_001" }],
						},
					}),
			} as Response);

			mockFetch.mockResolvedValue({
				ok: true,
				status: 200,
				text: async () => JSON.stringify({ success: true }),
			} as Response);

			const result = await handleGroupMeWebhook(
				payload({
					text: "Clean used 2012 Honda Accord For Sale For $3000 Perfect condition no problems at all Just need some space I bought a new car 2016 Honda accord Dm for more information and if you're interested (585) 365-3185",
				}),
				mockEnv,
			);

			expect(mockFetch).toHaveBeenCalledTimes(3);
			expect(result).toEqual({ body: { status: "ok" }, status: 200 });
		});

		test("should handle ticket scam", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				text: async () =>
					JSON.stringify({
						response: {
							members: [{ user_id: "user_001", id: "membership_001" }],
						},
					}),
			} as Response);

			mockFetch.mockResolvedValue({
				ok: true,
				status: 200,
				text: async () => JSON.stringify({ success: true }),
			} as Response);

			const result = await handleGroupMeWebhook(
				payload({
					text: "Giving away free Billie Eilish tickets! DM me for details",
				}),
				mockEnv,
			);

			expect(mockFetch).toHaveBeenCalledTimes(3);
			expect(result).toEqual({ body: { status: "ok" }, status: 200 });
		});
	});

	describe("error handling", () => {
		test("should handle fetch errors when getting group data", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			await expect(
				handleGroupMeWebhook(payload({ text: "Buy crypto now" }), mockEnv),
			).rejects.toThrow("Network error");
		});

		test("should handle fetch errors when deleting message", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				text: async () =>
					JSON.stringify({
						response: {
							members: [{ user_id: "user_001", id: "membership_001" }],
						},
					}),
			} as Response);

			mockFetch.mockRejectedValueOnce(new Error("Delete failed"));

			await expect(
				handleGroupMeWebhook(
					payload({ text: "Click the link below" }),
					mockEnv,
				),
			).rejects.toThrow("Delete failed");
		});
	});

	describe("random bot message", () => {
		test("should post rare bot message when random condition is met", async () => {
			const originalRandom = Math.random;
			Math.random = jest.fn(() => 0.462926);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				text: async () =>
					JSON.stringify({
						response: {
							members: [{ user_id: "user_001", id: "membership_001" }],
						},
					}),
			} as Response);

			mockFetch.mockResolvedValue({
				ok: true,
				status: 200,
				text: async () => JSON.stringify({ success: true }),
			} as Response);

			await handleGroupMeWebhook(
				payload({ text: "Click the link below to buy crypto" }),
				mockEnv,
			);

			expect(mockFetch).toHaveBeenCalledTimes(4);
			expect(mockFetch).toHaveBeenNthCalledWith(
				4,
				"https://api.groupme.com/v3/bots/post",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({
						bot_id: "test_bot_id",
						text: "BOTS BEGONE 🤬",
					}),
				}),
			);

			Math.random = originalRandom;
		});
	});

	describe("safeFetch error handling", () => {
		test("should send alert when safeFetch fails", async () => {
			mockConsoleWarn.mockClear();
			mockConsoleLog.mockClear();
			mockEnv.GROUPME_BOT_ID_ERROR_ALERTS = "error_bot_id";
			mockFetch.mockRejectedValueOnce(new Error("Network error"));
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				text: async () => JSON.stringify({ success: true }),
			} as Response);

			await expect(
				handleGroupMeWebhook(
					payload({ text: "Click the link below" }),
					mockEnv,
				),
			).rejects.toThrow("Network error");

			expect(mockConsoleWarn).toHaveBeenCalledWith(
				expect.stringMatching(/General error handling blocked content/),
				expect.anything(),
			);
			expect(mockFetch).toHaveBeenNthCalledWith(
				2,
				"https://api.groupme.com/v3/bots/post",
				expect.objectContaining({
					method: "POST",
					body: expect.stringContaining('"bot_id":"error_bot_id"'),
				}),
			);
		});

		test("should send alert on 401 unauthorized", async () => {
			mockEnv.GROUPME_BOT_ID_ERROR_ALERTS = "error_bot_id";
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 401,
				text: async () =>
					JSON.stringify({
						response: {
							meta: { code: 401, errors: ["unauthorized"] },
						},
					}),
			} as Response);
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				text: async () => JSON.stringify({ success: true }),
			} as Response);

			await expect(
				handleGroupMeWebhook(
					payload({ text: "Click the link below" }),
					mockEnv,
				),
			).rejects.toThrow();

			expect(mockFetch).toHaveBeenNthCalledWith(
				2,
				"https://api.groupme.com/v3/bots/post",
				expect.objectContaining({
					method: "POST",
					body: expect.stringContaining('"bot_id":"error_bot_id"'),
				}),
			);
		});

		test("should not notify when error alert env var is not set", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			await expect(
				handleGroupMeWebhook(
					payload({ text: "Click the link below" }),
					mockEnv,
				),
			).rejects.toThrow("Network error");

			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(mockFetch).not.toHaveBeenCalledWith(
				"https://api.groupme.com/v3/bots/post",
				expect.anything(),
			);
		});
	});
});
