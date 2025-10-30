import type { Context } from "hono";
import {
	groupMeWebhookHandler,
	isIllegalMessage,
} from "../src/webhook-handler";

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

// Mock global fetch
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
				expect(isIllegalMessage(msg.content)).toBe(msg.expected);
			});
		}

		test("empty message", () => {
			expect(isIllegalMessage("")).toBe(false);
		});
	});

	describe("blocked phrases", () => {
		test("should detect 'click the link below'", () => {
			expect(isIllegalMessage("Please click the link below to verify")).toBe(
				true,
			);
		});

		test("should detect 'contact me on whatsapp'", () => {
			expect(isIllegalMessage("You can contact me on whatsapp")).toBe(true);
		});

		test("should detect 'verify your account'", () => {
			expect(isIllegalMessage("Please verify your account to continue")).toBe(
				true,
			);
		});

		test("should detect 'free cash giveaway'", () => {
			expect(isIllegalMessage("Join our free cash giveaway now!")).toBe(true);
		});
	});

	describe("blocked sequences", () => {
		test("should detect ticket giveaways", () => {
			expect(isIllegalMessage("giving away free billie eilish tickets")).toBe(
				true,
			);
		});

		test("should detect product sales", () => {
			expect(isIllegalMessage("Selling my macbook air for cheap")).toBe(true);
		});

		test("should detect season pass scams", () => {
			expect(isIllegalMessage("Get your full season pass now")).toBe(true);
		});

		test("should detect car selling scams", () => {
			expect(
				isIllegalMessage("Clean used 2012 Honda Accord for sale for $3000"),
			).toBe(true);
		});
	});

	describe("clean messages", () => {
		test("should allow normal conversation", () => {
			expect(isIllegalMessage("Hello, how are you?")).toBe(false);
			expect(isIllegalMessage("This message is safe and clean")).toBe(false);
		});

		test("should handle empty messages", () => {
			expect(isIllegalMessage("")).toBe(false);
		});
	});
});

