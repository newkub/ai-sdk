import type { BuiltinTool } from "../types";

export const httpRequestTool: BuiltinTool = {
	async execute(args: {
		url: string;
		method?: "GET" | "POST" | "PUT" | "DELETE";
		headers?: Record<string, string>;
		body?: unknown;
		timeout?: number;
	}) {
		const init: RequestInit = {
			method: args.method || "GET",
		};

		if (args.headers) {
			init.headers = new Headers(args.headers);
		}

		if (args.body && args.method !== "GET") {
			init.body = JSON.stringify(args.body);
		}

		const response = await fetch(args.url, init);
		return response.json();
	},
};
