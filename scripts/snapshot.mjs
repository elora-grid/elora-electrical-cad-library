import {readFile,stat} from 'node:fs/promises';
import {createReadStream,createWriteStream} from 'node:fs';
import {createGunzip,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {get} from 'node:https';
import {Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {catalogueTextLines,readCatalogueRows} from './catalogue-stream.mjs';
export const MAX_DECODED_BYTES=2*1024**3;
export const MAX_PACKED_BYTES=100*1024**2;
export const sha256=body=>createHash('sha256').update(body).digest('hex');
export function decodeSnapshot(bytes,maxDecodedBytes=MAX_DECODED_BYTES){return gunzipSync(bytes,{maxOutputLength:maxDecodedBytes});}
export async function inspectSnapshot(file){
 const source=createReadStream(file),unpacked=createGunzip();source.on('error',error=>unpacked.destroy(error));source.pipe(unpacked);
 const hash=createHash('sha256');let decodedBytes=0,metadata;const equipment=[];
 async function* checked(){try{for await(const chunk of unpacked){decodedBytes+=chunk.length;if(decodedBytes>MAX_DECODED_BYTES)throw Error('Decoded catalogue exceeds export bound');hash.update(chunk);yield chunk;}}finally{source.destroy();unpacked.destroy();}}
 for await(const row of readCatalogueRows(catalogueTextLines(checked()))){if(row.metadata)metadata=row.metadata;else equipment.push(row.record);}
 return {catalogue:{...metadata,equipment},decodedBytes,decodedSha256:hash.digest('hex')};
}
export async function readSnapshot(root){return (await inspectSnapshot(new URL('data/catalogue.json.gz',root))).catalogue;}
export async function downloadSnapshot(file){
 const response=await new Promise((resolve,reject)=>{const req=get('https://eloragrid.ai/cad-library/catalogue.json.gz',{headers:{'Accept-Encoding':'gzip','User-Agent':'Public-CAD-Catalogue-Sync/2.1'}},resolve);req.on('error',reject);req.setTimeout(120000,()=>req.destroy(Error('Public snapshot download timed out')));});
 if(response.statusCode!==200){response.destroy();throw Error('Public snapshot: HTTP '+response.statusCode);}
 let size=0;await pipeline(response,new Transform({transform(chunk,encoding,done){size+=chunk.length;done(size>=MAX_PACKED_BYTES?Error('Compressed snapshot exceeds GitHub file limit'):null,chunk);}}),createWriteStream(file));
 if((await stat(file)).size!==size)throw Error('Incomplete compressed snapshot');
 return size;
}
