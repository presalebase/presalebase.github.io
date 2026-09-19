import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const layers={
  'soil-liquefaction':0,
  'active-faults':1,
};
const bounds={west:121.30,south:24.80,east:121.75,north:25.25};
const width=2048;
const radius=6378137;
const mercatorX=longitude=>radius*longitude*Math.PI/180;
const mercatorY=latitude=>radius*Math.log(Math.tan(Math.PI/4+latitude*Math.PI/360));
const projected={
  west:mercatorX(bounds.west),south:mercatorY(bounds.south),
  east:mercatorX(bounds.east),north:mercatorY(bounds.north),
};
const height=Math.round(width*(projected.north-projected.south)/(projected.east-projected.west));
const outputDirectory=path.resolve('public/data/geology');

async function getToken(){
  const response=await fetch('https://dmap.ncdr.nat.gov.tw/api/tokeninfo');
  if(!response.ok)throw new Error(`NCDR token request failed: ${response.status}`);
  const envelope=await response.json();
  const data=typeof envelope==='string'?JSON.parse(envelope):envelope;
  if(!data?.token)throw new Error('NCDR response did not include a token');
  return data.token;
}

async function fetchLayer(name,layer,token){
  const endpoint=new URL('https://dwgis2.ncdr.nat.gov.tw/server/services/WMS627/SoilLiquefaction/MapServer/WMSServer');
  const params={
    REQUEST:'GetMap',SERVICE:'WMS',VERSION:'1.1.1',LAYERS:String(layer),STYLES:'',
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
await Promise.all(Object.entries(layers).map(([name,layer])=>fetchLayer(name,layer,token)));
await writeFile(path.join(outputDirectory,'metadata.json'),JSON.stringify({
  generatedAt:new Date().toISOString(),source:'NCDR / Geological Survey and Mining Management Agency WMS',bounds,width,height,layers,
},null,2));
console.log(`Saved ${Object.keys(layers).length} geology layers (${width} x ${height}) to ${outputDirectory}`);
