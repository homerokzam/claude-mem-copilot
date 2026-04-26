#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const result = spawnSync("claude-mem-copilot", ["hook", "vscode-copilot", "pretooluse"], {
  stdio: ["inherit", "inherit", "inherit"]
});
process.exit(result.status ?? 1);
