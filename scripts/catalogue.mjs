export const BASE = 'https://eloragrid.ai/tools/cad-library';
export const REPOSITORY = 'https://github.com/elora-grid/elora-electrical-cad-library';
export const CATEGORIES = {
  switchgear: 'Switchboards & switchgear', breakers: 'Breakers & accessories',
  enclosures: 'Enclosures & hardware', busbar: 'Busbar & distribution',
  protection: 'Protection & metering', automation: 'Automation & controls',
  wiring: 'Wiring & terminals', 'power-supplies': 'Auxiliary power & UPS',
  motors: 'Motors & drives', thermal: 'Thermal management', 'power-quality': 'Power quality & drives',
  transformers: 'Transformers & earthing', generation: 'Generators & alternators',
  'generator-auxiliaries': 'Generator auxiliaries', storage: 'Battery storage & PCS',
  solar: 'Solar & inverters', communications: 'Communications',
  'cable-management': 'Cable management', 'switchroom-services': 'Switchroom services'
};
const str = {type:'string'};
const url = {type:'string',pattern:'^https://[^\\s]+$'};
const id = {type:'string',pattern:'^[a-z0-9_-]+$'};
const hash = {type:'string',pattern:'^[a-f0-9]{64}$'};
const strings = {type:'array',items:str};
const enumeration = values => ({type:'string',enum:values});
const object = (properties,required=Object.keys(properties)) => ({type:'object',properties,required,additionalProperties:false});
const nullable=schema=>({anyOf:[schema,{type:'null'}]});
const artifactAccess=object({policyVersion:{const:1},access:enumeration(['public','cad_account','review_required','unavailable']),reason:str});
const artifact=object({id,name:str,format:str,purpose:str,containedFormats:strings,downloadFormat:str,provenance:enumeration(['manufacturer_source','prepared_conversion']),sourceUrl:url,sourceSha256:nullable(hash),artifactSha256:nullable(hash),bytes:nullable({type:'integer',minimum:1}),archiveMember:nullable(str),revision:nullable(str),access:artifactAccess,downloadUrl:nullable({type:'string',pattern:'^/tools/cad-library/download/[a-z0-9_-]+/[a-z0-9_-]+$'}),customerPrice:{const:0}});
const reviewIdentity={recordId:id,fileId:id,sourceSha256:hash,artifactSha256:hash,format:str,checkedAt:str};
const sourceContext=object(Object.fromEntries(['sourceRevision','sourcePurpose','sourceGeometryKind','sourceUnits','manufacturer','partNumber','configuration','sourceUrl','revision','documentNumber','purpose','geometryKind','units'].map(key=>[key,nullable(str)])));
const file = object({
  id,name:str,format:str,purpose:str,url,availability:enumeration(['direct','account','request']),
  filenameBasis:enumeration(['source-url','response-header','document-reference','manufacturer-metadata']),
  previewGroup:id,
  readerReview:object({...reviewIdentity,name:str,version:str,reportSha256:hash,outcome:{const:'passed'},scope:{const:'syntax_geometry_independent_roundtrip'}}),
  accessReview:object({...reviewIdentity,evidenceUrls:{type:'array',items:url},note:str,sourceContext,availability:enumeration(['public_equivalent','exclusive_conversion'])}),
  geometryKind:enumeration(['2d_drawing','brep_solid','surface_model','mesh','application_native','reference_document']),
  units:enumeration(['mm','m','in','ft']),
  officialAlternative:object({sourceFileId:id,sourceSha256:hash,checkedAt:str,evidenceUrls:{type:'array',items:url}}),
  preparation:object({recipeHash:hash,readerValidation:object({name:str,version:str,checkedAt:str,reportSha256:hash,artifactSha256:hash,recipeHash:hash,evidenceUrl:url,outcome:{const:'passed'}})}),
  conversion:object({fromFileId:id,fromFormat:str,tool:str,convertedAt:str}),
  sourceArchive:object({url,sha256:hash,member:str,publisherMemberChecksumVerified:{type:'boolean'}}),
  publisherChecksum:object({algorithm:{const:'md5'},value:{type:'string',pattern:'^[a-f0-9]{32}$'}}),
  documentNumber:str,latestRevisionUrl:url,sourceCheckedAt:str,reportedBytes:{type:'integer',minimum:1},
  previewPages:{type:'array',items:{type:'integer',minimum:1}},
  bytes:{type:'integer',minimum:1},sha256:hash,retrievedAt:str,revision:str,archiveContents:strings,archiveMember:str,
  validation:enumeration(['signature-checked','archive-inspected','link-verified']),hosted:{type:'boolean'},downloadUrl:url,
  redistribution:enumeration(['unknown','permitted','restricted']),
  license:object({id:str,url,attribution:str,notice:str,sourceCommit:str},['id','url','attribution','notice']),
  rightsReview:object({checkedAt:str,sources:{type:'array',items:url},note:str}),
  hostingBasis:object({policy:enumeration(['explicit-license','no-explicit-prohibition']),checkedAt:str,evidenceUrl:url,attribution:str}),
  delivery:object({kind:enumeration(['licensed-bundle','source-bundle','original','converted']),name:str,format:str,sha256:hash,bytes:{type:'integer',minimum:1},includes:strings},['format','sha256','bytes','includes'])
},['id','name','format','purpose','url','availability','redistribution']);
const record = object({
  id,name:str,manufacturer:str,category:enumeration(Object.keys(CATEGORIES)),description:str,
  equipment:strings,keywords:strings,markets:{type:'array',items:enumeration(['US','AU','UK','Europe','Global'])},
  drawingNumber:str,applications:{type:'array',items:enumeration(['switchgear','switchrooms','substations','switchyards','microgrids'])},
  technicalFacts:{type:'array',items:object({label:str,value:str,sourceUrl:url})},
  marketNote:str,kind:enumeration(['product','family','library','configurator','drawing']),partNumber:str,
  sourceUrl:url,officialEvidenceUrl:url,sourcePublisher:str,formats:strings,
  availability:enumeration(['direct','account','configurator','request','catalogue']),accessNote:str,checkedAt:str,
  files:{type:'array',items:file},artifacts:{type:'array',items:artifact},relationships:{type:'array',items:object({targetId:id,type:enumeration(['same_equipment_file','revision_of','documented_accessory','family_member','similar_item']),evidenceUrls:{type:'array',items:url},reviewedAt:str})},standards:strings,standardNote:str,fileClasses:strings,configurationNote:str,canonicalUrl:url,
  fileChoiceGuidance:strings,requestTopic:id,
  equipmentFacts:{type:'array',items:object({label:str,value:str})},
  previewImage:{type:'string',pattern:'^/tools/cad-library/(preview|drawing-preview)/'},
  relatedReferences:{type:'array',items:object({name:str,url})},
  drawingReference:object({family:str,filenames:strings,parentId:id}),
  nativeFiles:{type:'array',items:object({filename:str,format:str,bytes:{type:'integer',minimum:1},sha256:hash,signature:str,archiveSha256:hash,sourceUrl:url})},
  plainEnglish:object({title:str,introduction:str,example:str,drawings:str,terms:{type:'array',items:object({name:str,meaning:str})},diagram:str,steps:strings,caption:str,sources:{type:'array',items:object({label:str,url})},detail:str,profileId:str,checklist:strings,questions:{type:'array',items:object({question:str,answer:str})}},['title','introduction','example','drawings','terms','diagram','steps','caption','sources'])
},['id','name','manufacturer','category','description','equipment','keywords','markets','marketNote','kind','sourceUrl','officialEvidenceUrl','sourcePublisher','formats','availability','accessNote','checkedAt','files','fileClasses','canonicalUrl']);
export const SCHEMA = {
  $schema:'https://json-schema.org/draft/2020-12/schema',
  $id:'https://raw.githubusercontent.com/elora-grid/elora-electrical-cad-library/main/schema/catalogue.schema.json',
  title:'Elora official electrical CAD catalogue',
  description:'Public metadata only. Manufacturer CAD licences are recorded per file and are separate from the catalogue licence.',
  ...object({schemaVersion:{const:3},canonical:{const:BASE},scope:str,query:{const:''},total:{type:'integer',minimum:1},page:{const:1},limit:{type:'integer',minimum:1},returned:{type:'integer',minimum:1},equipment:{type:'array',items:record}},['schemaVersion','canonical','scope','total','page','limit','returned','equipment'])
};
// Deliberately implements only the schema keywords used above. No dependencies.
export function validateSchema(value,schema,path='$') {
  if(schema.anyOf){for(const allowed of schema.anyOf){try{validateSchema(value,allowed,path);return;}catch{}}throw Error(`${path}: value does not match an allowed type`);}
  if(schema.const!==undefined && value!==schema.const)throw Error(`${path}: unexpected constant`);
  if(schema.enum && !schema.enum.includes(value))throw Error(`${path}: unexpected enum`);
  if(schema.type){
    const valid=schema.type==='null'?value===null:schema.type==='array'?Array.isArray(value):schema.type==='object'?!!value&&typeof value==='object'&&!Array.isArray(value):schema.type==='integer'?Number.isSafeInteger(value):typeof value===schema.type;
    if(!valid)throw Error(`${path}: expected ${schema.type}`);
  }
  if(schema.minimum!==undefined && value<schema.minimum)throw Error(`${path}: below minimum`);
  if(schema.pattern && !new RegExp(schema.pattern).test(value))throw Error(`${path}: invalid pattern`);
  if(schema.type==='object'){
    for(const key of schema.required||[])if(!Object.hasOwn(value,key))throw Error(`${path}: missing ${key}`);
    for(const [key,item] of Object.entries(value)){
      if(!Object.hasOwn(schema.properties,key))throw Error(`${path}: unexpected field ${key}; export stopped`);
      validateSchema(item,schema.properties[key],`${path}.${key}`);
    }
  }
  if(schema.type==='array')value.forEach((item,i)=>validateSchema(item,schema.items,`${path}[${i}]`));
}
export function hosted(file) {
  const basis=file.hostingBasis;
  return !!(file.hosted&&file.sha256&&file.bytes&&file.delivery&&basis&&basis.checkedAt&&basis.attribution&&
    ((file.redistribution==='permitted'&&file.license&&basis.policy==='explicit-license')||
    (file.redistribution==='unknown'&&file.rightsReview&&basis.policy==='no-explicit-prohibition')));
}
export function validateCatalogue(catalogue) {
  validateSchema(catalogue,SCHEMA);
  const rows=catalogue.equipment;
  if(catalogue.total!==rows.length||catalogue.returned!==rows.length||catalogue.limit!==rows.length)throw Error('Incomplete or paginated export');
  const ids=new Set();
  for(const r of rows){
    if(ids.has(r.id))throw Error('Duplicate record ID');ids.add(r.id);
    if(r.canonicalUrl!==`${BASE}/equipment/${r.id}`)throw Error('Unexpected canonical URL');
    if(r.previewImage){
      const preview=new URL(r.previewImage,'https://eloragrid.ai');
      const route=r.previewImage.includes('/drawing-preview/')?'drawing-preview':'preview';
      if(preview.origin!=='https://eloragrid.ai'||![r.id,r.drawingReference?.parentId].filter(Boolean).some(id=>preview.pathname.startsWith(`/tools/cad-library/${route}/${id}/`)))throw Error('Unexpected preview image URL');
      if(preview.pathname.includes('/preview/')&&preview.searchParams.get('view')!=='thumb')throw Error('Model binary cannot be used as a preview image');
    }
    for(const reference of r.relatedReferences||[])if(!/^https:\/\/eloragrid\.ai\/objects\/[a-z0-9_-]+$/.test(reference.url))throw Error('Unexpected GA reference URL');
    const files=new Set(),artifacts=r.artifacts?new Map(r.artifacts.map(a=>[a.id,a])):null;
    if(artifacts&&(artifacts.size!==r.artifacts.length||artifacts.size!==r.files.length))throw Error('Incomplete or duplicate artifact manifest');
    for(const f of r.files){
      const artifact=artifacts?.get(f.id);
      if(artifacts&&(!artifact||artifact.sourceSha256!==(f.sha256??null)||artifact.artifactSha256!==(f.delivery?.sha256??null)||artifact.bytes!==(f.delivery?.bytes??f.bytes??null)))throw Error('Artifact identity does not match its source and delivery');
      if(files.has(f.id))throw Error('Duplicate file ID');files.add(f.id);
      if(f.downloadUrl){
        if(!hosted(f)||(artifact&&artifact.access.access!=='public')||f.downloadUrl!==`${BASE}/download/${r.id}/${f.id}`)throw Error('Invalid hosted download or rights state');
      }else if(hosted(f)&&(!artifact||artifact.access.access==='public'))throw Error('Hosted public file missing stable download URL');
      if(f.redistribution==='restricted' && (f.hosted||f.downloadUrl))throw Error('Restricted file cannot be hosted');
    }
  }
  for(const r of rows)if(r.drawingReference&&!ids.has(r.drawingReference.parentId))throw Error('Missing drawing parent');
  // Reject credentials, user filesystem paths, private cloud buckets and contact records.
  for(const part of [{...catalogue,equipment:[]},...rows]){
  const text=JSON.stringify(part);
  if(/\/Users\/|\/private\/tmp\/|service_role|sb_secret_|eyJ[a-zA-Z0-9_-]{24,}|[?&](token|signature|X-Amz-Signature)=|\/storage\/v1\//i.test(text))throw Error('Private or ephemeral data in public export');
  }
  return catalogue;
}
export function snapshotCounts(records){return {
  entries:records.length,manufacturers:new Set(records.map(r=>r.manufacturer)).size,
  categories:new Set(records.map(r=>r.category)).size,listedFiles:records.reduce((n,r)=>n+r.files.length,0),
  hostedFileEntries:records.flatMap(r=>r.files).filter(f=>f.downloadUrl).length,
  distinctHostedOriginals:new Set(records.flatMap(r=>r.files).filter(f=>f.downloadUrl).map(f=>f.sha256)).size,
  previewableEntries:records.filter(r=>r.previewImage).length,
  drawingEntries:records.filter(r=>r.drawingReference).length,
  publicArtifactAccessEntries:records.reduce((n,r)=>n+(r.artifacts||[]).filter(a=>a.access.access==='public').length,0),
  accountRequiredArtifactEntries:records.reduce((n,r)=>n+(r.artifacts||[]).filter(a=>a.access.access==='cad_account').length,0),
  reviewRequiredArtifactEntries:records.reduce((n,r)=>n+(r.artifacts||[]).filter(a=>a.access.access==='review_required').length,0),
  unavailableArtifactEntries:records.reduce((n,r)=>n+(r.artifacts||[]).filter(a=>a.access.access==='unavailable').length,0)
};}
export function sourceAuditSummary(audit,counts){
  // This older audit covers source-register records, not expanded per-drawing entries.
  const records=audit.counts?.records,hostedFiles=audit.counts?.hostedFiles;
  if(typeof audit.auditedAt!=='string'||!Number.isFinite(Date.parse(audit.auditedAt))||!Number.isSafeInteger(records)||records<1||records>counts.entries||!Number.isSafeInteger(hostedFiles)||hostedFiles<0||hostedFiles>counts.hostedFileEntries)throw Error('Invalid source-register audit aggregate');
  return {scope:'Original source register; excludes later per-drawing and curated additions',auditedAt:audit.auditedAt,records,hostedFileEntries:hostedFiles};
}
export const clean = value => String(value??'').replace(/\s+/g,' ').trim();
export const md = value => clean(value).replace(/[\\`*_{}\[\]<>|]/g,'\\$&');
export function csv(rows){return rows.map(row=>row.map(value=>{let s=clean(value);if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n')+'\r\n';}
export function entryMarkdown(r){return [
  `# ${md(r.manufacturer)} — ${md(r.name)}`,'',md(r.description),'',
  `[Equipment page and downloads](${r.canonicalUrl}) · [Live Markdown](${BASE}/entries/${r.id}.md) · [Live JSON](${BASE}/entries/${r.id}.json) · [Official manufacturer source](${r.sourceUrl})`,'',
  `- Category: ${CATEGORIES[r.category]}`,`- Entry type: ${r.kind}`,`- Part number: ${md(r.partNumber||'Select exact configuration')}`,
  ...(r.drawingNumber?[`- Drawing/document number: ${md(r.drawingNumber)}`]:[]),
  ...(r.applications?.length?[`- Installation applications: ${r.applications.map(md).join(', ')}`]:[]),
  `- Formats: ${r.formats.join(', ')||'Confirm with manufacturer'}`,`- Discovery markets: ${r.markets.join(', ')}`,`- Access: ${r.availability}`,`- Checked: ${r.checkedAt}`,'',
  md(r.accessNote),md(r.marketNote),md(r.configurationNote||''),md(r.standardNote||''),'',
  ...(r.equipmentFacts?.length?['## Equipment and file summary','',...r.equipmentFacts.map(f=>`- ${md(f.label)}: ${md(f.value)}`),'']:[]),
  ...(r.technicalFacts?.length?['## Source-linked technical facts','',...r.technicalFacts.map(f=>`- ${md(f.label)}: ${md(f.value)} ([source](${f.sourceUrl}))`),'']:[]),
  ...(r.plainEnglish?[
    `## ${md(r.plainEnglish.title)}`,'',md(r.plainEnglish.introduction),'',md(r.plainEnglish.example),'',md(r.plainEnglish.drawings),'',
    ...r.plainEnglish.terms.map(t=>`- **${md(t.name)}**: ${md(t.meaning)}`),'',
    ...(r.plainEnglish.checklist||[]).map(t=>`- ${md(t)}`),'',
    ...(r.plainEnglish.questions||[]).flatMap(q=>[`### ${md(q.question)}`,'',md(q.answer),'']),
    ...r.plainEnglish.sources.map(s=>`- [${md(s.label)}](${s.url})`),''
  ]:[]),
  ...(r.fileChoiceGuidance?.length?['## Choosing a file','',...r.fileChoiceGuidance.map(md),'']:[]),
  ...(r.drawingReference?['## Drawing family','',`- Family: ${md(r.drawingReference.family)}`,`- [Parent equipment collection](${BASE}/equipment/${r.drawingReference.parentId})`,...r.drawingReference.filenames.map(n=>`- Original filename: ${md(n)}`),'']:[]),
  ...(r.previewImage?['## Preview','',`![${md(r.manufacturer)} ${md(r.name)}: drawing or model preview](https://eloragrid.ai${r.previewImage})`,'',`[View the preview and available controls on Elora](${r.canonicalUrl}). Illustrations and simplified models are for orientation; use the original CAD for dimensions.`,'']:[]),
  '## Equipment references and drawing guides','',
  ...(r.relatedReferences||[]).map(reference=>`- [${md(reference.name)}](${reference.url})`),
  `- [Electrical drawing guides](https://eloragrid.ai/tools/electrical-library/guides)`,'',
  'Related GA references provide equipment context; a related category does not establish an exact product match.','',
  ...(r.nativeFiles?.length?['## Identified native files','',...r.nativeFiles.flatMap(f=>[
    `### ${md(f.filename)}`,'',`- Format: ${md(f.format)}`,`- Original bytes: ${f.bytes}`,`- Original SHA-256: ${f.sha256}`,`- Containing archive SHA-256: ${f.archiveSha256}`,`- [Original publisher source](${f.sourceUrl})`,''
  ])]:[]),
  ...(r.artifacts?['## Current artifact access','',`[Check current API access and prepared downloads](https://eloragrid.ai/api/cad/v1/items/${r.id})`,'',...r.artifacts.map(a=>`- ${md(a.name)}: ${a.access.access} (${md(a.access.reason)}); delivered format ${md(a.downloadFormat)}, contained formats ${a.containedFormats.map(md).join(', ')||'not recorded'}.`),'Public originals and reviewed equivalents need no account. Exclusive conversions require a free verified CAD account and separately scoped consent. Review-required files are not ready downloads.','']:[]),
  '## Files','',...(r.files.length?r.files.flatMap(f=>[
    `### ${md(f.name)}`,'',`- Format: ${f.format}`,`- Purpose: ${md(f.purpose)}`,`- [Official source](${f.url})`,
    ...(f.archiveMember?[`- Archive member: ${md(f.archiveMember)}`]:[]),
    ...(f.downloadUrl?[`- [Download from Elora](${f.downloadUrl})`]:['- Site download: unavailable; use the official source or Request CAD on the equipment page.']),
    `- Redistribution: ${f.redistribution}`,`- Original SHA-256: ${f.sha256||'Not acquired'}`,`- Original bytes: ${f.bytes||'Not acquired'}`,
    `- Revision: ${md(f.revision||'Not recorded')}`,`- Retrieved: ${f.retrievedAt||'Not acquired'}`,
    ...(f.license?[`- Manufacturer licence: [${md(f.license.id)}](${f.license.url})`,`- Attribution: ${md(f.license.attribution)}`,`- Licence notice: ${md(f.license.notice)}`]:[]),
    ...(f.hostingBasis?[`- Hosting basis: ${f.hostingBasis.policy}; reviewed ${f.hostingBasis.checkedAt}`,`- Hosting attribution: ${md(f.hostingBasis.attribution)}`,`- [Hosting evidence](${f.hostingBasis.evidenceUrl})`]:[]),
    ...(f.rightsReview?[`- Rights review: ${md(f.rightsReview.note)}`,...f.rightsReview.sources.map(u=>`- [Rights evidence](${u})`)]:[]),
    ...(f.delivery?[`- Delivery: ${f.delivery.kind||'licensed-bundle'}; ${f.delivery.format}; ${f.delivery.bytes} bytes`,`- Delivery SHA-256: ${f.delivery.sha256}`]:[]),'',
    ...(f.archiveContents?.length?['<details>','<summary>Archive members</summary>','',...f.archiveContents.map(n=>`- ${md(n)}`),'','</details>','']:[])
  ]):['No individual file listed. Browse the official source or Request CAD on the equipment page.','']),
  'Global tags describe discovery, not certification. Confirm exact configuration, revision and dimensional units. Unknown redistribution rights remain unknown. The catalogue licence does not license manufacturer CAD.',''
].filter((v,i,a)=>v!==''||a[i-1]!=='').join('\n');}
