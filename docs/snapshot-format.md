# Complete metadata snapshot

Version 2 stores the complete schema-v3 JSON feed in `data/catalogue.json.gz`. It replaces the previous `data/catalogue.json`: the current decoded feed is larger than GitHub’s 100 MiB per-file limit. Gzip is lossless. The API-aware feed is now over 550 MB decoded, so Node tools read the valid JSON array incrementally, one equipment object per line, instead of creating a single V8 string. Standard JSON parsers still read the decompressed document. Manufacturer CAD/model binaries are still delivered by Elora or their publisher and are not included here.

`data/manifest.json` records both compressed-file SHA-256/size and `distribution.decodedSha256`/`decodedBytes`. `npm run validate` checks both, the full schema, discovery coverage and every generated equipment page’s checksum. Original CAD and delivered-container hashes remain separate fields inside each record.

The built-in CLI reads gzip directly:

```sh
npm run search -- --query VD101NE --manufacturer Hager --hosted
```

Python example for local bulk processing:

```python
import gzip, json
with gzip.open("data/catalogue.json.gz", "rt", encoding="utf-8") as stream:
    catalogue = json.load(stream)
print(catalogue["total"])
```

For a local uncompressed copy, run `gzip -dk data/catalogue.json.gz`. That generated file is ignored by Git and removed by the next snapshot refresh. Do not commit it.

Agents should normally start with `data/index.json` and its compact category shards, or use the live search API. Use stable download links, retain per-file rights and verify attachment checksums. A download entry can repeat an original file shared by several product or drawing pages; manifest counts distinguish those units.
