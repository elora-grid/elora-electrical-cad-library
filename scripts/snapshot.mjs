import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';

export const MAX_DECODED_BYTES=512*1024*1024;
export const sha256=body=>createHash('sha256').update(body).digest('hex');
export function decodeSnapshot(bytes,maxDecodedBytes=MAX_DECODED_BYTES){
  return gunzipSync(bytes,{maxOutputLength:maxDecodedBytes});
}
export async function readSnapshot(root){
  return JSON.parse(decodeSnapshot(await readFile(new URL('data/catalogue.json.gz',root))).toString('utf8'));
}
