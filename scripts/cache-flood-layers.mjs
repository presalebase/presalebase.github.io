import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const scenarios={
  '6h150':[40,2,22,12],
  '6h250':[41,3,23,13],
  '6h350':[39,4,24,14],
  '12h200':[38,5,25,15],
  '12h300':[37,6,26,16],
  '12h400':[36,7,27,17],
  '24h200':[35,8,28,18],
  '24h350':[34,9,29,19],
  '24h500':[33,10,30,20],
  '24h650':[32,11,31,21],
};

// Covers every currently mapped public project plus its surrounding area.
const bounds={west:121.46,south:24.91,east:121.62,north:25.11};
const width=2048;
const radius=6378137;
const mercatorX=longitude=>radius*longitude*Math.PI/180;
const mercatorY=latitude=>radius*Math.log(Math.tan(Math.PI/4+latitude*Math.PI/360));
const projected={
  west:mercatorX(bounds.west),
  south:mercatorY(bounds.south),
  east:mercatorX(bounds.east),
  north:mercatorY(bounds.north),
};
const height=Math.round(width*(projected.north-projected.south)/(projected.east-projected.west));
const outputDirectory=path.resolve('public/data/flood');

async function getToken(){
  const response=await fetch('https://dmap.ncdr.nat.gov.tw/api/tokeninfo');
  if(!response.ok)throw new Error(`NCDR token request failed: ${response.status}`);
  const envelope=await response.json();
  const data=typeof envelope==='string'?JSON.parse(envelope):envelope;
  if(!data?.token)throw new Error('NCDR response did not include a token');
  return data.token;
}

async function fetchScenario(name,layers,token){
  const endpoint=new URL('https://dwgis2.ncdr.nat.gov.tw/server/services/WMS627/Flooding/MapServer/WMSServer');
  const params={
    REQUEST:'GetMap',SERVICE:'WMS',VERSION:'1.1.1',LAYERS:layers.join(','),STYLES:'',
    FORMAT:'image/png',BGCOLOR:'0xFFFFFF',TRANSPARENT:'TRUE',SRS:'EPSG:3857',
    WIDTH:String(width),HEIGHT:String(height),
    BBOX:[projected.west,projected.south,projected.east,projected.north].join(','),token,
  };
  Object.entries(params).forEach(([key,value])=>endpoint.searchParams.set(key,value));
  const response=await fetch(endpoint,{headers:{Origin:'https://presale-base.github.io'}});
  if(!response.ok)throw new Error(`${name} WMS request failed: ${response.status}`);
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(response.headers.get('content-type')!=='image/png'||bytes[0]!==0x89||bytes[1]!==0x50)throw new Error(`${name} did not return a PNG`);
  await writeFile(path.join(outputDirectory,`${name}.png`),bytes);
  console.log(`${name}: ${Math.round(bytes.length/1024)} KiB`);
}

await mkdir(outputDirectory,{recursive:true});
const token=await getToken();
const entries=Object.entries(scenarios);
let nextIndex=0;
async function worker(){
  while(nextIndex<entries.length){
    const [name,layers]=entries[nextIndex++];
    await fetchScenario(name,layers,token);
  }
}
await Promise.all([worker(),worker()]);
await writeFile(path.join(outputDirectory,'metadata.json'),JSON.stringify({
  generatedAt:new Date().toISOString(),source:'NCDR / Water Resources Agency WMS',bounds,width,height,scenarios:Object.keys(scenarios),
},null,2));
console.log(`Saved ${entries.length} flood layers (${width} x ${height}) to ${outputDirectory}`);
