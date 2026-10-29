# Elora Electrical CAD Library

Open catalogue of official manufacturer CAD, BIM and electrical engineering drawing sources for switchboards, switchgear, switchrooms, generators and microgrids. Free for engineers and AI agents.

**[Search and download CAD on Elora](https://eloragrid.ai/tools/cad-library)** · [JSON catalogue](data/catalogue.json) · [Equipment directory](equipment/README.md) · [Agent guide](docs/agents.md)

The current snapshot contains **724 catalogue entries**, **108 manufacturers**, **18 equipment categories**, and **1193 site download entries** representing **269 distinct hosted originals**. [Snapshot hashes and counts](data/manifest.json)

## Find CAD

- [Equipment index](equipment/README.md): one readable page per source, with manufacturer links, available files and rights evidence.
- [Catalogue JSON](data/catalogue.json): complete metadata including equipment facts, plain-English guidance, preview-image links, related GA references, stable Elora download URLs, checksums and revisions.
- [Catalogue CSV](data/catalogue.csv): one row per source. [Files CSV](data/files.csv): one row per listed file.
- [Live search API](docs/api.md), [OpenAPI](openapi.json), and [JSON Schema](schema/catalogue.schema.json): machine access without an account.
- [Coverage audit](https://eloragrid.ai/tools/cad-library/coverage): collection gaps and acquisition priorities.

The snapshot includes **385 individually identified drawing entries** and **424 entries with preview-image links**. Each equipment page links to its exact live Markdown/JSON exports, manufacturer sources and related drawing references.

Preview images and interactive 3D controls are served by the canonical website. This repository contains metadata, readable explanations and links; no CAD or model binaries.

Counts above describe the full published catalogue. The separate source-register audit covers 329 earlier records and excludes later drawing-level and curated additions; its totals are not the full catalogue totals.

## Equipment coverage

Switchboards and LV/MV/HV switchgear; breakers and accessories; enclosures, busbar and fabrication hardware; protection, metering, automation, wiring and terminals; auxiliary power and UPS; cooling, ventilation, power quality and drives; transformers and earthing; generators, alternators and auxiliaries; batteries and PCS; solar and inverters; communications, cable management and switchroom services.

USA, Australia, UK and Europe have equal research priority. Market tags support discovery; they do not establish product-level regional parity or IEC/UL certification. The collection is expanding and is not exhaustive SKU or assembly coverage.

## Use with an AI agent

Read [docs/agents.md](docs/agents.md), then search the JSON catalogue or live API. Return canonical equipment pages and stable `downloadUrl` values. Preserve manufacturer attribution and per-file rights information. Do not treat a family archive or manufacturer portal as an exact configured product.

```sh
npm run search -- --query "inverter" --market US --hosted
npm run sync
npm run validate
npm test
```

Node.js 22 or newer is required for the scripts. No dependencies or API keys are needed to search, validate or refresh the catalogue. The GitHub workflow checks contributions and refreshes the public metadata daily; unchanged snapshots produce no commit. GitHub may pause scheduled workflows after 60 days without repository activity; maintainers can re-enable or run the workflow manually.

## Downloads and drawing requests

CAD files are delivered by Elora or the official publisher. This repository stores metadata and links. Elora download URLs remain stable and redirect to temporary attachment URLs; do not save the temporary URL. If drawings require an account, configuration or request, follow the equipment page. Request CAD registers the request with the Elora team; engineer contact details are private and excluded from this repository.

## Licensing

Elora-authored catalogue metadata and documentation, including any database rights Elora holds in its compilation, are [CC BY 4.0](LICENSES/CC-BY-4.0.txt). Attribute “Elora Grid AI — Official Electrical CAD Library” and link to https://eloragrid.ai/tools/cad-library. Scripts and tests are [MIT](LICENSES/MIT.txt).

Manufacturer CAD, publisher text, trademarks and third-party material retain their respective rights. The catalogue licence does not license those files. `redistribution` is recorded as `permitted`, `unknown` or `restricted`; unknown remains unknown. Original and delivered-file checksums are separate. Explicit restrictions retain official publisher routes. [Licensing scope](LICENSE.md)

## Contribute

Report a [missing official source](https://github.com/elora-grid/elora-electrical-cad-library/issues/new?template=missing-source.yml), [broken link or revision](https://github.com/elora-grid/elora-electrical-cad-library/issues/new?template=broken-link.yml), or [rights correction](https://github.com/elora-grid/elora-electrical-cad-library/issues/new?template=rights-correction.yml). Include the official manufacturer evidence and exact model where available. Never upload customer drawings or private project files. Read [CONTRIBUTING.md](CONTRIBUTING.md).

The public website feed is the source of truth. Use each entry’s canonicalUrl as the preferred citation link; this is publisher guidance, not an HTML canonical directive or a guarantee of search-engine selection. Generated indexes and equipment pages are refreshed from that feed; accepted source corrections should be incorporated there before regeneration.
