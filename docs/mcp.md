# Connect your AI agent to the Equipment Library with MCP

Add `https://mcp.eloragrid.ai/mcp` to your MCP client using Streamable HTTP. One connection provides public Equipment Library tools and authenticated workspace drawing tools.

- [Elora API & MCP](https://mcp.eloragrid.ai/docs): connection instructions and examples.
- [Official guide for agents](https://mcp.eloragrid.ai/docs/agents.md): current tools, workflows, permissions and credits.

Public equipment searches, datasheets and manuals need no Elora login. Private workspace tools require OAuth consent on the same connection. Your agent application may ask you to approve the connection or individual calls. Drawing generation uses your Elora credits; public catalogue queries do not start AI work. Follow each file’s current access policy for downloads.

Use `search_cad` to find the exact model, then `get_cad_equipment` with the returned `equipment_id` for its available resources and published previews. Include the Elora equipment page alongside download links and preserve manufacturer attribution. Missing documents mean none is verified in the library, not that none exists.

For direct catalogue queries without an MCP client, use the [HTTP API](api.md). This repository stores catalogue metadata and links; the MCP runtime maintains its own tool descriptions, schemas and setup instructions.
