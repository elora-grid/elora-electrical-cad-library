# Live API

Base: `https://eloragrid.ai/tools/cad-library`. Public read-only discovery requires no authentication.

| Resource | URL |
| --- | --- |
| Complete live metadata | `https://eloragrid.ai/tools/cad-library/catalogue.json?all=1` |
| Search | `https://eloragrid.ai/tools/cad-library/catalogue.json?q=inverter&hosted=1&market=US` |
| Entry JSON | `https://eloragrid.ai/tools/cad-library/entries/{id}.json` |
| Entry Markdown | `https://eloragrid.ai/tools/cad-library/entries/{id}.md` |
| OpenAPI | `https://eloragrid.ai/tools/cad-library/openapi.json` |
| Coverage audit | `https://eloragrid.ai/tools/cad-library/catalogue.json?audit=1` |
| Download | Use the exact `files[].downloadUrl` in a result. |

Search parameters: `q`, `category`, `manufacturer` (slug from OpenAPI), `format`, `market` (`US`, `AU`, `UK`, `Europe`, or `EU` alias), `kind`, `acquired=1`, `hosted=1`, `all=1`, `page`, and `limit` (1–100). Invalid filters return HTTP 400. The `all=1` option returns every matching source entry and ignores pagination.

`acquired=1` means an entry has acquired editable CAD; it does not mean the files are hosted publicly. `hosted=1` filters entries with at least one direct site download. `Global` entries appear in regional searches because market tags describe discovery.

```python
import json
from urllib.request import urlopen

url = "https://eloragrid.ai/tools/cad-library/catalogue.json?q=inverter&hosted=1&market=US"
with urlopen(url, timeout=30) as response:
    results = json.load(response)
for entry in results["equipment"]:
    for file in entry["files"]:
        if "downloadUrl" in file:
            print(entry["manufacturer"], file["name"], file["downloadUrl"])
```

Public download routes can require email registration on the equipment page before issuing a temporary attachment redirect. Follow the current page instructions; metadata and preview discovery do not require registration. Save the stable site URL for future retrieval. Use the delivery SHA-256 for the downloaded bytes; use the original SHA-256 for CAD bytes inside a delivery ZIP.

## Discovery fields

The full feed and per-entry JSON expose `equipmentFacts`, `fileChoiceGuidance`, `plainEnglish`, `relatedReferences`, and an optional `previewImage`. Resolve image paths against `https://eloragrid.ai`. Use the canonical equipment URL when citing the resource. Per-entry Markdown includes the visible facts and drawing guidance.

Individual `drawing` entries also identify `drawingReference` (family, original filenames and parent ID), optional `nativeFiles` metadata and `files[].archiveMember`. A family download can contain several drawings. Related references and preview illustrations do not replace the original files or establish technical equivalence.
