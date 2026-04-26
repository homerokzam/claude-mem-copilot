import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { ClaudeMemClient } from "./claudeMemClient.js";
import { packageName, packageVersion } from "./version.js";
import { toolDefinitions } from "./tools/definitions.js";
import { callClaudeMemTool } from "./tools/handler.js";

export async function runMcpServer(): Promise<void> {
  const server = new Server(
    { name: packageName, version: packageVersion },
    { capabilities: { tools: {}, resources: {}, prompts: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [...toolDefinitions] }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return callClaudeMemTool(request.params.name, request.params.arguments);
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: "claude-mem://status",
        name: "Claude-Mem status",
        description: "Claude-Mem worker health and bridge configuration.",
        mimeType: "application/json"
      },
      {
        uri: "claude-mem://projects",
        name: "Claude-Mem projects",
        description: "Projects known by Claude-Mem.",
        mimeType: "application/json"
      }
    ]
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const client = new ClaudeMemClient();
    const uri = request.params.uri;
    if (uri === "claude-mem://status") {
      const worker = await client.health();
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ worker, config: client.config }, null, 2) }] };
    }
    if (uri === "claude-mem://projects") {
      const projects = await client.projects();
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(projects, null, 2) }] };
    }
    throw new Error(`Unknown resource: ${uri}`);
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [
      {
        name: "cmem_use_memory",
        description: "Use Claude-Mem before answering questions that depend on project history.",
        arguments: [{ name: "query", description: "What to look up in project memory.", required: true }]
      },
      {
        name: "cmem_record_outcome",
        description: "Record the outcome of a meaningful coding task in Claude-Mem.",
        arguments: [{ name: "summary", description: "Task result to remember.", required: true }]
      }
    ]
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    if (request.params.name === "cmem_use_memory") {
      const query = request.params.arguments?.query ?? "the current task";
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Search Claude-Mem with cmem_search for: ${query}. Use cmem_timeline or cmem_get_observations when a result needs more context.`
            }
          }
        ]
      };
    }
    if (request.params.name === "cmem_record_outcome") {
      const summary = request.params.arguments?.summary ?? "the completed task";
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Record this outcome in Claude-Mem with cmem_remember_change: ${summary}. Include files, commands, tests, and result when known.`
            }
          }
        ]
      };
    }
    throw new Error(`Unknown prompt: ${request.params.name}`);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
