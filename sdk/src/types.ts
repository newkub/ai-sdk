export interface ToolArgs {
	[key: string]: unknown;
}

export interface MCPTool<T = unknown> {
	execute(args: ToolArgs): Promise<T>;
}

export interface BuiltinTool<T = unknown> {
	execute(args: ToolArgs): Promise<T>;
}

// กำหนด type เฉพาะสำหรับ tools หลัก
export interface HttpToolArgs extends ToolArgs {
	url: string;
	method: "GET" | "POST" | "PUT" | "DELETE";
	headers?: Record<string, string>;
	body?: unknown;
}

export interface FileOperationArgs extends ToolArgs {
	path: string;
	content?: string;
	encoding?: BufferEncoding;
}

export interface TextToolArgs extends ToolArgs {
	text: string;
	options?: Record<string, unknown>;
}
