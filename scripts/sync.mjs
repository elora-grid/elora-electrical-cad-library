import {readFile,writeFile,mkdir,readdir,unlink,mkdtemp} from 'node:fs/promises';
import {rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {inspectSnapshot,downloadSnapshot} from './snapshot.mjs';
import {BASE,REPOSITORY,CATEGORIES,SCHEMA,validateCatalogue,csv,entryMarkdown,clean,snapshotCounts,sourceAuditSummary} from './catalogue.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const args=process.argv.slice(2);
if(args.length && !(args.length===2&&args[0]==='--input-dir'))throw Error('Usage: node scripts/sync.mjs [--input-dir /path/to/public-feed-fixture]');
const input=args[0]==='--input-dir'?resolve(args[1]):null;
let bulkSnapshot;
async function source(name,path){
 if(name==='catalogue.json'){
  let file;
  if(input)file=join(input,'catalogue.json.gz');
  else{const temporary=await mkdtemp(join(tmpdir(),'public-cad-sync-'));process.once('exit',()=>rmSync(temporary,{recursive:true,force:true}));file=join(temporary,'catalogue.json.gz');await downloadSnapshot(file);}
  const {catalogue,decodedBytes,decodedSha256}=await inspectSnapshot(file);
  bulkSnapshot={packed:await readFile(file),decodedBytes,decodedSha256};return catalogue;
 }
 const body=input?await readFile(join(input,name),'utf8'):await(async()=>{const response=await fetch(`${BASE}/${path}`,{signal:AbortSignal.timeout(60000),redirect:'error',headers:{Accept:'application/json'}});if(!response.ok)throw Error(`Public feed ${name}: HTTP ${response.status}`);return response.text();})();
 if(Buffer.byteLength(body)>16*1024**2)throw Error('Public contract or audit exceeds bound');return JSON.parse(body);
}
const catalogue=validateCatalogue(await source('catalogue.json','../../cad-library/catalogue.json'));
const openapi=await source('openapi.json','openapi.json');
const audit=await source('audit.json','catalogue.json?audit=1');
const agentOpenapi=await source('openapi-v1.json','../../api/cad/v1/openapi.json');
if(agentOpenapi.openapi!=='3.1.0'||agentOpenapi.servers?.[0]?.url!=='https://eloragrid.ai/api/cad/v1'||!agentOpenapi.paths?.['/items'])throw Error('Unexpected agent API contract');
if(openapi.openapi!=='3.1.0'||openapi.servers?.[0]?.url!=='https://eloragrid.ai'||!openapi.paths?.[`${new URL(BASE).pathname}/catalogue.json`])throw Error('Unexpected OpenAPI source');
// Count the complete validated feed independently of the older source-register audit.
const records=catalogue.equipment;
const counts=snapshotCounts(records);
const sourceAudit=sourceAuditSummary(audit,counts);
const outputs=new Map();
const json=value=>JSON.stringify(value,null,2)+'\n';
// Preserve every schema-v3 field losslessly below GitHub's per-file limit.
// Small discovery shards below avoid requiring agents to fetch this bulk file.
outputs.set('data/catalogue.json.gz',bulkSnapshot.packed);
outputs.set('schema/catalogue.schema.json',json(SCHEMA));
outputs.set('openapi.json',json(openapi));outputs.set('openapi-v1.json',json(agentOpenapi));
outputs.set('data/catalogue.csv',csv([
  ['id','manufacturer','name','category','kind','part_number','markets','formats','access','canonical_url','official_source_url','checked_at','hosted_files','download_urls','live_markdown_url','live_json_url','preview_image_url','related_reference_urls'],
  ...records.map(r=>[r.id,r.manufacturer,r.name,r.category,r.kind,r.partNumber,r.markets.join('; '),r.formats.join('; '),r.availability,r.canonicalUrl,r.sourceUrl,r.checkedAt,r.files.filter(f=>f.downloadUrl).length,r.files.map(f=>f.downloadUrl).filter(Boolean).join('; '),`${BASE}/entries/${r.id}.md`,`${BASE}/entries/${r.id}.json`,r.previewImage?`https://eloragrid.ai${r.previewImage}`:'',(r.relatedReferences||[]).map(ref=>ref.url).join('; ')])
]));
outputs.set('data/files.csv',csv([
  ['record_id','file_id','manufacturer','name','format','purpose','official_url','site_download_url','redistribution','license_id','license_url','original_sha256','original_bytes','revision','retrieved_at','hosting_policy','hosting_checked_at','attribution','delivery_kind','delivery_format','delivery_sha256','delivery_bytes','archive_member','artifact_access','access_reason','geometry_kind','units'],
  ...records.flatMap(r=>r.files.map(f=>[r.id,f.id,r.manufacturer,f.name,f.format,f.purpose,f.url,f.downloadUrl,f.redistribution,f.license?.id,f.license?.url,f.sha256,f.bytes,f.revision,f.retrievedAt,f.hostingBasis?.policy,f.hostingBasis?.checkedAt,f.hostingBasis?.attribution,f.delivery?.kind||(f.delivery?'licensed-bundle':''),f.delivery?.format,f.delivery?.sha256,f.delivery?.bytes,f.archiveMember,r.artifacts?.find(a=>a.id===f.id)?.access.access,r.artifacts?.find(a=>a.id===f.id)?.access.reason,f.geometryKind,f.units]))
]));
for(const r of records)outputs.set(`equipment/${r.id}.md`,entryMarkdown(r));
const categoryIndexes=[];
for(const [id,label] of Object.entries(CATEGORIES)) {
  const items=records.filter(r=>r.category===id),pages=[];
  for(let start=0;start<items.length;start+=250) {
    const batch=items.slice(start,start+250),page=Math.floor(start/250)+1;
    const path=`data/indexes/${id}-${page}.json`,directory=`equipment/index-${id}-${page}.md`;
    outputs.set(path,json({schemaVersion:1,category:id,page,entries:batch.map(r=>({id:r.id,name:r.name,manufacturer:r.manufacturer,drawingNumber:r.drawingNumber,formats:r.formats,canonicalUrl:r.canonicalUrl,recordPath:`equipment/${r.id}.md`,jsonUrl:`${BASE}/entries/${r.id}.json`}))}));
    outputs.set(directory,[`# ${label} — page ${page}`,'',`[All categories](README.md) · [Live category](${BASE}/categories/${id})`,'',...batch.map(r=>`- [${clean(r.manufacturer)}: ${clean(r.name).replace(/[\[\]]/g,'')}](${r.id}.md)`),''].join('\n'));
    pages.push({path,directory,count:batch.length});
  }
  categoryIndexes.push({id,name:label,count:items.length,pages});
}
outputs.set('data/index.json',json({schemaVersion:1,canonical:BASE,counts,categories:categoryIndexes}));
outputs.set('equipment/README.md',[
  '# Equipment directory','',`Browse [Elora's CAD library](${BASE}) or search [the JSON catalogue](../data/catalogue.json.gz).`,'',
  ...categoryIndexes.flatMap(category=>[
    `## ${category.name} (${category.count} entries)`,'',...category.pages.map((page,i)=>`- [Entries ${i*250+1}–${i*250+page.count}](${page.directory.replace('equipment/','')})`),''
  ])
].join('\n'));
outputs.set('data/manifest.json',json({schemaVersion:1,repository:REPOSITORY,canonical:BASE,sourceFeed:`${BASE}/catalogue.json?all=1`,distribution:{path:'data/catalogue.json.gz',encoding:'gzip',decodedBytes:bulkSnapshot.decodedBytes,decodedSha256:bulkSnapshot.decodedSha256},counts,sourceAuditAt:audit.auditedAt,sourceAudit,licensing:{catalogue:'CC-BY-4.0',code:'MIT',manufacturerCad:'Per-file rights; no blanket licence'},files:Object.fromEntries([...outputs].map(([name,body])=>[name,{sha256:createHash('sha256').update(body).digest('hex'),bytes:Buffer.byteLength(body)}]))}));
outputs.set('README.md',[
  '# Elora Electrical CAD Library','',
  'Open catalogue of official manufacturer CAD, BIM and electrical engineering drawing sources for switchboards, switchgear, switchrooms, generators and microgrids. Free for engineers and AI agents.','',
  `**[Search and download CAD on Elora](${BASE})** · [Full JSON (gzip)](data/catalogue.json.gz) · [Equipment directory](equipment/README.md) · [Agent guide](docs/agents.md)`,'',
  `The current snapshot contains **${counts.entries.toLocaleString('en-US')} catalogue entries**, **${counts.manufacturers} manufacturers**, **${counts.categories} equipment categories**, and **${counts.hostedFileEntries.toLocaleString('en-US')} public Elora download entries** representing **${counts.distinctHostedOriginals.toLocaleString('en-US')} distinct hosted originals**. [Snapshot hashes and counts](data/manifest.json)`,'',
  '## Find CAD','',
  '- [Equipment index](equipment/README.md): one readable page per source, with manufacturer links, available files and rights evidence.',
  '- [Compact discovery index](data/index.json): category indexes in chunks of at most 250 records, with exact Markdown and live JSON links.',
  '- [Catalogue JSON (gzip)](data/catalogue.json.gz): complete lossless bulk metadata including equipment facts, plain-English guidance, preview-image links, related GA references, stable Elora download URLs, checksums and revisions. Decompress it before JSON parsing; use the compact index for retrieval.',
  '- [Catalogue CSV](data/catalogue.csv): one row per source. [Files CSV](data/files.csv): one row per listed file.',
  '- [API guide](docs/api.md), [MCP connection guide](docs/mcp.md), [OpenAPI](openapi.json), and [JSON Schema](schema/catalogue.schema.json): machine access and current rollout discovery.',
  '- [Coverage audit]('+BASE+'/coverage): collection gaps and acquisition priorities.','',
  `The snapshot includes **${counts.drawingEntries} individually identified drawing entries** and **${counts.previewableEntries} entries with preview-image links**. Each equipment page links to its exact live Markdown/JSON exports, manufacturer sources and related drawing references.`,'',
  `The feed lists **${counts.listedFiles.toLocaleString('en-US')} files** in total. Artifact decisions are recorded separately: **${counts.publicArtifactAccessEntries.toLocaleString('en-US')} public**, **${counts.accountRequiredArtifactEntries.toLocaleString('en-US')} requiring a CAD account** and **${counts.reviewRequiredArtifactEntries.toLocaleString('en-US')} requiring review**. A public classification alone does not mean a hosted attachment is available.`, '',
  'Preview images and interactive 3D controls are served by the canonical website. This repository contains metadata, readable explanations and links; no CAD or model binaries.','',
  `Counts above describe the full published catalogue. The separate source-register audit covers ${sourceAudit.records} earlier records and excludes later drawing-level and curated additions; its totals are not the full catalogue totals.`,'',
  '## Equipment coverage','',
  'Switchboards and LV/MV/HV switchgear; breakers and accessories; enclosures, busbar and fabrication hardware; protection, metering, automation, wiring and terminals; auxiliary power and UPS; cooling, ventilation, power quality and drives; transformers and earthing; generators, alternators and auxiliaries; batteries and PCS; solar and inverters; communications, cable management and switchroom services.','',
  'USA, Australia, UK and Europe have equal research priority. Market tags support discovery; they do not establish product-level regional parity or IEC/UL certification. The collection is expanding and is not exhaustive SKU or assembly coverage.','',
  '## API and MCP access','',
  'Start with [Elora API & MCP](https://mcp.eloragrid.ai/docs) or [live discovery](https://eloragrid.ai/.well-known/cad-library.json). Use the HTTP API directly for catalogue queries, or connect an MCP client to `https://mcp.eloragrid.ai/mcp` for public equipment and authenticated workspace tools. The [official MCP guide](https://mcp.eloragrid.ai/docs/agents.md) owns setup, permissions, credits and the running tool inventory. [API examples](docs/api.md) · [MCP overview](docs/mcp.md).','',
  'The [versioned contract](openapi-v1.json) describes workflows that find exact equipment and related files, then select prepared downloads. Read each artifact’s access policy: public originals need no account, while reviewed exclusive conversions require a free CAD account and scoped consent. Downloads do not start a conversion job.','',
  '## Use with an AI agent','',
  'Read [docs/agents.md](docs/agents.md), then search the JSON catalogue or live API. Return canonical equipment pages and stable `downloadUrl` values. Preserve manufacturer attribution and per-file rights information. Do not treat a family archive or manufacturer portal as an exact configured product.','',
  '```sh','npm run search -- --query "inverter" --market US --hosted','npm run sync','npm run validate','npm test','```','',
  '[Bulk snapshot format and decompression](docs/snapshot-format.md). `data/catalogue.json.gz` replaces the previous uncompressed file because the complete feed exceeds GitHub’s per-file limit; all metadata fields are retained. The search command reads it directly.','',
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
for(const [name,body] of outputs)if(Buffer.byteLength(body)>=100*1024*1024)throw Error(`Generated file exceeds GitHub limit: ${name}`);
for(const [name,body] of outputs){await mkdir(resolve(root,name,'..'),{recursive:true});await writeFile(join(root,name),body);}
await unlink(join(root,'data/catalogue.json')).catch(error=>{if(error.code!=='ENOENT')throw error;});
const keep=new Set([...outputs.keys()].filter(name=>name.startsWith('equipment/')).map(name=>name.slice('equipment/'.length)));
for(const name of await readdir(join(root,'equipment')))if(name.endsWith('.md')&&!keep.has(name))await unlink(join(root,'equipment',name));
for(const name of await readdir(join(root,'data/indexes')))if(!outputs.has('data/indexes/'+name))await unlink(join(root,'data/indexes',name));
console.log(JSON.stringify({source:BASE,...counts}));
