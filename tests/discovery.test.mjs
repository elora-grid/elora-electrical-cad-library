import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateCatalogue,entryMarkdown,md,snapshotCounts,sourceAuditSummary,BASE} from '../scripts/catalogue.mjs';
const source=JSON.parse(await readFile(new URL('../data/catalogue.json',import.meta.url),'utf8'));
const copy=()=>structuredClone(source);
test('expanded feed preserves drawing identities, public facts and preview metadata',()=>{
  validateCatalogue(copy());
  const drawing=source.equipment.find(r=>r.drawingReference&&r.nativeFiles?.length);
  assert.equal(drawing.kind,'drawing');
  assert.ok(drawing.files.some(f=>f.archiveMember));
  assert.ok(source.equipment.some(r=>r.id===drawing.drawingReference.parentId));
  assert.ok(source.equipment.every(r=>r.equipmentFacts.length&&r.plainEnglish&&r.fileChoiceGuidance.length));
});
test('every generated equipment page carries exact discovery links and source facts',async()=>{
  for(const r of source.equipment){
    const text=await readFile(new URL(`../equipment/${r.id}.md`,import.meta.url),'utf8');
    for(const expected of [r.canonicalUrl,r.sourceUrl,`${BASE}/entries/${r.id}.md`,`${BASE}/entries/${r.id}.json`,md(r.plainEnglish.example),...r.equipmentFacts.map(f=>md(f.value)),...(r.relatedReferences||[]).map(ref=>ref.url)])assert.ok(text.includes(expected),`${r.id}: ${expected}`);
    if(r.previewImage)assert.ok(text.includes(`https://eloragrid.ai${r.previewImage}`));
    for(const f of r.files)if(f.archiveMember)assert.ok(text.includes(`- Archive member: ${md(f.archiveMember)}`));
  }
});
test('images are website thumbnails, including a drawing using its parent preview',()=>{
  const parent=source.equipment.find(r=>r.previewImage&&r.drawingReference&&r.previewImage.includes('/'+r.drawingReference.parentId+'/'));
  assert.ok(parent);validateCatalogue(copy());
  for(const path of ['/tools/cad-library/preview/other-record/file?view=thumb','//unrelated.example/image.png',parent.previewImage.replace('view=thumb','view=model')]){
    const s=copy();s.equipment.find(r=>r.id===parent.id).previewImage=path;
    assert.throws(()=>validateCatalogue(s),/preview image|invalid pattern/);
  }
});
test('missing drawing parents and foreign GA references stop export',()=>{
  const s=copy();s.equipment.find(r=>r.drawingReference).drawingReference.parentId='missing-parent';
  assert.throws(()=>validateCatalogue(s),/Missing drawing parent/);
  const d=copy();d.equipment[0].relatedReferences=[{name:'External',url:'https://unrelated.example/objects/reference'}];
  assert.throws(()=>validateCatalogue(d),/Unexpected GA/);
});
test('new explanatory fields remain strict and reject private or malformed data',()=>{
  const s=copy();s.equipment[0].plainEnglish.requestContact='private@example.com';
  assert.throws(()=>validateCatalogue(s),/unexpected field/);
  const d=copy();d.equipment[0].equipmentFacts[0].value='/Users/engineer/private-project';
  assert.throws(()=>validateCatalogue(d),/Private or ephemeral/);
  const malformed=copy();malformed.equipment[0].fileChoiceGuidance='not an array';
  assert.throws(()=>validateCatalogue(malformed),/expected array/);
});
test('source-register audit does not substitute for the expanded catalogue totals',()=>{
  const counts=snapshotCounts(source.equipment);
  const audit={auditedAt:'2026-10-14T03:00:31Z',counts:{records:329,hostedFiles:265}};
  assert.ok(counts.entries>audit.counts.records);
  assert.ok(counts.hostedFileEntries>counts.distinctHostedOriginals);
  assert.equal(counts.previewableEntries,source.equipment.filter(r=>r.previewImage).length);
  assert.equal(sourceAuditSummary(audit,counts).records,329);
  assert.throws(()=>sourceAuditSummary({...audit,counts:{...audit.counts,records:counts.entries+1}},counts),/Invalid source-register/);
});
test('Markdown escapes equipment copy while preserving native-file provenance',()=>{
  const r=structuredClone(source.equipment.find(r=>r.nativeFiles?.length));
  r.plainEnglish.example='Read <script> and [model] safely';
  const text=entryMarkdown(r);assert.ok(text.includes(md(r.plainEnglish.example)));assert.ok(!text.includes('<script>'));
  for(const f of r.nativeFiles)for(const fact of [f.sourceUrl,f.sha256,f.archiveSha256,md(f.filename)])assert.ok(text.includes(fact));
});
