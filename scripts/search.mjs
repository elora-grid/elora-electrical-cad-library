import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2),filters={};
for(let i=0;i<args.length;i++){
  const key=args[i];if(key==='--hosted'){filters.hosted=true;continue;}
  if(!['--query','--category','--manufacturer','--format','--market'].includes(key)||!args[i+1]||args[i+1].startsWith('--'))throw Error('Usage: npm run search -- [--query text] [--category id] [--manufacturer name] [--format STEP] [--market US|AU|UK|Europe] [--hosted]');
  filters[key.slice(2)]=args[++i];
}
const catalogue=JSON.parse(await readFile(fileURLToPath(new URL('../data/catalogue.json',import.meta.url)),'utf8'));
const terms=(filters.query||'').toLowerCase().split(/\s+/).filter(Boolean);
const rows=catalogue.equipment.filter(r=>{
  const content=[r.name,r.manufacturer,r.partNumber||'',r.description,...r.equipment,...r.keywords,...r.files.flatMap(f=>[f.name,...(f.archiveContents||[])])].join(' ').toLowerCase();
  return terms.every(t=>content.includes(t))&&(!filters.category||r.category===filters.category)&&(!filters.manufacturer||r.manufacturer.toLowerCase().includes(filters.manufacturer.toLowerCase()))&&(!filters.format||r.formats.some(f=>f.toLowerCase()===filters.format.toLowerCase()))&&(!filters.market||r.markets.includes(filters.market)||r.markets.includes('Global'))&&(!filters.hosted||r.files.some(f=>f.downloadUrl));
});
console.log(JSON.stringify({total:rows.length,equipment:rows.map(r=>({id:r.id,name:r.name,manufacturer:r.manufacturer,kind:r.kind,markets:r.markets,canonicalUrl:r.canonicalUrl,files:r.files.filter(f=>!filters.hosted||f.downloadUrl).map(f=>({name:f.name,format:f.format,sourceUrl:f.url,downloadUrl:f.downloadUrl,redistribution:f.redistribution,license:f.license,sha256:f.sha256,delivery:f.delivery}))}))},null,2));
