import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {decodeSnapshot,sha256} from '../scripts/snapshot.mjs';
import {validateCatalogue} from '../scripts/catalogue.mjs';
const fixture=await readFile(new URL('./fixtures/catalogue.json',import.meta.url));
test('compressed metadata retains every original byte and schema field',()=>{
 const decoded=decodeSnapshot(gzipSync(fixture));assert.deepEqual(decoded,fixture);
 assert.equal(sha256(decoded),sha256(fixture));validateCatalogue(JSON.parse(decoded));
});
test('corruption and oversized decoded input stop snapshot reads',()=>{
 const packed=gzipSync(Buffer.from('x'.repeat(1000)));
 assert.throws(()=>decodeSnapshot(packed.subarray(0,packed.length-5)));
 assert.throws(()=>decodeSnapshot(packed,100));
});
test('new native provenance remains typed and rejects extra private fields',()=>{
 const a=JSON.parse(fixture),r=a.equipment.find(r=>r.files.some(f=>f.sourceArchive));
 assert.ok(r);r.files.find(f=>f.sourceArchive).sourceArchive.localPath='/Users/private';
 assert.throws(()=>validateCatalogue(a),/unexpected field/);
});

import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {inspectSnapshot} from '../scripts/snapshot.mjs';
import {writeCatalogueGzip,readCatalogueRows,catalogueTextLines} from '../scripts/catalogue-stream.mjs';
test('streamed full JSON preserves UTF-8, nested nulls, separators and exact decoded identity',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'cad-stream-test-'));
 try{const file=join(dir,'catalogue.json.gz'),rows=[{id:'a',text:'Zürich 中文 \" } ]',nested:null},{id:'b',text:'second\nline'}];
  await writeCatalogueGzip(file,{schemaVersion:3,total:2},rows);const proof=await inspectSnapshot(file),bytes=decodeSnapshot(await readFile(file));
  assert.deepEqual(proof.catalogue.equipment,rows);assert.equal(proof.decodedBytes,bytes.length);assert.equal(proof.decodedSha256,sha256(bytes));
  await writeFile(file,(await readFile(file)).subarray(0,20));await assert.rejects(inspectSnapshot(file));
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('streamed input rejects count mismatches, trailing data and per-record overflows',async()=>{
 async function collect(lines){for await(const row of readCatalogueRows(lines))void row;}
 await assert.rejects(collect(['{"total":2,"equipment":[','{"id":"a"}',']}']),/Incomplete/);
 await assert.rejects(collect(['{"total":1,"equipment":[','{"id":"a"}',']}','unexpected']),/Unexpected/);
 async function bounded(){for await(const line of catalogueTextLines([Buffer.from('123456789\n')],8))void line;}
 await assert.rejects(bounded(),/bound/);
});
test('current artifact access cannot be escalated or detached from source hashes',()=>{
 const a=JSON.parse(fixture),r=a.equipment.find(r=>r.artifacts?.some(x=>x.access.access!=='public'));
 assert.ok(r);const artifact=r.artifacts.find(x=>x.access.access!=='public'),file=r.files.find(f=>f.id===artifact.id);
 file.downloadUrl=`https://eloragrid.ai/tools/cad-library/download/${r.id}/${file.id}`;
 assert.throws(()=>validateCatalogue(a),/Invalid hosted/);
 const b=JSON.parse(fixture),item=b.equipment.find(r=>r.artifacts?.some(x=>x.sourceSha256));
 item.artifacts.find(x=>x.sourceSha256).sourceSha256='0'.repeat(64);
 assert.throws(()=>validateCatalogue(b),/Artifact identity/);
});
