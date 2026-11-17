# Changelog

## 2.1.0 — 2026-11-17

Track the deployed API/MCP release with complete artifact manifests, source/delivery identity checks, access/reader review provenance and both OpenAPI contracts. Preserve every field in the 551 MB valid JSON feed using bounded streaming reads and compressed transport. No single V8-sized string or decompressed full-file buffer is required. Document the verified public six-tool MCP endpoint and include artifact access labels in CSV/search output.

The current snapshot retains all 56,512 pages and all 83,989 previous file associations, adds 77 prepared-file associations (84,066 total), and preserves all 44,692 public original-file hashes. It has 78,018 stable public download entries. Artifact access is recorded separately: 81,209 public, 2,122 requiring a CAD account and 735 requiring review. A public access classification alone does not establish that a hosted attachment is available. Source/delivery hashes and page identity remain separate from prepared conversion access.


## 2.0.0 — 2026-11-17

Refresh to 56,512 equipment/source pages, 397 manufacturers and 19 categories. Preserve 83,989 file listings, 80,875 Elora download entries, 44,692 distinct hosted original-file hashes and 35,627 preview-image links. These counts describe different units.

Move the complete metadata snapshot to lossless `data/catalogue.json.gz` because the decoded feed exceeds GitHub’s per-file limit. Update search, validation, manifests, bounded discovery and every readable equipment page together. The raw schema-v3 data is unchanged after decompression.

Document versioned API and MCP workflows, discovery-first endpoint selection, free public originals versus scoped exclusive conversions, catalogue-version recovery and exact attachment checksums. The agent-access deployment is separate from this metadata release; live discovery is authoritative. Preserve conversion, publisher checksum and source-archive provenance without weakening rights or private-data checks.


## 1.2.0 — 2026-11-05

Refresh the released public catalogue to 11,932 equipment/source entries from 115 manufacturers across 19 categories, including motors. Preserve 14,747 file listings, 11,646 website download entries, 10,374 distinct hosted originals and 9,250 preview-image links. Counts describe different things and are not interchangeable.

Repair refreshes after the full feed moved to a static URL. Accept the strict public document, technical-fact, installation and file-provenance fields now supplied by the website. Preserve the schema-v3 bulk snapshot in compact JSON below GitHub’s per-file size limit; add retrieval indexes in chunks of at most 250 records and linked human-readable directory pages.

Manufacturer CAD and model binaries are not copied. Existing website registration, delivery checks, manufacturer attribution and per-file rights continue to apply.
