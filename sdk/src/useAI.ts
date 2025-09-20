import { generateText } from "./useGenText";
import { generateImage } from "./usegenImage";
import type { GenTextOptions } from "./useGenText";
import type { GenImageOptions } from "./usegenImage";

export interface AIResult {
	generateText(options: GenTextOptions): Promise<string>;
	generateImage(options: GenImageOptions): Promise<string[]>;
}

export function useAI(): AIResult {
	return {
		generateText,
		generateImage,
	};
}

export { generateText, generateImage };
export type { GenTextOptions, GenImageOptions };
