import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {validateCatalogue,SCHEMA} from './catalogue.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const catalogue=validateCatalogue(JSON.parse(await readFile(join(root,'data/catalogue.json'),'utf8')));
const schema=JSON.parse(await readFile(join(root,'schema/catalogue.schema.json'),'utf8'));
if(JSON.stringify(schema)!==JSON.stringify(SCHEMA))throw Error('Schema does not match exporter');
const manifest=JSON.parse(await readFile(join(root,'data/manifest.json'),'utf8'));
for(const [name,expected] of Object.entries(manifest.files)){
  if(!/^(data|schema|equipment)\/[a-zA-Z0-9_./-]+$|^openapi\.json$/.test(name)||name.includes('..'))throw Error('Unexpected manifest path');
  const body=await readFile(join(root,name));
  if(body.length!==expected.bytes||createHash('sha256').update(body).digest('hex')!==expected.sha256)throw Error(`Snapshot checksum mismatch: ${name}`);
}
const generated=await readdir(join(root,'equipment'));
if(generated.length!==catalogue.total+1)throw Error('Unexpected equipment pages');
if(manifest.counts.entries!==catalogue.total||manifest.counts.hostedFileEntries!==catalogue.equipment.flatMap(r=>r.files).filter(f=>f.downloadUrl).length)throw Error('Manifest counts mismatch');
console.log(`Validated ${catalogue.total} entries, ${manifest.counts.listedFiles} file links, ${manifest.counts.hostedFileEntries} site download entries and all generated checksums.`);
