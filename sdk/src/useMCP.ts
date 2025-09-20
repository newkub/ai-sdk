import type { MCPTool, ToolArgs } from "./types";

interface McpResult {
	/**
	 * Calls an MCP tool by name
	 * @param toolName Name of the tool to call
	 * @param args Arguments for the tool
	 * @returns Promise with the tool's result
	 * @throws {Error} If tool is not found or execution fails
	 */
	callTool<T = unknown>(toolName: string, args: ToolArgs): Promise<T>;

	/**
	 * Registers a new MCP tool
	 * @param name Unique name of the tool
	 * @param tool Tool implementation
	 */
	registerTool(name: string, tool: MCPTool): void;
}

export function useMCP(): McpResult {
	const mcpTools: Record<string, MCPTool> = {};

	return {
		callTool: async <T>(toolName: string, args: ToolArgs) => {
			const tool = mcpTools[toolName];
			if (!tool) {
				throw new Error(`MCP tool ${toolName} not found`);
			}
			return tool.execute(args) as Promise<T>;
		},
		registerTool: (name: string, tool: MCPTool) => {
			mcpTools[name] = tool;
		},
	};
}
