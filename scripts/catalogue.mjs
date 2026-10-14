export const BASE = 'https://eloragrid.ai/tools/cad-library';
export const REPOSITORY = 'https://github.com/elora-grid/elora-electrical-cad-library';
export const CATEGORIES = {
  switchgear: 'Switchboards & switchgear', breakers: 'Breakers & accessories',
  enclosures: 'Enclosures & hardware', busbar: 'Busbar & distribution',
  protection: 'Protection & metering', automation: 'Automation & controls',
  wiring: 'Wiring & terminals', 'power-supplies': 'Auxiliary power & UPS',
  thermal: 'Thermal management', 'power-quality': 'Power quality & drives',
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
const file = object({
  id,name:str,format:str,purpose:str,url,availability:enumeration(['direct','account','request']),
  bytes:{type:'integer',minimum:1},sha256:hash,retrievedAt:str,revision:str,archiveContents:strings,
  validation:enumeration(['signature-checked','archive-inspected','link-verified']),hosted:{type:'boolean'},downloadUrl:url,
  redistribution:enumeration(['unknown','permitted','restricted']),
  license:object({id:str,url,attribution:str,notice:str,sourceCommit:str},['id','url','attribution','notice']),
  rightsReview:object({checkedAt:str,sources:{type:'array',items:url},note:str}),
  hostingBasis:object({policy:enumeration(['explicit-license','no-explicit-prohibition']),checkedAt:str,evidenceUrl:url,attribution:str}),
  delivery:object({kind:enumeration(['licensed-bundle','source-bundle','original']),name:str,format:str,sha256:hash,bytes:{type:'integer',minimum:1},includes:strings},['format','sha256','bytes','includes'])
},['id','name','format','purpose','url','availability','redistribution']);
const record = object({
  id,name:str,manufacturer:str,category:enumeration(Object.keys(CATEGORIES)),description:str,
  equipment:strings,keywords:strings,markets:{type:'array',items:enumeration(['US','AU','UK','Europe','Global'])},
  marketNote:str,kind:enumeration(['product','family','library','configurator']),partNumber:str,
  sourceUrl:url,officialEvidenceUrl:url,sourcePublisher:str,formats:strings,
  availability:enumeration(['direct','account','configurator','request','catalogue']),accessNote:str,checkedAt:str,
  files:{type:'array',items:file},standards:strings,standardNote:str,fileClasses:strings,configurationNote:str,canonicalUrl:url
},['id','name','manufacturer','category','description','equipment','keywords','markets','marketNote','kind','sourceUrl','officialEvidenceUrl','sourcePublisher','formats','availability','accessNote','checkedAt','files','fileClasses','canonicalUrl']);
export const SCHEMA = {
  $schema:'https://json-schema.org/draft/2020-12/schema',
  $id:'https://raw.githubusercontent.com/elora-grid/elora-electrical-cad-library/main/schema/catalogue.schema.json',
  title:'Elora official electrical CAD catalogue',
  description:'Public metadata only. Manufacturer CAD licences are recorded per file and are separate from the catalogue licence.',
  ...object({schemaVersion:{const:3},canonical:{const:BASE},scope:str,query:{const:''},total:{type:'integer',minimum:1},page:{const:1},limit:{type:'integer',minimum:1},returned:{type:'integer',minimum:1},equipment:{type:'array',items:record}})
};
// Deliberately implements only the schema keywords used above. No dependencies.
export function validateSchema(value,schema,path='$') {
  if(schema.const!==undefined && value!==schema.const)throw Error(`${path}: unexpected constant`);
  if(schema.enum && !schema.enum.includes(value))throw Error(`${path}: unexpected enum`);
  if(schema.type){
    const valid=schema.type==='array'?Array.isArray(value):schema.type==='object'?!!value&&typeof value==='object'&&!Array.isArray(value):schema.type==='integer'?Number.isSafeInteger(value):typeof value===schema.type;
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
    const files=new Set();
    for(const f of r.files){
      if(files.has(f.id))throw Error('Duplicate file ID');files.add(f.id);
      if(f.downloadUrl){
        if(!hosted(f)||f.downloadUrl!==`${BASE}/download/${r.id}/${f.id}`)throw Error('Invalid hosted download or rights state');
      }else if(hosted(f))throw Error('Hosted file missing stable download URL');
      if(f.redistribution==='restricted' && (f.hosted||f.downloadUrl))throw Error('Restricted file cannot be hosted');
    }
  }
  // Reject credentials, user filesystem paths, private cloud buckets and contact records.
  const text=JSON.stringify(catalogue);
  if(/\/Users\/|\/private\/tmp\/|service_role|sb_secret_|eyJ[a-zA-Z0-9_-]{24,}|[?&](token|signature|X-Amz-Signature)=|\/storage\/v1\//i.test(text))throw Error('Private or ephemeral data in public export');
  return catalogue;
}
export const clean = value => String(value??'').replace(/\s+/g,' ').trim();
export const md = value => clean(value).replace(/[\\`*_{}\[\]<>|]/g,'\\$&');
export function csv(rows){return rows.map(row=>row.map(value=>{let s=clean(value);if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n')+'\r\n';}
export function entryMarkdown(r){return [
  `# ${md(r.manufacturer)} — ${md(r.name)}`,'',md(r.description),'',
  `[Equipment page and downloads](${r.canonicalUrl}) · [Official manufacturer source](${r.sourceUrl})`,'',
  `- Category: ${CATEGORIES[r.category]}`,`- Entry type: ${r.kind}`,`- Part number: ${md(r.partNumber||'Select exact configuration')}`,
  `- Formats: ${r.formats.join(', ')||'Confirm with manufacturer'}`,`- Discovery markets: ${r.markets.join(', ')}`,`- Access: ${r.availability}`,`- Checked: ${r.checkedAt}`,'',
  md(r.accessNote),md(r.marketNote),md(r.configurationNote||''),md(r.standardNote||''),'',
  '## Files','',...(r.files.length?r.files.flatMap(f=>[
    `### ${md(f.name)}`,'',`- Format: ${f.format}`,`- Purpose: ${md(f.purpose)}`,`- [Official source](${f.url})`,
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
