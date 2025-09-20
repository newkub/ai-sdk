import type { BuiltinTool } from "../types";

export const caseConverterTool: BuiltinTool = {
	async execute(args: { text: string; to: "upper" | "lower" | "title" }) {
		switch (args.to) {
			case "upper":
				return args.text.toUpperCase();
			case "lower":
				return args.text.toLowerCase();
			case "title":
				return args.text.replace(
					/\w\S*/g,
					(txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
				);
			default:
				return args.text;
		}
	},
};

export const countTool: BuiltinTool = {
	async execute(args: { text: string }) {
		return {
			characters: args.text.length,
			words: args.text.split(/\s+/).filter(Boolean).length,
			lines: args.text.split("\n").length,
		};
	},
};
