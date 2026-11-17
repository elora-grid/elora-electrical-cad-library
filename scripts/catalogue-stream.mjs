import {createReadStream,createWriteStream,renameSync,rmSync,statSync} from 'node:fs';
import {createGzip,createGunzip} from 'node:zlib';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {StringDecoder} from 'node:string_decoder';

// Preserve the full JSON contract while avoiding V8's single-string limit.
// One equipment object per line also permits bounded audits of the exact bytes.
export async function writeCatalogueGzip(file,metadata,records,project=value=>value){
 const temporary=file+'.tmp';let count=0,bytes=0,maxRecordBytes=0;
 async function* chunks(){
  const header=JSON.stringify(metadata).slice(0,-1)+',"equipment":[\n';bytes+=Buffer.byteLength(header);yield header;
  for(const record of records){const text=JSON.stringify(project(record));const size=Buffer.byteLength(text);maxRecordBytes=Math.max(maxRecordBytes,size);const chunk=(count?',':'')+text+'\n';count++;bytes+=Buffer.byteLength(chunk);yield chunk;}
  bytes+=3;yield ']}\n';
 }
 try{await pipeline(Readable.from(chunks(),{objectMode:false}),createGzip({level:9}),createWriteStream(temporary));renameSync(temporary,file);}
 catch(error){rmSync(temporary,{force:true});throw error;}
 return {records:count,decodedBytes:bytes,storedBytes:statSync(file).size,maxRecordBytes};
}

export async function* catalogueTextLines(input,maxRecordBytes=128*1024**2){
 const decoder=new StringDecoder('utf8');let pending='';
 for await(const chunk of input){pending+=decoder.write(chunk);let end;while((end=pending.indexOf('\n'))>=0){const line=pending.slice(0,end);if(Buffer.byteLength(line)>maxRecordBytes)throw Error('A catalogue record exceeds the audit bound.');yield line;pending=pending.slice(end+1);}if(Buffer.byteLength(pending)>maxRecordBytes)throw Error('A catalogue record exceeds the audit bound.');}
 pending+=decoder.end();if(pending)yield pending;
}

export function catalogueGzipLines(file){return catalogueTextLines(createReadStream(file).pipe(createGunzip()));}

export async function* readCatalogueRows(lines){
 let header=false,finished=false,count=0,total;
 for await(const line of lines){
  if(!line.trim())continue;
  if(finished)throw Error('Unexpected data after catalogue.');
  if(!header){const suffix=',"equipment":[';if(!line.endsWith(suffix))throw Error('Invalid streaming catalogue header.');const metadata=JSON.parse(line.slice(0,-suffix.length)+'}');total=metadata.total;header=true;yield {metadata};continue;}
  if(line===']}'){finished=true;continue;}
  const comma=line.startsWith(',');if(comma!==(count>0))throw Error('Invalid catalogue separator.');
  const record=JSON.parse(comma?line.slice(1):line);count++;yield {record};
 }
 if(!header||!finished||count!==total)throw Error('Incomplete catalogue export.');
}
