import sharp from 'sharp';
import {writeFile,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const source=fileURLToPath(new URL('../artwork/icon-magic-k.png',import.meta.url));
const output=fileURLToPath(new URL('../public/',import.meta.url));
// Opaque square originals let each platform apply its own icon mask.
for(const size of [32,180,192,512]){
 await sharp(source).flatten({background:'#13d2dc'}).resize(size,size).png({compressionLevel:9,adaptiveFiltering:true,palette:true,colours:256,effort:10,dither:.7}).toFile(`${output}icon-magic-k-${size}.png`);
}
// Android's guaranteed safe zone is a centered circle with radius 40%.
// Inset the artwork by 10% on all sides to protect the k and its symbols.
await sharp(source).flatten({background:'#13d2dc'}).resize(410,410).extend({top:51,bottom:51,left:51,right:51,extendWith:'copy'}).png({compressionLevel:9,adaptiveFiltering:true,palette:true,colours:256,effort:10,dither:.7}).toFile(`${output}icon-magic-k-maskable-512.png`);
// Keep legacy asset URLs working for clients upgrading an existing installation.
for(const size of [192,512])await copyFile(`${output}icon-magic-k-${size}.png`,`${output}icon-${size}.png`);
const small=await sharp(source).flatten({background:'#13d2dc'}).resize(192,192).png({compressionLevel:9,palette:true,colours:256,effort:10,dither:.7}).toBuffer();
await writeFile(`${output}icon.svg`,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><image width="192" height="192" href="data:image/png;base64,${small.toString('base64')}"/></svg>\n`);
