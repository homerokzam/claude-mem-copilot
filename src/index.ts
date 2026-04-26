import { runMcpServer } from "./mcpServer.js";

export { runMcpServer } from "./mcpServer.js";

if (import.meta.url === `file://${process.argv[1]}`) {
  runMcpServer().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
