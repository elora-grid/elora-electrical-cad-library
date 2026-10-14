import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateCatalogue,csv,entryMarkdown,BASE} from '../scripts/catalogue.mjs';
const source=JSON.parse(await readFile(new URL('../data/catalogue.json',import.meta.url),'utf8'));
const copy=()=>structuredClone(source);
test('public full snapshot validates with distinct counts',()=>{
  validateCatalogue(copy());assert.equal(new Set(source.equipment.map(r=>r.id)).size,source.total);
  assert.ok(source.equipment.some(r=>r.files.some(f=>f.downloadUrl&&f.redistribution==='unknown')));
});
test('private paths and unexpected contact fields stop export',()=>{
  for(const [key,value] of [['localPath','/Users/engineer/project/file.step'],['requestContact',{email:'private@example.com'}],['storage_path','private-bucket/original.step']]){
    const s=copy();s.equipment[0].files[0][key]=value;assert.throws(()=>validateCatalogue(s),/unexpected field/);
  }
});
test('credentials in known public text fields stop export',()=>{
  const s=copy();s.equipment[0].description='private /Users/engineer/project';assert.throws(()=>validateCatalogue(s),/Private or ephemeral/);
});
test('partial pagination and duplicate IDs stop export',()=>{
  const s=copy();s.equipment.pop();assert.throws(()=>validateCatalogue(s),/Incomplete/);
  const d=copy();d.equipment[1].id=d.equipment[0].id;assert.throws(()=>validateCatalogue(d),/Duplicate/);
});
test('temporary signed links and foreign download URLs stop export',()=>{
  for(const link of ['https://storage.example.com/file?token=secret','https://unrelated.example/download/file']){
    const s=copy();s.equipment.find(r=>r.files.some(f=>f.downloadUrl)).files.find(f=>f.downloadUrl).downloadUrl=link;
    assert.throws(()=>validateCatalogue(s),/Invalid hosted/);
  }
});
test('rights restriction or removed review cannot retain a site download',()=>{
  const s=copy();const f=s.equipment.flatMap(r=>r.files).find(f=>f.downloadUrl&&f.redistribution==='unknown');
  f.redistribution='restricted';assert.throws(()=>validateCatalogue(s),/Invalid hosted/);
  const d=copy();const g=d.equipment.flatMap(r=>r.files).find(f=>f.downloadUrl&&f.redistribution==='unknown');
  delete g.rightsReview;assert.throws(()=>validateCatalogue(d),/Invalid hosted/);
});
test('original and delivery identities retained; CSV formula cells escaped',()=>{
  const r=source.equipment.find(r=>r.files.some(f=>f.downloadUrl));
  const text=entryMarkdown(r);for(const f of r.files.filter(f=>f.downloadUrl)){
    assert.ok(text.includes(f.downloadUrl));assert.ok(text.includes(f.sha256));assert.ok(text.includes(f.delivery.sha256));
  }
  assert.equal(csv([['=HYPERLINK("x")','normal']]),'"\'=HYPERLINK(""x"")","normal"\r\n');
});
test('path traversal cannot create equipment files',()=>{
  const s=copy();s.equipment[0].id='../secret';s.equipment[0].canonicalUrl=BASE+'/equipment/../secret';assert.throws(()=>validateCatalogue(s),/invalid pattern/);
});
