# CAD library APIs

The canonical service is https://eloragrid.ai/tools/cad-library. Metadata reads are public. The versioned agent-access release is deployed separately from this GitHub snapshot: check live discovery and capabilities before using v1. A 404 means that rollout is not available at that origin yet; the catalogue endpoints below remain available.

## Versioned agent API

Start at [CAD discovery](https://eloragrid.ai/.well-known/cad-library.json). It links the [v1 OpenAPI contract](https://eloragrid.ai/api/cad/v1/openapi.json), [current capabilities](https://eloragrid.ai/api/cad/v1/capabilities), [workflow guide](https://eloragrid.ai/tools/cad-library/agents.md), [skills catalogue](https://eloragrid.ai/.well-known/skills/index.json) and configured MCP endpoint. See [MCP setup](mcp.md).

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/cad/v1/capabilities` | Actual published item count, formats, version and limits. |
| GET | `/api/cad/v1/items` | Search by `q`, `manufacturer`, `part_number`, `category`, `format`, `page`, `limit` and `catalogue_version`. |
| GET | `/api/cad/v1/items/{id}` | Exact item and its first artifact manifests. |
| GET | `/api/cad/v1/items/{id}/related` | Evidence-labelled relationships; similar or family items do not establish compatibility. |
| GET | `/api/cad/v1/items/{id}/artifacts` | Paginated prepared files and their individual access policies. |
| POST | `/api/cad/v1/deliveries` | Plan independent download links for 1–50 distinct `artifact_ids`. |
| GET | `/api/cad/v1/artifacts/{artifact_id}/download` | Current file delivery, subject to its access policy. |

```sh
curl -G 'https://eloragrid.ai/api/cad/v1/items' \
  --data-urlencode 'manufacturer=Hager' \
  --data-urlencode 'part_number=VD101NE' --data 'limit=20'
```

Inspect ambiguity, configuration, revision and `kind` before selecting. Follow `next_page` and carry the first response’s `catalogue_version` through subsequent search, related and artifact pages. HTTP 409 `catalogue_changed` means restart from page 1 and reselect current artifacts. Read capabilities for current limits, and respect 429 `Retry-After` and structured recovery actions.

POST selection bodies contain only `{"artifact_ids":["record-id:file-id"]}`. This plans independent file links; it does not create an account, email, bundle, conversion job or engineering design. Download bytes to disk outside model context. Native/contained formats differ from the delivered ZIP/RAR container. Geometry and units remain unknown unless evidenced.

The v1 access policy makes public manufacturer originals and reviewed public equivalents anonymous. Reviewed exclusive conversions require a free verified CAD account and separate scoped agent consent. Read the artifact’s current access result rather than inferring availability from this snapshot. A legacy website download can still show registration before that access release is deployed. Stable links renew short-lived attachments; verify delivered bytes against the artifact/delivery SHA-256, and source bytes against the original SHA-256.

Official standalone clients are linked from the workflow guide: [Python](https://eloragrid.ai/cad-library/sdk/cad_library.py) and [TypeScript](https://eloragrid.ai/cad-library/sdk/cad-library.ts). These are HTTP clients; client availability follows the agent-access rollout.

## Existing catalogue API and bulk exports

Base: `https://eloragrid.ai/tools/cad-library`.

| Resource | URL |
| --- | --- |
| Complete live metadata | `https://eloragrid.ai/tools/cad-library/catalogue.json?all=1` |
| Search | `https://eloragrid.ai/tools/cad-library/catalogue.json?q=inverter&hosted=1&market=US` |
| Entry JSON / Markdown | `https://eloragrid.ai/tools/cad-library/entries/{id}.json` or `.md` |
| Catalogue OpenAPI | `https://eloragrid.ai/tools/cad-library/openapi.json` |
| Historical source audit | `https://eloragrid.ai/tools/cad-library/catalogue.json?audit=1` |
| Website download | The exact `files[].downloadUrl` returned by current metadata. |

Search parameters are `q`, `application`, `category`, `manufacturer` (slug from catalogue OpenAPI), `format`, `market` (`US`, `AU`, `UK`, `Europe`, or `EU` alias), `kind`, `acquired=1`, `hosted=1`, `all=1`, `page`, and `limit` (1–100). These differ from v1 filters. Invalid filters return HTTP 400. `all=1` returns every matching source and ignores pagination; the full feed redirects to the static bulk export. Avoid loading it into an agent’s context; use search or the repository’s 250-entry discovery shards.

The compressed repository snapshot preserves all full-feed fields. [Read it locally](snapshot-format.md). `equipmentFacts`, `fileChoiceGuidance`, `plainEnglish`, `relatedReferences` and optional `previewImage` support explanations; resolve image paths against `https://eloragrid.ai`. Cite `canonicalUrl` and retain manufacturer evidence and rights. `acquired=1` is acquisition evidence, while `hosted=1` means a current Elora download link. Neither establishes an exact configured product or regional certification.
