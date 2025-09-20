import { generateText } from "./useGenText";
import { generateImage } from "./usegenImage";
import { useMCP } from "./useMCP";
import { useBuiltinTools } from "./useBuiltinTools";
import type { GenTextOptions } from "./useGenText";
import type { GenImageOptions } from "./usegenImage";
import type { ToolArgs } from "./types";

interface AgentServices {
	generateText(options: GenTextOptions): Promise<string>;
	generateImage(options: GenImageOptions): Promise<string[]>;
	callTool<T = unknown>(toolName: string, args: ToolArgs): Promise<T>;
	mcp: ReturnType<typeof useMCP>;
	tools: ReturnType<typeof useBuiltinTools>;
}

const handleToolCall = async <T>(
	toolName: string,
	args: ToolArgs,
	tools: ReturnType<typeof useBuiltinTools>,
	mcp: ReturnType<typeof useMCP>,
): Promise<T> => {
	try {
		return (await tools.callTool(toolName, args)) as T;
	} catch (error) {
		console.error(`Builtin tool ${toolName} failed:`, error);
		try {
			return await mcp.callTool<T>(toolName, args);
		} catch (mcpError) {
			console.error(`MCP tool ${toolName} also failed:`, mcpError);
			throw new Error(`All tool options failed for ${toolName}`);
		}
	}
};

export function useAgents(): AgentServices {
	const mcp = useMCP();
	const tools = useBuiltinTools();

	return {
		generateText,
		generateImage,
		callTool: <T>(toolName: string, args: ToolArgs) =>
			handleToolCall<T>(toolName, args, tools, mcp),
		mcp,
		tools,
	};
}

export { generateText, generateImage };
export type { GenTextOptions, GenImageOptions };
