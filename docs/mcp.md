# Connect your AI agent to the Equipment Library

Find manufacturer datasheets, CAD files and manuals from an MCP-compatible agent. The Equipment Library is a hosted public server: you do not need to install server code or sign in to discover tools and read metadata. This repository provides the catalogue and connection guides; the MCP server implementation is maintained separately.

**[Website setup guide](https://eloragrid.ai/docs/agents#cad-library)** · [API and SDK guide](api.md) · [Agent workflow guide](agents.md)

The production endpoint verified on 24 November 2026 is:

```text
https://elora-production-cad-mcp-891798621854.us-east4.run.app/mcp
```

It exposes the nine tools below. Use live discovery for future endpoint changes and `get_cad_capabilities` for current catalogue counts and limits.

## Quick connection

### Claude Code

Run this in your project directory, then use `/mcp` in Claude Code to check the connection:

```sh
claude mcp add --transport http elora-cad https://elora-production-cad-mcp-891798621854.us-east4.run.app/mcp
```

### Cursor

Merge this entry into `.cursor/mcp.json` in your project, keeping any existing servers:

```json
{
  "mcpServers": {
    "elora-cad": {
      "url": "https://elora-production-cad-mcp-891798621854.us-east4.run.app/mcp"
    }
  }
}
```

### Claude, ChatGPT and other remote MCP clients

Add a custom remote MCP server with the URL above, select Streamable HTTP where asked, and use **no authentication** for the public library. Custom connectors must be enabled for your account or workspace. Follow the [website setup guide](https://eloragrid.ai/docs/agents#cad-library) for the client-specific steps. Opening the endpoint in a browser is not an MCP connection.

Client references: [Claude Code](https://code.claude.com/docs/en/mcp) · [Cursor](https://cursor.com/docs/mcp).

## Discover the current service

1. Read `https://eloragrid.ai/.well-known/cad-library.json`.
2. Use its `public_mcp_endpoint` only when `public_mcp_status` is `configured`. If the document is unavailable or reports `not_configured`, use the catalogue HTTP API and check the current service status. Do not use a staging or guessed URL.
3. Connect an MCP-compatible client to that exact HTTPS `/mcp` endpoint using Streamable HTTP. Initialise and list its tools at runtime.
4. Start with `get_cad_capabilities`, then search and inspect exact equipment before selecting files.

## Nine public tools

| Tool | Purpose |
| --- | --- |
| `get_cad_capabilities` | Published count, formats, version and limits. |
| `search_cad` | Find exact manufacturer references or search descriptions. |
| `get_cad_item` | Inspect one item and prepared file metadata. |
| `get_datasheets` | Datasheet PDF links, provenance and specifications for the selected equipment. |
| `get_cad_files` | CAD files, formats, download links and access requirements. |
| `get_manuals` | Installation and operating manual PDF links for the selected equipment. |
| `get_related_cad` | Inspect evidence-labelled relationships. |
| `list_cad_artifacts` | Page through individual artifacts and access decisions. |
| `prepare_cad_downloads` | Plan independent links for selected prepared files. |

These nine public tools support anonymous metadata access. Preserve catalogue-version fences and follow structured recovery hints. Download file bytes outside model context; do not treat a filename extension, mesh or projection as proof of an editable solid, exact units or certified design.

## Try an equipment lookup

Ask your connected agent:

> Find the MEAN WELL HDR-60-24. Confirm the exact equipment match, then give me its datasheet, CAD files and installation manual with source and download links. Tell me whether the CAD represents this exact variant or the product family.

The tool sequence is:

1. Read `get_cad_capabilities` and search with `search_cad`.
2. Confirm the returned item ID and any ambiguity before selecting equipment.
3. Pass that ID as `equipment_id` to `get_datasheets`, `get_cad_files` and `get_manuals`. Retain `catalogue_version` when supplied and use `page`/`limit` for pagination.
4. Return the metadata and links. Public hosted datasheet and manual PDFs can be fetched directly without login or `prepare_cad_downloads`. CAD file downloads retain their own access and allowance rules.

For example, tool arguments for a selected item are:

```json
{"equipment_id":"mean-well-hdr-60-24","page":1,"limit":5}
```

An empty document list means none is verified in this library; it does not establish that the manufacturer has no document. A nonexistent item returns `item_not_found`. HTTP 200 alone does not establish a successful MCP tool result: inspect `isError` and the structured result.

## Downloads and account access

File delivery retains the live API's anonymous allowance and reusable email
registration policy. Public artifact access does not mean unlimited anonymous
downloads; follow `registration_required`, allowance and retry responses.

The public MCP can receive an existing scoped public-download token in its
transport Authorization header for caller-aware selection planning. Never put
credentials in tool arguments. Use the official HTTP SDK for authenticated file
transfer, and preserve the separation from verified-account OAuth access. See
[API token handling](api.md).

The account-connected drawings MCP is a separate server. It generates, edits and exports drawings in an approved workspace and supports `get_account_cad_download` with a verified account and explicit OAuth scope `cad:download`. Follow the [drawings connection guide](https://eloragrid.ai/docs/agents#account) for its endpoint, supported clients and consent. Creating an account alone does not authorise an agent. Do not substitute that protected endpoint for the public endpoint or expose account tokens in prompts or committed configuration.

The [live workflow guide](https://eloragrid.ai/tools/cad-library/agents.md), [skills catalogue](https://eloragrid.ai/.well-known/skills/index.json), [v1 capabilities](https://eloragrid.ai/api/cad/v1/capabilities) and [API examples](api.md) describe the deployed access policy. Discovery reports configuration; it is not a guarantee of indexing, ranking or acceptance by any particular assistant.
