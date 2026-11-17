# Connect to the CAD library through MCP

The public CAD MCP and the protected main-product MCP are separate services. This repository is a metadata snapshot, not an MCP server.

1. Read `https://eloragrid.ai/.well-known/cad-library.json`.
2. Use its `public_mcp_endpoint` only when `public_mcp_status` is `configured`. If the document is unavailable or reports `not_configured`, use the catalogue HTTP API while the separate agent-access rollout completes. Do not use a staging or guessed URL.
3. Connect an MCP-compatible client to that exact HTTPS `/mcp` endpoint using Streamable HTTP. Initialise and list its tools at runtime.
4. Start with `get_cad_capabilities`, then search and inspect exact equipment before selecting files.

The public tools are:

| Tool | Purpose |
| --- | --- |
| `get_cad_capabilities` | Published count, formats, version and limits. |
| `search_cad` | Find exact manufacturer references or search descriptions. |
| `get_cad_item` | Inspect one item and prepared file metadata. |
| `get_related_cad` | Inspect evidence-labelled relationships. |
| `list_cad_artifacts` | Page through individual artifacts and access decisions. |
| `prepare_cad_downloads` | Plan independent links for selected prepared files. |

These six public tools require no identity. Preserve catalogue-version fences and follow structured recovery hints. Download file bytes outside model context; do not treat a filename extension, mesh or projection as proof of an editable solid, exact units or certified design.

Reviewed exclusive conversions use the existing protected MCP connection and `get_exclusive_cad_download`, with a verified free CAD account and explicit OAuth scope `cad:download`. Creating an account alone does not authorise an agent. Do not substitute that protected endpoint for the public endpoint or expose account tokens in prompts or committed configuration.

The [live workflow guide](https://eloragrid.ai/tools/cad-library/agents.md), [skills catalogue](https://eloragrid.ai/.well-known/skills/index.json), [v1 capabilities](https://eloragrid.ai/api/cad/v1/capabilities) and [API examples](api.md) describe the deployed access policy. Discovery reports configuration; it is not a guarantee of indexing, ranking or acceptance by any particular assistant.
