import type { BuiltinTool } from "../types";

export const exampleTool: BuiltinTool = {
	async execute(args: Record<string, unknown>) {
		// Implement tool logic here
		return { result: "Example tool executed", args };
	},
};
