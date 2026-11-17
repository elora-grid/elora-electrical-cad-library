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
