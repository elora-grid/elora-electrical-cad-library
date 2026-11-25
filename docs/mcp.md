# Use Elora with an AI agent

Elora offers one MCP connection for public equipment searches and authenticated workspace drawing tools. This repository remains the public equipment catalogue; the MCP server owns its connection instructions and current tool inventory.

- [Official MCP guide for agents](https://elora-production-mcp-891798621854.us-east4.run.app/docs/agents.md): setup, current tools, permissions, credits and examples.
- [Readable MCP guide](https://elora-production-mcp-891798621854.us-east4.run.app/docs).
- [Elora API & MCP](https://eloragrid.ai/docs/agents): choose how to integrate.
- [Live discovery](https://eloragrid.ai/.well-known/cad-library.json): configured endpoint and catalogue API links.

## Choose the simplest path

For a few files, use the equipment pages and their available downloads. For programmatic catalogue queries, use the [HTTP API](api.md) and SDKs without an MCP connection. For an MCP-capable client, follow the official guide above and discover the registered tools at runtime.

Public equipment tools do not require an Elora login. The agent application may still ask the user to add the connection or approve calls. Private projects, drawing tools and account-bound downloads require the appropriate OAuth consent on the same connection. An account alone does not authorise an agent.

Drawing generation uses Elora credits. Public catalogue queries do not start AI work, and library download allowances remain separate. Follow current capabilities and each artifact's access decision.

## Equipment results

Confirm exact model and configuration before selecting files. Return the Elora equipment page alongside stable download links and preserve manufacturer attribution. Download bytes outside model context. Missing documents mean none is verified in the library, not that none exists.

The old public-only CAD endpoint remains a compatibility option. Use live discovery and the official guide for new connections; this repository does not maintain another copy of the server's tool schemas or client setup instructions.