describe("groupMeWebhookHandler", () => {
	let mockContext: Partial<Context>;
	const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockContext = {
			req: {
				json: jest.fn(),
			} as unknown as Context["req"],
			env: {
				GROUPME_ACCESS_TOKEN: "test_token",
				GROUPME_BOT_ID: "test_bot_id",
				STAGING: false,
			} as unknown as Context["env"],
			json: jest.fn((data, status) => ({
				data,
				status,
			})) as unknown as Context["json"],
		};
	});

	describe("clean messages", () => {
		test("should return ok status for clean messages", async () => {
			(mockContext.req?.json as jest.Mock)?.mockResolvedValue({
				text: "Hello, how are you?",
				group_id: "12345",
				id: "msg_001",
				sender_id: "user_001",
			});

			await groupMeWebhookHandler(mockContext as Context);

			expect(mockContext.json).toHaveBeenCalledWith({ status: "ok" }, 200);
			expect(mockFetch).not.toHaveBeenCalled();
		});

		test("should handle empty text messages", async () => {
			(mockContext.req?.json as jest.Mock)?.mockResolvedValue({
				text: "",
				group_id: "12345",
				id: "msg_001",
				sender_id: "user_001",
			});

			await groupMeWebhookHandler(mockContext as Context);

			expect(mockContext.json).toHaveBeenCalledWith({ status: "ok" }, 200);
			expect(mockFetch).not.toHaveBeenCalled();
		});

		test("should handle missing text field", async () => {
			(mockContext.req?.json as jest.Mock)?.mockResolvedValue({
				group_id: "12345",
				id: "msg_001",
				sender_id: "user_001",
			});

			await groupMeWebhookHandler(mockContext as Context);

			expect(mockContext.json).toHaveBeenCalledWith({ status: "ok" }, 200);
			expect(mockFetch).not.toHaveBeenCalled();
		});
	});

	describe("staging mode", () => {
		test("should only post bot message in staging mode", async () => {
			if (mockContext.env) {
				mockContext.env.STAGING = true;
			}

			(mockContext.req?.json as jest.Mock)?.mockResolvedValue({
				text: "Buy my crypto now!",
				group_id: "12345",
				id: "msg_001",
				sender_id: "user_001",
			});

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				text: async () => JSON.stringify({ success: true }),
			} as Response);

			await groupMeWebhookHandler(mockContext as Context);

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
			(mockContext.req?.json as jest.Mock)?.mockResolvedValue({
				text: "Click the link below to buy crypto",
				group_id: "12345",
				id: "msg_001",
				sender_id: "user_001",
			});

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

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				text: async () => JSON.stringify({ success: true }),
			} as Response);

			await groupMeWebhookHandler(mockContext as Context);

			expect(mockFetch).toHaveBeenCalledTimes(4);

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

			expect(mockFetch).toHaveBeenNthCalledWith(
				4,
				"https://api.groupme.com/v3/groups/12345/members/membership_001/remove?token=test_token",
				{ method: "POST" },
			);

			expect(mockContext.json).toHaveBeenCalledWith({ status: "ok" }, 200);
		});

		test("should handle user not found in group", async () => {
			(mockContext.req?.json as jest.Mock)?.mockResolvedValue({
				text: "Buy my crypto",
				group_id: "12345",
				id: "msg_001",
				sender_id: "user_999",
			});

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

			await groupMeWebhookHandler(mockContext as Context);

			expect(mockFetch).toHaveBeenCalledTimes(1);

			expect(mockContext.json).toHaveBeenCalledWith(
				{ status: "user not found" },
				200,
			);
		});
	});

	describe("case sensitivity", () => {
		test("should detect illegal content regardless of case", async () => {
			(mockContext.req?.json as jest.Mock)?.mockResolvedValue({
				text: "CLICK THE LINK BELOW",
				group_id: "12345",
				id: "msg_001",
				sender_id: "user_001",
			});

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

			await groupMeWebhookHandler(mockContext as Context);

			expect(mockFetch).toHaveBeenCalled();
			expect(mockContext.json).toHaveBeenCalledWith({ status: "ok" }, 200);
		});
	});

	describe("real-world spam examples", () => {
		test("should handle car selling scam", async () => {
			(mockContext.req?.json as jest.Mock)?.mockResolvedValue({
				text: "Clean used 2012 Honda Accord For Sale For $3000 Perfect condition no problems at all Just need some space I bought a new car 2016 Honda accord Dm for more information and if you're interested (585) 365-3185",
				group_id: "12345",
				id: "msg_001",
				sender_id: "user_001",
			});

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

			await groupMeWebhookHandler(mockContext as Context);

			expect(mockFetch).toHaveBeenCalledTimes(4);
			expect(mockContext.json).toHaveBeenCalledWith({ status: "ok" }, 200);
		});

		test("should handle ticket scam", async () => {
			(mockContext.req?.json as jest.Mock)?.mockResolvedValue({
				text: "Giving away free Billie Eilish tickets! DM me for details",
				group_id: "12345",
				id: "msg_001",
				sender_id: "user_001",
			});

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

			await groupMeWebhookHandler(mockContext as Context);

			expect(mockFetch).toHaveBeenCalledTimes(4);
			expect(mockContext.json).toHaveBeenCalledWith({ status: "ok" }, 200);
		});
	});

	describe("error handling", () => {
		test("should handle fetch errors when getting group data", async () => {
			(mockContext.req?.json as jest.Mock)?.mockResolvedValue({
				text: "Buy crypto now",
				group_id: "12345",
				id: "msg_001",
				sender_id: "user_001",
			});

			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			await expect(
				groupMeWebhookHandler(mockContext as Context),
			).rejects.toThrow("Network error");
		});

		test("should handle fetch errors when deleting message", async () => {
			(mockContext.req?.json as jest.Mock)?.mockResolvedValue({
				text: "Click the link below",
				group_id: "12345",
				id: "msg_001",
				sender_id: "user_001",
			});

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
				groupMeWebhookHandler(mockContext as Context),
			).rejects.toThrow("Delete failed");
		});
	});

	describe("random bot message", () => {
		test("should post rare bot message when random condition is met", async () => {
			const originalRandom = Math.random;
			Math.random = jest.fn(() => 0.462926);

			(mockContext.req?.json as jest.Mock)?.mockResolvedValue({
				text: "Click the link below to buy crypto",
				group_id: "12345",
				id: "msg_001",
				sender_id: "user_001",
			});

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

			await groupMeWebhookHandler(mockContext as Context);

			expect(mockFetch).toHaveBeenCalledTimes(5);

			expect(mockFetch).toHaveBeenNthCalledWith(
				5,
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

	describe("safeFetch logging coverage", () => {
		test("should log with label parameter", async () => {
			mockConsoleLog.mockClear();

			(mockContext.req?.json as jest.Mock)?.mockResolvedValue({
				text: "Click the link below",
				group_id: "12345",
				id: "msg_001",
				sender_id: "user_001",
			});

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

			await groupMeWebhookHandler(mockContext as Context);

			expect(mockConsoleLog).toHaveBeenCalledWith(
				expect.stringMatching(/\[HTTP\] Request - /),
				expect.any(String),
				expect.anything(),
			);

			expect(mockConsoleLog).toHaveBeenCalledWith(
				expect.stringMatching(/\[HTTP\] Response - /),
				expect.any(Number),
				expect.any(String),
			);
		});

		test("should log without label parameter", async () => {
			mockConsoleLog.mockClear();
			const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				text: async () => JSON.stringify({ test: "response" }),
			} as Response);

			(mockContext.req?.json as jest.Mock)?.mockResolvedValue({
				text: "test message",
				group_id: "12345",
				id: "msg_001",
				sender_id: "user_001",
			});

			await groupMeWebhookHandler(mockContext as Context);

			expect(mockConsoleLog).toHaveBeenCalled();
		});
	});
});
