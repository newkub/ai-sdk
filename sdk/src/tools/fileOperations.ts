import type { BuiltinTool } from "../types";
import fs from "fs";
import path from "path";

export const readFileTool: BuiltinTool = {
	async execute(args: { path: string }) {
		return fs.promises.readFile(args.path, "utf-8");
	},
};

export const writeFileTool: BuiltinTool = {
	async execute(args: { path: string; content: string }) {
		await fs.promises.mkdir(path.dirname(args.path), { recursive: true });
		return fs.promises.writeFile(args.path, args.content, "utf-8");
	},
};
