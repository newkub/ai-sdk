import { readFileTool, writeFileTool } from "./fileOperations";
import { caseConverterTool, countTool } from "./textTools";
import { httpRequestTool } from "./httpTool";
import { exampleTool } from "./exampleTool";

export const builtinTools = {
	"file.read": readFileTool,
	"file.write": writeFileTool,
	"text.convert-case": caseConverterTool,
	"text.count": countTool,
	"http.request": httpRequestTool,
	example: exampleTool,
};
