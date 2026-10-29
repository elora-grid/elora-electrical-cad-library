import {readFile,writeFile,mkdir,readdir,unlink} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {BASE,REPOSITORY,CATEGORIES,SCHEMA,validateCatalogue,csv,entryMarkdown,clean,snapshotCounts,sourceAuditSummary} from './catalogue.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const args=process.argv.slice(2);
if(args.length && !(args.length===2&&args[0]==='--input-dir'))throw Error('Usage: node scripts/sync.mjs [--input-dir /path/to/public-feed-fixture]');
const input=args[0]==='--input-dir'?resolve(args[1]):null;
async function source(name,path){
  if(input)return JSON.parse(await readFile(join(input,name),'utf8'));
  const response=await fetch(`${BASE}/${path}`,{signal:AbortSignal.timeout(60000),redirect:'error',headers:{Accept:'application/json'}});
  if(!response.ok)throw Error(`Public feed ${name}: HTTP ${response.status}`);
  const body=await response.text();if(body.length>30000000)throw Error('Public feed exceeds export size limit');
  return JSON.parse(body);
}
const catalogue=validateCatalogue(await source('catalogue.json','catalogue.json?all=1'));
const openapi=await source('openapi.json','openapi.json');
const audit=await source('audit.json','catalogue.json?audit=1');
if(openapi.openapi!=='3.1.0'||openapi.servers?.[0]?.url!=='https://eloragrid.ai'||!openapi.paths?.[`${new URL(BASE).pathname}/catalogue.json`])throw Error('Unexpected OpenAPI source');
// Count the complete validated feed independently of the older source-register audit.
const records=catalogue.equipment;
const counts=snapshotCounts(records);
const sourceAudit=sourceAuditSummary(audit,counts);
const outputs=new Map();
const json=value=>JSON.stringify(value,null,2)+'\n';
outputs.set('data/catalogue.json',json(catalogue));
outputs.set('schema/catalogue.schema.json',json(SCHEMA));
outputs.set('openapi.json',json(openapi));
outputs.set('data/catalogue.csv',csv([
  ['id','manufacturer','name','category','kind','part_number','markets','formats','access','canonical_url','official_source_url','checked_at','hosted_files','download_urls','live_markdown_url','live_json_url','preview_image_url','related_reference_urls'],
  ...records.map(r=>[r.id,r.manufacturer,r.name,r.category,r.kind,r.partNumber,r.markets.join('; '),r.formats.join('; '),r.availability,r.canonicalUrl,r.sourceUrl,r.checkedAt,r.files.filter(f=>f.downloadUrl).length,r.files.map(f=>f.downloadUrl).filter(Boolean).join('; '),`${BASE}/entries/${r.id}.md`,`${BASE}/entries/${r.id}.json`,r.previewImage?`https://eloragrid.ai${r.previewImage}`:'',(r.relatedReferences||[]).map(ref=>ref.url).join('; ')])
]));
outputs.set('data/files.csv',csv([
  ['record_id','file_id','manufacturer','name','format','purpose','official_url','site_download_url','redistribution','license_id','license_url','original_sha256','original_bytes','revision','retrieved_at','hosting_policy','hosting_checked_at','attribution','delivery_kind','delivery_format','delivery_sha256','delivery_bytes','archive_member'],
  ...records.flatMap(r=>r.files.map(f=>[r.id,f.id,r.manufacturer,f.name,f.format,f.purpose,f.url,f.downloadUrl,f.redistribution,f.license?.id,f.license?.url,f.sha256,f.bytes,f.revision,f.retrievedAt,f.hostingBasis?.policy,f.hostingBasis?.checkedAt,f.hostingBasis?.attribution,f.delivery?.kind||(f.delivery?'licensed-bundle':''),f.delivery?.format,f.delivery?.sha256,f.delivery?.bytes,f.archiveMember]))
]));
for(const r of records)outputs.set(`equipment/${r.id}.md`,entryMarkdown(r));
outputs.set('equipment/README.md',[
  '# Equipment directory','',`Browse [Elora's CAD library](${BASE}) or search [the JSON catalogue](../data/catalogue.json).`,'',
  ...Object.entries(CATEGORIES).flatMap(([id,label])=>[
    `## ${label}`,'',...records.filter(r=>r.category===id).map(r=>`- [${clean(r.manufacturer)}: ${clean(r.name).replace(/[\[\]]/g,'')}](${r.id}.md)`),''
  ])
].join('\n'));
outputs.set('data/manifest.json',json({schemaVersion:1,repository:REPOSITORY,canonical:BASE,sourceFeed:`${BASE}/catalogue.json?all=1`,counts,sourceAuditAt:audit.auditedAt,sourceAudit,licensing:{catalogue:'CC-BY-4.0',code:'MIT',manufacturerCad:'Per-file rights; no blanket licence'},files:Object.fromEntries([...outputs].map(([name,body])=>[name,{sha256:createHash('sha256').update(body).digest('hex'),bytes:Buffer.byteLength(body)}]))}));
outputs.set('README.md',[
  '# Elora Electrical CAD Library','',
  'Open catalogue of official manufacturer CAD, BIM and electrical engineering drawing sources for switchboards, switchgear, switchrooms, generators and microgrids. Free for engineers and AI agents.','',
  `**[Search and download CAD on Elora](${BASE})** · [JSON catalogue](data/catalogue.json) · [Equipment directory](equipment/README.md) · [Agent guide](docs/agents.md)`,'',
  `The current snapshot contains **${counts.entries} catalogue entries**, **${counts.manufacturers} manufacturers**, **${counts.categories} equipment categories**, and **${counts.hostedFileEntries} site download entries** representing **${counts.distinctHostedOriginals} distinct hosted originals**. [Snapshot hashes and counts](data/manifest.json)`,'',
  '## Find CAD','',
  '- [Equipment index](equipment/README.md): one readable page per source, with manufacturer links, available files and rights evidence.',
  '- [Catalogue JSON](data/catalogue.json): complete metadata including equipment facts, plain-English guidance, preview-image links, related GA references, stable Elora download URLs, checksums and revisions.',
  '- [Catalogue CSV](data/catalogue.csv): one row per source. [Files CSV](data/files.csv): one row per listed file.',
  '- [Live search API](docs/api.md), [OpenAPI](openapi.json), and [JSON Schema](schema/catalogue.schema.json): machine access without an account.',
  '- [Coverage audit]('+BASE+'/coverage): collection gaps and acquisition priorities.','',
  `The snapshot includes **${counts.drawingEntries} individually identified drawing entries** and **${counts.previewableEntries} entries with preview-image links**. Each equipment page links to its exact live Markdown/JSON exports, manufacturer sources and related drawing references.`,'',
  'Preview images and interactive 3D controls are served by the canonical website. This repository contains metadata, readable explanations and links; no CAD or model binaries.','',
  `Counts above describe the full published catalogue. The separate source-register audit covers ${sourceAudit.records} earlier records and excludes later drawing-level and curated additions; its totals are not the full catalogue totals.`,'',
  '## Equipment coverage','',
  'Switchboards and LV/MV/HV switchgear; breakers and accessories; enclosures, busbar and fabrication hardware; protection, metering, automation, wiring and terminals; auxiliary power and UPS; cooling, ventilation, power quality and drives; transformers and earthing; generators, alternators and auxiliaries; batteries and PCS; solar and inverters; communications, cable management and switchroom services.','',
  'USA, Australia, UK and Europe have equal research priority. Market tags support discovery; they do not establish product-level regional parity or IEC/UL certification. The collection is expanding and is not exhaustive SKU or assembly coverage.','',
  '## Use with an AI agent','',
  'Read [docs/agents.md](docs/agents.md), then search the JSON catalogue or live API. Return canonical equipment pages and stable `downloadUrl` values. Preserve manufacturer attribution and per-file rights information. Do not treat a family archive or manufacturer portal as an exact configured product.','',
  '```sh','npm run search -- --query "inverter" --market US --hosted','npm run sync','npm run validate','npm test','```','',
  'Node.js 22 or newer is required for the scripts. No dependencies or API keys are needed to search, validate or refresh the catalogue. The GitHub workflow checks contributions and refreshes the public metadata daily; unchanged snapshots produce no commit. GitHub may pause scheduled workflows after 60 days without repository activity; maintainers can re-enable or run the workflow manually.','',
  '## Downloads and drawing requests','',
  'CAD files are delivered by Elora or the official publisher. This repository stores metadata and links. Elora download URLs remain stable and redirect to temporary attachment URLs; do not save the temporary URL. If drawings require an account, configuration or request, follow the equipment page. Request CAD registers the request with the Elora team; engineer contact details are private and excluded from this repository.','',
  '## Licensing','',
  'Elora-authored catalogue metadata and documentation, including any database rights Elora holds in its compilation, are [CC BY 4.0](LICENSES/CC-BY-4.0.txt). Attribute “Elora Grid AI — Official Electrical CAD Library” and link to '+BASE+'. Scripts and tests are [MIT](LICENSES/MIT.txt).','',
  'Manufacturer CAD, publisher text, trademarks and third-party material retain their respective rights. The catalogue licence does not license those files. `redistribution` is recorded as `permitted`, `unknown` or `restricted`; unknown remains unknown. Original and delivered-file checksums are separate. Explicit restrictions retain official publisher routes. [Licensing scope](LICENSE.md)','',
  '## Contribute','',
  `Report a [missing official source](${REPOSITORY}/issues/new?template=missing-source.yml), [broken link or revision](${REPOSITORY}/issues/new?template=broken-link.yml), or [rights correction](${REPOSITORY}/issues/new?template=rights-correction.yml). Include the official manufacturer evidence and exact model where available. Never upload customer drawings or private project files. Read [CONTRIBUTING.md](CONTRIBUTING.md).`,'',
  'The public website feed is the source of truth. Use each entry’s canonicalUrl as the preferred citation link; this is publisher guidance, not an HTML canonical directive or a guarantee of search-engine selection. Generated indexes and equipment pages are refreshed from that feed; accepted source corrections should be incorporated there before regeneration.',''
].join('\n'));
// Validate the whole candidate snapshot before replacing any generated file.
for(const [name,body] of outputs){await mkdir(resolve(root,name,'..'),{recursive:true});await writeFile(join(root,name),body);}
const keep=new Set(records.map(r=>r.id+'.md').concat('README.md'));
for(const name of await readdir(join(root,'equipment')))if(name.endsWith('.md')&&!keep.has(name))await unlink(join(root,'equipment',name));
console.log(JSON.stringify({source:BASE,...counts}));
