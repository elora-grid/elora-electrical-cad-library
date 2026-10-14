# Guide for AI agents

Use this catalogue to find official electrical CAD/BIM sources and downloadable files. The canonical service is https://eloragrid.ai/tools/cad-library.

## Start here

1. Read `data/catalogue.json` or call `https://eloragrid.ai/tools/cad-library/catalogue.json?all=1` for the current snapshot.
2. Search names, manufacturer, part number, equipment, keywords and archive filenames. Narrow by category, format and discovery market. See `docs/api.md` and `openapi.json`.
3. Inspect the entry's `kind`, exact `partNumber`, configuration notes and individual files before recommending it.
4. Return the entry's `canonicalUrl` and the file's stable `downloadUrl` when present. Otherwise return the official publisher's `url` and state any account, configurator or request requirement.
5. Preserve attribution, original SHA-256, revision, rights status and delivery information in downstream manifests.

The root `llms.txt` is a compact navigation guide, not a search-engine indexing guarantee. Per-entry Markdown is in `equipment/`; live Markdown is at `/tools/cad-library/entries/{id}.md`.

## Interpret the fields

| Field | Meaning |
| --- | --- |
| `kind` | `product`, `family`, `library` or `configurator`; these are different levels of specificity. |
| `markets` | Discovery relevance: US, AU, UK, Europe or Global. Global also appears in filtered regional results. |
| `standards` | Explicit recorded standards only. Missing standards do not establish IEC/UL compliance or noncompliance. |
| `files[].url` | Official manufacturer or endorsed publisher file URL. It may require login or configuration. |
| `files[].downloadUrl` | Stable Elora download route for a publicly hosted file. Follow its redirect when downloading. |
| `files[].sha256`, `bytes` | Acquired original-file identity and size. An acquired original is not necessarily publicly hosted. |
| `files[].delivery` | The delivered original or ZIP wrapper, with its own SHA-256 and size. |
| `files[].redistribution` | `permitted`, `unknown` or `restricted`; do not infer a licence from unknown rights. |
| `files[].license` | Explicit manufacturer/file licence where verified. |
| `files[].hostingBasis`, `rightsReview` | Attribution and evidence supporting the hosting decision. |
| `files[].archiveContents` | Filenames inside an acquired archive; these are not independently configured or certified product entries. |

## Download correctly

- Persist the stable `downloadUrl`, never the temporary signed URL returned by the redirect.
- Verify the received file against `delivery.sha256`. To verify the original CAD inside a wrapper, use the original `sha256`.
- A `404` can mean the file was revoked, explicitly restricted or unavailable. Refresh metadata before using the official source as a fallback.
- A `503` indicates temporary storage unavailability. Keep the official source link available.
- Prefer live metadata when preparing a current engineering deliverable; the GitHub snapshot can lag the website.

## Drawing requests

If a file requires a request, direct the engineer to Request CAD on the canonical equipment page. Do not invent a public request API or submit personal contact details automatically. Request records and contact details are private.

## Scope

This is an expanding source register, not exhaustive configured-product coverage. USA, Australia, UK and Europe have equal research priority, but exact regional variant parity is unverified. Confirm configuration, revision and dimensional units for the intended project. Third-party CAD rights remain separate from the open catalogue licence.
