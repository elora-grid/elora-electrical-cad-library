import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {validateCatalogue,SCHEMA,snapshotCounts} from './catalogue.mjs';
import {inspectSnapshot} from './snapshot.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const snapshot=await inspectSnapshot(new URL('../data/catalogue.json.gz',import.meta.url));
const catalogue=validateCatalogue(snapshot.catalogue);
const schema=JSON.parse(await readFile(join(root,'schema/catalogue.schema.json'),'utf8'));
if(JSON.stringify(schema)!==JSON.stringify(SCHEMA))throw Error('Schema does not match exporter');
const manifest=JSON.parse(await readFile(join(root,'data/manifest.json'),'utf8'));
for(const [name,expected] of Object.entries(manifest.files)){
  if(!/^(data|schema|equipment)\/[a-zA-Z0-9_./-]+$|^openapi(?:-v1)?\.json$/.test(name)||name.includes('..'))throw Error('Unexpected manifest path');
  const body=await readFile(join(root,name));
  if(body.length!==expected.bytes||createHash('sha256').update(body).digest('hex')!==expected.sha256)throw Error(`Snapshot checksum mismatch: ${name}`);
}
if(manifest.distribution.path!=='data/catalogue.json.gz'||manifest.distribution.encoding!=='gzip'||snapshot.decodedBytes!==manifest.distribution.decodedBytes||snapshot.decodedSha256!==manifest.distribution.decodedSha256)throw Error('Decoded catalogue checksum mismatch');
const generated=await readdir(join(root,'equipment'));
const expectedEquipment=Object.keys(manifest.files).filter(name=>name.startsWith('equipment/'));
if(generated.length!==expectedEquipment.length)throw Error('Unexpected equipment pages');
const index=JSON.parse(await readFile(join(root,'data/index.json'),'utf8'));
const indexed=[];
for(const category of index.categories)for(const page of category.pages){
  const shard=JSON.parse(await readFile(join(root,page.path),'utf8'));
  if(shard.entries.length!==page.count||page.count>250)throw Error('Invalid discovery shard');
  indexed.push(...shard.entries.map(record=>record.id));
}
const indexedIds=new Set(indexed);
if(indexed.length!==catalogue.total||indexedIds.size!==catalogue.total||catalogue.equipment.some(record=>!indexedIds.has(record.id)))throw Error('Incomplete discovery index');
for(const [key,value] of Object.entries(snapshotCounts(catalogue.equipment)))if(manifest.counts[key]!==value)throw Error(`Manifest count mismatch: ${key}`);
console.log(`Validated ${catalogue.total} entries, ${manifest.counts.listedFiles} file links, ${manifest.counts.hostedFileEntries} site download entries and all generated checksums.`);
