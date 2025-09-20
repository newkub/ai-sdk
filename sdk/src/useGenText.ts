import { OpenAI } from "openai";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";

// Type definitions
interface TextGenerationParams {
	prompt: string;
	model?: string;
	maxTokens?: number;
	temperature?: number;
}

type ProviderConfig =
	| { provider: "openai" }
	| { provider: "anthropic" }
	| { provider: "gemini" };

type GenTextOptions = TextGenerationParams & ProviderConfig;

// Client factories
const createOpenAiClient = () =>
	new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const createAnthropicClient = () =>
	new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const createGeminiClient = () =>
	new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Generator functions
const openAiGenerator = async (params: TextGenerationParams) => {
	const client = createOpenAiClient();
	const response = await client.chat.completions.create({
		model: params.model || "gpt-3.5-turbo",
		messages: [{ role: "user", content: params.prompt }],
		...(params.maxTokens !== undefined && { max_tokens: params.maxTokens }),
		...(params.temperature !== undefined && {
			temperature: params.temperature,
		}),
	});
	return response.choices[0]?.message?.content || "";
};

const anthropicGenerator = async (params: TextGenerationParams) => {
	const client = createAnthropicClient();
	const response = await client.messages.create({
		model: params.model || "claude-3-haiku-20240307",
		messages: [{ role: "user", content: params.prompt }],
		max_tokens: params.maxTokens ?? 1024,
		...(params.temperature !== undefined && {
			temperature: params.temperature,
		}),
	});
	return (
		response.content
			.filter((c): c is Anthropic.TextBlock => c.type === "text")
			.map((c) => c.text)
			.join("\n") || ""
	);
};

const geminiGenerator = async (params: TextGenerationParams) => {
	const client = createGeminiClient();
	const model = client.getGenerativeModel({
		model: params.model || "gemini-2.0-flash-001",
		generationConfig: {
			...(params.maxTokens !== undefined && {
				maxOutputTokens: params.maxTokens,
			}),
			...(params.temperature !== undefined && {
				temperature: params.temperature,
			}),
		},
	});
	const result = await model.generateContent(params.prompt);
	return result.response.text();
};

// Main function
export const generateText = async (
	options: GenTextOptions,
): Promise<string> => {
	try {
		const { provider, ...params } = options;
		const generators = {
			openai: openAiGenerator,
			anthropic: anthropicGenerator,
			gemini: geminiGenerator,
		};

		return await generators[provider](params);
	} catch (err) {
		throw new Error(
			`Text generation failed: ${err instanceof Error ? err.message : String(err)}`,
		);
	}
};

export type { GenTextOptions };
