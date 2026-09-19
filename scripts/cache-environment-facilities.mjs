import fs from 'node:fs';
import path from 'node:path';
import { matureProjects } from '../src/mature-data.js';

const root=path.resolve(import.meta.dirname,'..');
const output=path.join(root,'public/data/environment-facilities.geojson');
const endpoints=['https://maps.mail.ru/osm/tools/overpass/api/interpreter','https://overpass.private.coffee/api/interpreter','https://lz4.overpass-api.de/api/interpreter','https://overpass-api.de/api/interpreter'];
const definitions={
  fuel:['加油站','重大環境設施',500],substation:['變電所','重大環境設施',500],powerTower:['高壓電塔','重大環境設施',500],cemetery:['公墓／墓園','重大環境設施',500],funeral:['殯儀／殯葬設施','重大環境設施',500],crematorium:['火葬場','重大環境設施',1000],waste:['廢棄物／轉運設施','重大環境設施',1000],wastewater:['污水處理設施','重大環境設施',1000],industrial:['工業區／工廠','重大環境設施',1000],storage:['油氣／大型儲槽','重大環境設施',500],slaughterhouse:['屠宰／化工／瀝青設施','重大環境設施',1000],brownfield:['棕地／疑似廢棄工業地','重大環境設施',1000],
  highway:['快速道路／高架匝道','生活影響設施',300],rail:['鐵路／調車設施','生活影響設施',300],transitDepot:['軌道／公車機廠','生活影響設施',500],airport:['機場影響範圍','生活影響設施',3000],emergency:['醫院／急診','生活影響設施',500],fireStation:['消防隊','生活影響設施',300],worship:['宗教活動設施','生活影響設施',300],nightlife:['夜間娛樂場所','生活影響設施',300],market:['市場／夜市','生活影響設施',300],school:['學校／幼兒園','生活影響設施',300],communications:['通訊塔／基地台','生活影響設施',300],prison:['監獄／看守所','生活影響設施',500],military:['軍事設施','生活影響設施',500],
};
const classify=(tags={})=>{
  if(tags.amenity==='fuel')return 'fuel';if(tags.power==='substation')return 'substation';if(tags.power==='tower')return 'powerTower';if(tags.landuse==='cemetery'||tags.amenity==='grave_yard')return 'cemetery';if(tags.amenity==='crematorium')return 'crematorium';if(tags.amenity==='funeral_hall'||tags.shop==='funeral_directors')return 'funeral';if(tags.man_made==='wastewater_plant')return 'wastewater';if(tags.amenity==='waste_transfer_station'||tags.landuse==='landfill')return 'waste';if(tags.landuse==='brownfield')return 'brownfield';if(tags.industrial&&/slaughterhouse|chemical|asphalt|concrete/.test(tags.industrial))return 'slaughterhouse';if(tags.man_made==='storage_tank')return 'storage';if(tags.landuse==='industrial')return 'industrial';if(tags.railway==='yard'||tags.railway==='depot'||tags.landuse==='railway'||tags.amenity==='bus_station')return 'transitDepot';if(tags.railway==='rail')return 'rail';if(tags.highway&&/^(motorway|motorway_link|trunk|trunk_link)$/.test(tags.highway))return 'highway';if(tags.aeroway==='aerodrome')return 'airport';if(tags.amenity==='hospital')return 'emergency';if(tags.amenity==='fire_station')return 'fireStation';if(tags.amenity==='place_of_worship')return 'worship';if(tags.amenity&&/^(bar|pub|nightclub|karaoke_box)$/.test(tags.amenity))return 'nightlife';if(tags.amenity==='marketplace')return 'market';if(tags.amenity&&/^(school|kindergarten|college|university)$/.test(tags.amenity))return 'school';if((tags.man_made==='mast'||tags.man_made==='tower')&&/communication|mobile_phone/.test(`${tags['tower:type']||''} ${tags.communication||''}`))return 'communications';if(tags.amenity==='prison')return 'prison';if(tags.landuse==='military'||tags.military)return 'military';return null;
};
const radians=value=>value*Math.PI/180;
const distance=(a,b)=>{const dLat=radians(b.lat-a.lat),dLng=radians(b.lng-a.lng),value=Math.sin(dLat/2)**2+Math.cos(radians(a.lat))*Math.cos(radians(b.lat))*Math.sin(dLng/2)**2;return 12742000*Math.asin(Math.sqrt(value));};
async function request(query){let lastError;for(const endpoint of endpoints){try{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json','User-Agent':'presale-base/1.0'},body:'data='+encodeURIComponent(query),signal:AbortSignal.timeout(60000)});if(!response.ok)throw new Error(`${new URL(endpoint).host} ${response.status}`);return await response.json();}catch(error){lastError=error;}}throw lastError;}

const centers=matureProjects.filter(project=>project.locationStatus!=='unlocated'&&Number.isFinite(project.lat)&&Number.isFinite(project.lng));
const padding=.035,south=Math.min(...centers.map(item=>item.lat))-padding,west=Math.min(...centers.map(item=>item.lng))-padding,north=Math.max(...centers.map(item=>item.lat))+padding,east=Math.max(...centers.map(item=>item.lng))+padding,bbox=`(${south},${west},${north},${east})`;
const queries=[
  `[out:json][timeout:55];(nwr[amenity~"fuel|crematorium|funeral_hall|waste_transfer_station"]${bbox};nwr[shop=funeral_directors]${bbox};nwr[power~"substation|tower"]${bbox};nwr[landuse~"cemetery|landfill"]${bbox};nwr[man_made~"wastewater_plant|storage_tank"]${bbox};);out center tags;`,
  `[out:json][timeout:55];(nwr[landuse~"industrial|brownfield"]${bbox};nwr[industrial~"slaughterhouse|chemical|asphalt|concrete"]${bbox};);out center tags;`,
  `[out:json][timeout:55];(nwr[amenity=bus_station]${bbox};nwr[landuse=railway]${bbox};nwr[railway~"yard|depot|rail"]${bbox};nwr[highway~"motorway|motorway_link|trunk|trunk_link"]${bbox};nwr[aeroway=aerodrome]${bbox};);out center tags;`,
  `[out:json][timeout:55];(nwr[amenity~"fire_station|hospital|school|kindergarten|college|university|place_of_worship|bar|pub|nightclub|karaoke_box|marketplace|prison"]${bbox};nwr[man_made~"mast|tower"]${bbox};nwr[landuse=military]${bbox};nwr[military]${bbox};);out center tags;`,
];
const elements=[];let failures=0;
for(let index=0;index<queries.length;index++){try{const data=await request(queries[index]);elements.push(...(data.elements||[]));console.log(`環境設施 ${index+1}/${queries.length}`);}catch(error){failures++;console.warn(`環境設施第 ${index+1} 批失敗：${error.message}`);}}
if(!elements.length)throw new Error('沒有任何環境設施查詢成功');
const seen=new Set(),features=[];
for(const element of elements){const lat=element.lat??element.center?.lat,lng=element.lon??element.center?.lon,kind=classify(element.tags),definition=definitions[kind];if(!Number.isFinite(lat)||!Number.isFinite(lng)||!definition||!centers.some(project=>distance({lat,lng},project)<=definition[2]))continue;const key=`${element.type}/${element.id}`;if(seen.has(key))continue;seen.add(key);features.push({type:'Feature',properties:{label:definition[0],group:definition[1],radius:definition[2],name:element.tags?.name||'OSM 未命名設施'},geometry:{type:'Point',coordinates:[lng,lat]}});}
const collection={type:'FeatureCollection',metadata:{source:'OpenStreetMap via Overpass',generatedAt:new Date().toISOString(),failedBatches:failures},features};
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,`${JSON.stringify(collection)}\n`);
console.log(`已快取 ${features.length} 筆（重大 ${features.filter(feature=>feature.properties.group==='重大環境設施').length}）`);
