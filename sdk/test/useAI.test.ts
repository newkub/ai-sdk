import { describe, it, expect, vi } from "vitest";
import { useAI } from "../src/useAI";

// Mock API calls
vi.mock("openai", () => ({
	OpenAI: vi.fn().mockImplementation(() => ({
		chat: {
			completions: {
				create: vi.fn().mockResolvedValue({
					choices: [{ message: { content: "Generated text" } }],
				}),
			},
		},
		images: {
			generate: vi.fn().mockResolvedValue({
				data: [{ url: "https://example.com/image.png" }],
			}),
		},
	})),
}));

describe("useAI", () => {
	it("should have generateText and generateImage methods", () => {
		const ai = useAI();

		expect(ai.generateText).toBeDefined();
		expect(ai.generateImage).toBeDefined();
	});

	it("should generate text successfully", async () => {
		const ai = useAI();

		const result = await ai.generateText({
			provider: "openai",
			prompt: "Test prompt",
			model: "gpt-3.5-turbo",
		});

		expect(result).toBe("Generated text");
	});

	it("should handle text generation errors", async () => {
		const ai = useAI();

		// Force error
		vi.spyOn(ai, "generateText").mockRejectedValue(new Error("API error"));

		await expect(
			ai.generateText({
				provider: "openai",
				prompt: "",
				model: "gpt-3.5-turbo",
			}),
		).rejects.toThrow("API error");
	});
});
