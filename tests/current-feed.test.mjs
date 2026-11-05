import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateCatalogue,entryMarkdown,md} from '../scripts/catalogue.mjs';
const source=JSON.parse(await readFile(new URL('../data/catalogue.json',import.meta.url),'utf8'));
test('static full export can omit the unused query field',()=>{
 const full=structuredClone(source);delete full.query;validateCatalogue(full);
 full.query='private';assert.throws(()=>validateCatalogue(full),/unexpected constant/);
});
test('new technical facts retain their exact public evidence in readable pages',()=>{
 const entry=source.equipment.find(r=>r.technicalFacts?.length&&r.drawingNumber);
 assert.ok(entry);const page=entryMarkdown(entry);assert.ok(page.includes(md(entry.drawingNumber)));
 for(const fact of entry.technicalFacts){assert.ok(page.includes(md(fact.value)));assert.ok(page.includes(fact.sourceUrl));}
 const broken=structuredClone(source);broken.equipment[0].technicalFacts=[{label:'Reference',value:'Public',sourceUrl:'https://example.com',privatePath:'/Users/private'}];
 assert.throws(()=>validateCatalogue(broken),/unexpected field/);
});
test('bounded discovery shards cover each released record exactly once',async()=>{
 const index=JSON.parse(await readFile(new URL('../data/index.json',import.meta.url),'utf8'));
 const ids=[];
 for(const category of index.categories)for(const page of category.pages){
  const shard=JSON.parse(await readFile(new URL('../'+page.path,import.meta.url),'utf8'));
  assert.ok(shard.entries.length<=250);
  for(const entry of shard.entries){ids.push(entry.id);assert.equal(entry.recordPath,`equipment/${entry.id}.md`);assert.ok(entry.jsonUrl.endsWith(`/entries/${entry.id}.json`));}
 }
 assert.deepEqual(ids.sort(),source.equipment.map(r=>r.id).sort());
});
