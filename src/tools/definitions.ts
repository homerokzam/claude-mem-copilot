export const toolDefinitions = [
  {
    name: "cmem_status",
    description: "Check Claude-Mem worker health and bridge configuration.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: "cmem_projects",
    description: "List projects known by the Claude-Mem worker.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: "cmem_search",
    description: "Search Claude-Mem project memory.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query." },
        project: { type: "string", description: "Optional Claude-Mem project name or path." },
        type: { type: "string" },
        obs_type: { type: "string" },
        limit: { type: "number", minimum: 1, maximum: 100 },
        offset: { type: "number", minimum: 0 },
        dateStart: { type: "string" },
        dateEnd: { type: "string" },
        orderBy: { type: "string" }
      },
      required: ["query"],
      additionalProperties: false
    }
  },
  {
    name: "cmem_timeline",
    description: "Fetch memory around an anchor observation or query.",
    inputSchema: {
      type: "object",
      properties: {
        anchor: { type: "string" },
        query: { type: "string" },
        project: { type: "string" },
        depth_before: { type: "number", minimum: 0, maximum: 50 },
        depth_after: { type: "number", minimum: 0, maximum: 50 }
      },
      additionalProperties: false
    }
  },
  {
    name: "cmem_get_observations",
    description: "Fetch full Claude-Mem observations by id.",
    inputSchema: {
      type: "object",
      properties: {
        ids: { type: "array", items: { type: "string" }, minItems: 1 },
        project: { type: "string" },
        limit: { type: "number", minimum: 1, maximum: 100 },
        orderBy: { type: "string" }
      },
      required: ["ids"],
      additionalProperties: false
    }
  },
  {
    name: "cmem_recent_context",
    description: "Get recent compact Claude-Mem context for a project.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string" },
        limit: { type: "number", minimum: 1, maximum: 50 }
      },
      additionalProperties: false
    }
  },
  {
    name: "cmem_start_project_session",
    description: "Create or reuse a logical Claude-Mem session for VS Code Copilot.",
    inputSchema: {
      type: "object",
      properties: {
        contentSessionId: { type: "string" },
        project: { type: "string" },
        prompt: { type: "string" },
        customTitle: { type: "string" }
      },
      additionalProperties: false
    }
  },
  {
    name: "cmem_remember",
    description: "Record a concise memory note in Claude-Mem.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        project: { type: "string" },
        contentSessionId: { type: "string" },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["text"],
      additionalProperties: false
    }
  },
  {
    name: "cmem_remember_decision",
    description: "Record a project decision and rationale in Claude-Mem.",
    inputSchema: {
      type: "object",
      properties: {
        decision: { type: "string" },
        rationale: { type: "string" },
        alternatives: { type: "array", items: { type: "string" } },
        files: { type: "array", items: { type: "string" } },
        project: { type: "string" },
        contentSessionId: { type: "string" }
      },
      required: ["decision"],
      additionalProperties: false
    }
  },
  {
    name: "cmem_remember_change",
    description: "Record an implementation change, files, commands, tests, and result in Claude-Mem.",
    inputSchema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        filesModified: { type: "array", items: { type: "string" } },
        commandsRun: { type: "array", items: { type: "string" } },
        tests: { type: "array", items: { type: "string" } },
        result: { type: "string" },
        project: { type: "string" },
        contentSessionId: { type: "string" }
      },
      required: ["summary"],
      additionalProperties: false
    }
  },
  {
    name: "cmem_summarize_project_session",
    description: "Ask Claude-Mem to summarize a logical session.",
    inputSchema: {
      type: "object",
      properties: {
        contentSessionId: { type: "string" },
        last_assistant_message: { type: "string" },
        project: { type: "string" }
      },
      additionalProperties: false
    }
  },
  {
    name: "cmem_complete_project_session",
    description: "Mark a logical Claude-Mem session complete.",
    inputSchema: {
      type: "object",
      properties: {
        contentSessionId: { type: "string" },
        project: { type: "string" }
      },
      additionalProperties: false
    }
  }
] as const;
