import './mobile-navigation.js';
import { matureProjects } from './mature-data.js';
import { cachedMetroRoutes } from './generated/metro-routes.js';
import { cachedMetroStations } from './generated/metro-stations.js';

const $=selector=>document.querySelector(selector);
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const isMapped=project=>project.locationStatus!=='unlocated'&&Number.isFinite(project.lat)&&Number.isFinite(project.lng);
const hasCoordinates=project=>Number.isFinite(project.lat)&&Number.isFinite(project.lng);
const hasGoogleMapsListing=project=>isMapped(project)&&(
  project.googleMapsListing===true||
  /建案官網 Google Maps 導航點|Google Maps 建案標記|Google Maps「[^」]*(?:建案|建築基地)[^」]*」標記/i.test(project.locationAccuracy||'')
);
const mapsUrl=project=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${project.lat},${project.lng}`)}`;
function sourceLinksHtml(project){
  const candidates=[project.sourceUrl&&{url:project.sourceUrl,kind:'source'},project.officialWebsiteUrl&&{url:project.officialWebsiteUrl,kind:'official'}].filter(Boolean);
  const unique=[...new Map(candidates.map(item=>[item.url,item])).values()];
  return unique.flatMap(item=>{
    try{
      const url=new URL(item.url);if(!/^https?:$/.test(url.protocol))return [];
      const government=/(?:^|\.)(?:gov\.tw|gov\.taipei|taipei|ntpc\.gov\.tw)$/.test(url.hostname)||/data\.taipei$/.test(url.hostname);
      const marketplace=/591\.com\.tw$/.test(url.hostname);
      const label=item.kind==='official'?'建案／建商官網':!government&&!marketplace&&/官網/.test(project.source||'')?'建案／建商官網':'資料來源';
      return [`<a class="evidence-link" href="${escapeHtml(url.href)}" target="_blank" rel="noopener">${label}</a>`];
    }catch{return [];}
  }).join('');
}
const ratingRank={NA:-1,NR:0,C:1,B:2,A:3,S:4};
const ratingLabel=rating=>rating==='NR'?'未評等':rating==='NA'?'不適用':rating+'級';
const metroColors={BR:'#c48c31',R:'#e3002c',G:'#008659',O:'#f8b61c',BL:'#0070bd',Y:'#ffdb00',A:'#8246af',K:'#7bbf43',LB:'#78c7d2',V:'#78c7d2',LG:'#9ac43c'};
const projects=matureProjects;
const state={projects:[...projects],markers:new Map()};
const stationKey=value=>String(value||'').replace(/臺/g,'台').replace(/站$/,'');
const stationLines=new Map();
for(const feature of cachedMetroStations.features){
  const ref=String(feature.properties.ref||''),lines=ref.split(';').map(value=>value.match(/^[A-Z]+/)?.[0]).filter(Boolean);
  stationLines.set(stationKey(feature.properties.name),[...new Set(lines)]);
}
const projectLines=project=>{
  const inferred=stationLines.get(stationKey(project.station))||[],explicit=project.lines||[];
  return [...new Set([...explicit.filter(line=>line!=='LRT'),...inferred])];
};
const transitLineLabels={R:'淡水信義線',G:'松山新店線',O:'中和新蘆線',BL:'板南線',BR:'文湖線',Y:'環狀線',A:'機場捷運',V:'淡海輕軌',K:'安坑輕軌',LB:'三鶯線',LG:'汐東線'};
const stationsForLine=line=>[...new Set(projects.filter(project=>project.station&&project.station!=='待定位'&&(line==='all'||projectLines(project).includes(line))).map(project=>project.station))].sort((a,b)=>a.localeCompare(b,'zh-Hant'));
const floodScenarios={
  '6h150':{label:'6 小時降雨 150 mm',layers:[40,2,22,12]},
  '6h250':{label:'6 小時降雨 250 mm',layers:[41,3,23,13]},
  '6h350':{label:'6 小時降雨 350 mm',layers:[39,4,24,14]},
  '12h200':{label:'12 小時降雨 200 mm',layers:[38,5,25,15]},
  '12h300':{label:'12 小時降雨 300 mm',layers:[37,6,26,16]},
  '12h400':{label:'12 小時降雨 400 mm',layers:[36,7,27,17]},
  '24h200':{label:'24 小時降雨 200 mm',layers:[35,8,28,18]},
  '24h350':{label:'24 小時降雨 350 mm',layers:[34,9,29,19]},
  '24h500':{label:'24 小時降雨 500 mm',layers:[33,10,30,20]},
  '24h650':{label:'24 小時降雨 650 mm',layers:[32,11,31,21]},
};
const floodSourceId='ncdr-flood-source';
const floodLayerId='ncdr-flood-layer';
let floodRequestId=0;
const floodBounds={west:121.46,south:24.91,east:121.62,north:25.11};
const geologyBounds={west:121.30,south:24.80,east:121.75,north:25.25};
const geologyLayers={
  liquefaction:{sourceId:'soil-liquefaction-source',layerId:'soil-liquefaction-layer',file:'soil-liquefaction.png',opacity:.38,label:'土壤液化'},
  activeFaults:{sourceId:'active-faults-source',layerId:'active-faults-layer',file:'active-faults.png',opacity:.95,label:'活動斷層'},
};

const map=new maplibregl.Map({container:'map',style:'https://tiles.openfreemap.org/styles/liberty',center:[121.49,25.025],zoom:10.2,attributionControl:false});
map.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-right');
map.addControl(new maplibregl.AttributionControl({compact:true,customAttribution:'© OpenFreeMap · © OpenStreetMap contributors'}));
{
  const attribution=document.querySelector('.maplibregl-ctrl-attrib');
  if(attribution){
    attribution.classList.add('maplibregl-compact','attribution-force-compact');
    attribution.classList.remove('attribution-open');
    attribution.removeAttribute('open');
    attribution.querySelector('.maplibregl-ctrl-attrib-button')?.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      attribution.classList.toggle('attribution-open');
    },{capture:true});
  }
}

function markerElement(project){
  const el=document.createElement('button');
  el.className=`map-project-marker marker-${project.rating.toLowerCase()}${project.locationStatus==='estimated'?' marker-estimated':''}${isMapped(project)?'':' marker-pending'}`;
  el.type='button';el.textContent=project.rating==='NR'?'?':project.rating==='NA'?'·':project.rating;el.title=`${ratingLabel(project.rating)}｜${project.locationStatus==='estimated'?(project.siteGeometry?'宗地中心定位':'範圍定位'):isMapped(project)?'已定位':'待定位'}｜${project.name}`;
  return el;
}
function popupHtml(project){
  const warning=isMapped(project)?'':'<strong class="popup-location-warning">待定位候選點：此處是捷運生活圈推估，不是基地座標</strong>';
  const mapsLink=hasGoogleMapsListing(project)?`<a href="${mapsUrl(project)}" target="_blank" rel="noopener">在 Google Maps 開啟建案 ↗</a>`:'';
  const transit=Number.isFinite(project.walk)?`${escapeHtml(project.station)}站約 ${project.walk} 分`:'捷運距離待定位';
  return `<div class="popup">${warning}<small>${escapeHtml(project.district)} · ${transit}</small><h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(project.status)}<br>${escapeHtml(project.builder)}（${escapeHtml(ratingLabel(project.rating))}）</p>${mapsLink}</div>`;
}
function addProjectMarkers(){
  projects.filter(hasCoordinates).forEach(project=>{
    const popup=new maplibregl.Popup({offset:22,maxWidth:'320px'}).setHTML(popupHtml(project));
    const marker=new maplibregl.Marker({element:markerElement(project),anchor:'bottom'}).setLngLat([project.lng,project.lat]).setPopup(popup).addTo(map);
    state.markers.set(String(project.id),marker);
  });
}
function projectAreaData(items=projects){
  return {
    type:'FeatureCollection',
    features:items.filter(project=>project.siteGeometry).map(project=>({
      type:'Feature',
      properties:{id:String(project.id),name:project.name,rating:project.rating},
      geometry:project.siteGeometry,
    })),
  };
}
function addProjectAreas(){
  map.addSource('project-areas',{type:'geojson',data:projectAreaData()});
  map.addLayer({
    id:'project-areas-fill',type:'fill',source:'project-areas',
    paint:{
      'fill-color':['match',['get','rating'],'S','#14231d','A','#3f6f91','B','#628477','C','#89918e','#9ba5a1'],
      'fill-opacity':.2,
    },
  });
  map.addLayer({
    id:'project-areas-outline',type:'line',source:'project-areas',
    paint:{'line-color':'#415b53','line-width':1.5,'line-opacity':.72},
  });
  map.on('click','project-areas-fill',event=>{
    const id=event.features?.[0]?.properties?.id;
    const project=projects.find(item=>String(item.id)===id);
    if(project)state.markers.get(id)?.togglePopup();
  });
  map.on('mouseenter','project-areas-fill',()=>map.getCanvas().style.cursor='pointer');
  map.on('mouseleave','project-areas-fill',()=>map.getCanvas().style.cursor='');
}
function routeColor(tags={}){
  const context=`${tags.name||''} ${tags.network||''}`;
  if(/機場|AIRPORT|TAOYUAN/i.test(context))return metroColors.A;
  return tags.colour||metroColors[String(tags.ref||'').toUpperCase()]||'#67756f';
}
function showMetroLines(collection){
  const existing=map.getSource('metro-routes');
  if(existing){existing.setData(collection);return;}
  map.addSource('metro-routes',{type:'geojson',data:collection});
  map.addLayer({id:'metro-casing',type:'line',source:'metro-routes',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#fff','line-opacity':.9,'line-width':['interpolate',['linear'],['zoom'],9,4,14,7]}});
  map.addLayer({id:'metro-routes',type:'line',source:'metro-routes',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':['get','color'],'line-opacity':.92,'line-width':['interpolate',['linear'],['zoom'],9,2,14,4]}});
  map.on('mouseenter','metro-routes',()=>map.getCanvas().style.cursor='pointer');
  map.on('mouseleave','metro-routes',()=>map.getCanvas().style.cursor='');
  map.on('click','metro-routes',event=>new maplibregl.Popup().setLngLat(event.lngLat).setHTML(`<b>${escapeHtml(event.features?.[0]?.properties?.name||'捷運路線')}</b>`).addTo(map));
}
function showMetroStations(collection=cachedMetroStations){
  if(map.getSource('metro-stations')){map.getSource('metro-stations').setData(collection);return;}
  map.addSource('metro-stations',{type:'geojson',data:collection});
  map.addLayer({id:'metro-station-dots',type:'circle',source:'metro-stations',paint:{
    'circle-radius':['interpolate',['linear'],['zoom'],8,2.2,11,3.2,14,5],
    'circle-color':'#fff','circle-stroke-color':['get','color'],
    'circle-stroke-width':['interpolate',['linear'],['zoom'],8,1.5,14,2.5],
    'circle-opacity':.98,
  }});
  map.addLayer({id:'metro-station-labels',type:'symbol',source:'metro-stations',minzoom:11,layout:{
    'text-field':['get','name'],'text-font':['Noto Sans Regular'],
    'text-size':['interpolate',['linear'],['zoom'],11,10,14,12],
    'text-offset':[0,1.15],'text-anchor':'top','text-padding':3,
    'text-optional':true,'symbol-sort-key':['case',['==',['get','network'],'臺北捷運'],1,2],
  },paint:{'text-color':'#20302a','text-halo-color':'rgba(255,255,255,.96)','text-halo-width':1.6,'text-halo-blur':.4}});
  map.on('mouseenter','metro-station-dots',()=>map.getCanvas().style.cursor='pointer');
  map.on('mouseleave','metro-station-dots',()=>map.getCanvas().style.cursor='');
  map.on('click','metro-station-dots',event=>{
    const station=event.features?.[0]?.properties||{};
    new maplibregl.Popup({offset:9}).setLngLat(event.features[0].geometry.coordinates).setHTML(`<b>${escapeHtml(station.name)}站</b><br><small>${escapeHtml(station.ref||station.network)}</small>`).addTo(map);
  });
}
function addFloodControl(){
  const control=document.createElement('section');
  control.className='flood-control';
  control.setAttribute('aria-label','環境與災害風險圖層控制');
  control.innerHTML=`
    <div class="risk-layer-group environment-layer-group"><strong>環境設施</strong>
      <label class="layer-toggle"><input id="critical-facilities-toggle" type="checkbox"><span><i class="facility-symbol critical" aria-hidden="true"></i>重大環境設施</span></label>
      <label class="layer-toggle"><input id="impact-facilities-toggle" type="checkbox"><span><i class="facility-symbol impact" aria-hidden="true"></i>生活影響設施</span></label>
      <small id="environment-layer-status">環境設施目前關閉</small>
      <small id="hazard-status">正在載入共用快取</small><button id="refresh-hazards" type="button" hidden>重新載入環境設施</button>
    </div>
    <div class="risk-layer-group"><strong>降雨淹水模擬</strong><label class="layer-toggle"><input id="flood-toggle" type="checkbox"><span>顯示淹水圖層</span></label>
      <label>降雨情境<select id="flood-scenario"><option value="6h150">6 小時／150 mm</option><option value="6h250">6 小時／250 mm</option><option value="6h350">6 小時／350 mm</option><option value="12h200">12 小時／200 mm</option><option value="12h300">12 小時／300 mm</option><option value="12h400">12 小時／400 mm</option><option value="24h200">24 小時／200 mm</option><option value="24h350">24 小時／350 mm</option><option value="24h500" selected>24 小時／500 mm</option><option value="24h650">24 小時／650 mm</option></select></label>
      <div class="flood-depth" aria-label="模擬淹水深度圖例"><span><i class="depth-1"></i>0.5–1 m</span><span><i class="depth-2"></i>1–2 m</span><span><i class="depth-3"></i>2–3 m</span><span><i class="depth-4"></i>&gt;3 m</span></div><small id="flood-status">淹水圖層目前關閉</small>
    </div>
    <div class="risk-layer-group"><strong>地質風險</strong><label class="layer-toggle"><input id="liquefaction-toggle" type="checkbox"><span>土壤液化潛勢</span></label><div class="liquefaction-depth" aria-label="土壤液化潛勢圖例"><span><i class="liquefaction-low"></i>低</span><span><i class="liquefaction-medium"></i>中</span><span><i class="liquefaction-high"></i>高</span></div><label class="layer-toggle"><input id="active-faults-toggle" type="checkbox"><span><i class="active-fault-swatch"></i>活動斷層</span></label><small id="geology-status">地質圖層目前關閉</small></div>
    <button id="clear-risk-layers" class="clear-risk-layers" type="button">全部關閉</button>
    <div class="risk-source-links"><a href="https://dmap.ncdr.nat.gov.tw/1109/map/?group-layer=%E6%B7%B9%E6%B0%B4%E6%BD%9B%E5%8B%A2" target="_blank" rel="noopener">淹水原始圖台 ↗</a><a href="https://dmap.ncdr.nat.gov.tw/1109/map/?group-layer=%E6%96%B7%E5%B1%A4%E8%88%87%E5%9C%9F%E5%A3%A4%E6%B6%B2%E5%8C%96" target="_blank" rel="noopener">地質原始圖台 ↗</a></div>`;
  $('.map-frame').append(control);
  $('#flood-toggle').addEventListener('change',updateFloodLayer);
  $('#flood-scenario').addEventListener('change',()=>{if($('#flood-toggle').checked)updateFloodLayer();});
  $('#liquefaction-toggle').addEventListener('change',()=>updateGeologyLayer('liquefaction','#liquefaction-toggle'));
  $('#active-faults-toggle').addEventListener('change',()=>updateGeologyLayer('activeFaults','#active-faults-toggle'));
  $('#critical-facilities-toggle').addEventListener('change',updateHazardVisibility);
  $('#impact-facilities-toggle').addEventListener('change',updateHazardVisibility);
  $('#clear-risk-layers').addEventListener('click',clearRiskLayers);
}
function setupResponsiveMapPanels(){
  const panels=[
    {element:document.querySelector('.map-legend'),label:'圖例',id:'map-legend-panel'},
    {element:document.querySelector('.flood-control'),label:'環境／災害',id:'flood-control-panel'},
  ];
  panels.forEach(({element,label,id})=>{
    if(!element||element.classList.contains('map-panel'))return;
    const body=document.createElement('div');
    body.className='map-panel-body';
    body.id=id;
    while(element.firstChild)body.append(element.firstChild);
    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='map-panel-toggle';
    toggle.setAttribute('aria-controls',id);
    toggle.setAttribute('aria-expanded','false');
    toggle.innerHTML=`${label}<span aria-hidden="true">＋</span>`;
    toggle.addEventListener('click',()=>{
      const willOpen=!element.classList.contains('panel-open');
      document.querySelectorAll('.map-panel').forEach(panel=>{
        panel.classList.remove('panel-open');
        panel.querySelector('.map-panel-toggle')?.setAttribute('aria-expanded','false');
        const icon=panel.querySelector('.map-panel-toggle span');
        if(icon)icon.textContent='＋';
      });
      if(willOpen){
        element.classList.add('panel-open');
        toggle.setAttribute('aria-expanded','true');
        toggle.querySelector('span').textContent='−';
      }
    });
    element.classList.add('map-panel');
    element.append(toggle,body);
  });
}
function removeFloodLayer(){
  if(map.getLayer(floodLayerId))map.removeLayer(floodLayerId);
  if(map.getSource(floodSourceId))map.removeSource(floodSourceId);
}
function riskLayerCoordinates(bounds){
  return [[bounds.west,bounds.north],[bounds.east,bounds.north],[bounds.east,bounds.south],[bounds.west,bounds.south]];
}
function orderRiskLayers(){
  const before=map.getLayer('project-areas-fill')?'project-areas-fill':undefined;
  [floodLayerId,geologyLayers.liquefaction.layerId,geologyLayers.activeFaults.layerId].forEach(id=>{
    if(map.getLayer(id))map.moveLayer(id,before);
  });
}
function updateGeologyStatus(){
  const visible=Object.entries(geologyLayers).filter(([key])=>document.querySelector(key==='liquefaction'?'#liquefaction-toggle':'#active-faults-toggle')?.checked).map(([,definition])=>definition.label);
  $('#geology-status').textContent=visible.length?`顯示：${visible.join('、')}（本站快取）`:'地質圖層目前關閉';
}
function updateGeologyLayer(key,toggleSelector){
  const definition=geologyLayers[key];
  if(map.getLayer(definition.layerId))map.removeLayer(definition.layerId);
  if(map.getSource(definition.sourceId))map.removeSource(definition.sourceId);
  if(document.querySelector(toggleSelector).checked){
    map.addSource(definition.sourceId,{type:'image',url:`${import.meta.env.BASE_URL}data/geology/${definition.file}`,coordinates:riskLayerCoordinates(geologyBounds)});
    map.addLayer({id:definition.layerId,type:'raster',source:definition.sourceId,paint:{'raster-opacity':definition.opacity,'raster-fade-duration':0}},map.getLayer('project-areas-fill')?'project-areas-fill':undefined);
    orderRiskLayers();
  }
  updateGeologyStatus();
}
async function updateFloodLayer(){
  const enabled=$('#flood-toggle').checked;
  const status=$('#flood-status');
  const scenario=floodScenarios[$('#flood-scenario').value];
  const requestId=++floodRequestId;
  removeFloodLayer();
  if(!enabled){status.textContent='圖層目前關閉';return;}
  status.textContent='正在載入本站淹水圖層…';
  try{
    if(requestId!==floodRequestId||!$('#flood-toggle').checked)return;
    const scenarioKey=$('#flood-scenario').value;
    const imageUrl=`${import.meta.env.BASE_URL}data/flood/${scenarioKey}.png`;
    map.addSource(floodSourceId,{type:'image',url:imageUrl,coordinates:[
      [floodBounds.west,floodBounds.north],[floodBounds.east,floodBounds.north],
      [floodBounds.east,floodBounds.south],[floodBounds.west,floodBounds.south],
    ]});
    map.addLayer({id:floodLayerId,type:'raster',source:floodSourceId,paint:{'raster-opacity':.58,'raster-fade-duration':0}},map.getLayer('project-areas-fill')?'project-areas-fill':undefined);
    orderRiskLayers();
    status.textContent=`顯示：${scenario.label}（本站快取）`;
  }catch(error){
    removeFloodLayer();
    status.textContent='本站淹水圖層無法載入';
    console.error('淹水快取圖層載入失敗',error);
  }
}
async function loadMetroLines(){
  const query='[out:json][timeout:40];(rel[route="subway"](24.75,121.20,25.30,121.70);rel[route="light_rail"](24.75,121.20,25.30,121.70);rel[route="train"][network~"Taoyuan|桃園"](24.75,121.20,25.30,121.70););out geom;';
  try{
    const response=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(query)});
    if(!response.ok)throw new Error(`Overpass ${response.status}`);
    const data=await response.json(),seenWays=new Set(),features=[];
    for(const route of data.elements){
      const context=`${route.tags?.network||''} ${route.tags?.operator||''} ${route.tags?.name||''}`;
      const ref=String(route.tags?.ref||'').toUpperCase();
      // Some valid OSM relations, notably BL, omit network and operator tags.
      // Keep official metro line refs before applying the regional text filter.
      // Main Taipei lines and Airport MRT come from local government-data caches.
      // Live OSM only supplements New Taipei light rail and planned extensions.
      const knownLine=/^(K|LB|V|LG)$/.test(ref);
      const regionalRoute=/Taipei|New Taipei|Taoyuan|臺北|台北|新北|桃園|捷運|Metro/i.test(context);
      if(!knownLine||!regionalRoute)continue;
      for(const member of route.members||[]){
        if(member.type!=='way'||!member.geometry?.length||seenWays.has(member.ref))continue;
        seenWays.add(member.ref);
        features.push({type:'Feature',properties:{name:route.tags?.name||route.tags?.ref||'捷運',ref,color:routeColor(route.tags)},geometry:{type:'LineString',coordinates:member.geometry.map(point=>[point.lon,point.lat])}});
      }
    }
    showMetroLines({type:'FeatureCollection',features:[...cachedMetroRoutes.features,...features]});
  }catch(error){console.warn('捷運路線暫時無法載入；底圖仍保留 OSM 軌道資料。',error);}
}
function render(){
  const city=$('#city-filter').value,district=$('#district-filter')?.value||'all',status=$('#status-filter').value,rating=$('#rating-filter').value,maxWalk=Number($('#walk-filter').value),query=$('#search-filter').value.trim().toLowerCase(),line=$('#line-filter')?.value||'all',station=$('#station-filter')?.value||'all';
  const ratingMatches=project=>rating==='all'||(rating==='NR'||rating==='NA'?project.rating===rating:ratingRank[project.rating]>=ratingRank[rating]);
  const walkMatches=project=>maxWalk>=999||(Number.isFinite(project.walk)&&project.walk<=maxWalk);
  state.projects=projects.filter(project=>(city==='all'||project.city===city)&&(district==='all'||project.district===district)&&(status==='all'||project.status===status)&&(line==='all'||projectLines(project).includes(line))&&(station==='all'||stationKey(project.station)===stationKey(station))&&ratingMatches(project)&&walkMatches(project)&&(!query||[project.name,project.district,project.builder,project.station].join(' ').toLowerCase().includes(query)));
  $('#project-rows').innerHTML=state.projects.map(project=>{const transit=Number.isFinite(project.walk)?`${escapeHtml(project.station)} <b>${project.walk} 分</b>`:'<b>待定位</b>',locationLabel=project.locationStatus==='estimated'?'範圍定位':isMapped(project)?'已定位':'待定位',locationClass=project.locationStatus==='estimated'?'estimated':isMapped(project)?'located':'pending',evidence=`${escapeHtml(project.source)}${project.locationAccuracy?` · ${escapeHtml(project.locationAccuracy)}`:''}<div class="evidence-links">${sourceLinksHtml(project)}</div>`,mapLink=hasGoogleMapsListing(project)?`<a class="map-link" href="${mapsUrl(project)}" target="_blank" rel="noopener" title="在 Google Maps 開啟已確認的建案標記">↗</a>`:'';return `<tr data-id="${escapeHtml(project.id)}" class="${isMapped(project)?'':'unlocated-row'}"><td><strong>${escapeHtml(project.name)}</strong><small><b class="location-tag ${locationClass}">${locationLabel}</b><b class="district-tag">${escapeHtml(project.district)}</b></small></td><td><span class="walk">${transit}</span></td><td><span class="grade grade-${project.rating.toLowerCase()}" title="${escapeHtml(project.ratingBasis||'建商研究評等')}">${project.rating}</span>${escapeHtml(project.builder)}</td><td><span class="status status-${project.status.includes('審議')||project.status.includes('核定')?'early':project.status.includes('建照')?'permit':'sale'}">${escapeHtml(project.status)}</span></td><td>${escapeHtml(project.completion)}</td><td>${escapeHtml(project.type)}</td><td>${escapeHtml(project.size)}</td><td>${escapeHtml(project.price)}</td><td class="address-cell"><span>${escapeHtml(project.address)}</span>${mapLink}</td><td class="data-evidence">${evidence}</td></tr>`;}).join('');
  $('#result-count').textContent=state.projects.length;const mapResultCount=$('#map-result-count');if(mapResultCount)mapResultCount.textContent=state.projects.length;$('#empty-state').hidden=state.projects.length>0;
  const visible=new Set(state.projects.map(project=>String(project.id)));
  state.markers.forEach((marker,id)=>marker.getElement().style.display=visible.has(id)?'grid':'none');
  map.getSource('project-areas')?.setData(projectAreaData(state.projects));
  document.querySelectorAll('tr[data-id]').forEach(row=>row.addEventListener('click',event=>{
    if(event.target.closest('a'))return;const project=projects.find(item=>String(item.id)===row.dataset.id);if(!project||!hasCoordinates(project))return;
    map.flyTo({center:[project.lng,project.lat],zoom:16,essential:true});state.markers.get(String(project.id))?.togglePopup();$('#map-section').scrollIntoView({behavior:'smooth'});
  }));
}
function setupTableScrolling(){
  const scroller=document.querySelector('.table-scroll'),topScroller=document.querySelector('.table-top-scroll'),table=scroller?.querySelector('table'),header=scroller?.querySelector('thead'),spacer=topScroller?.firstElementChild;
  if(!scroller||!topScroller||!table||!header||!spacer)return;
  let syncing=false;
  const updateWidth=()=>{spacer.style.width=`${table.scrollWidth}px`;};
  topScroller.addEventListener('scroll',()=>{if(syncing)return;syncing=true;scroller.scrollLeft=topScroller.scrollLeft;syncing=false;});
  scroller.addEventListener('scroll',()=>{if(syncing)return;syncing=true;topScroller.scrollLeft=scroller.scrollLeft;syncing=false;});
  let startX=0,startScroll=0,dragging=false;
  header.addEventListener('pointerdown',event=>{if(event.button!==0)return;dragging=true;startX=event.clientX;startScroll=scroller.scrollLeft;header.setPointerCapture(event.pointerId);header.classList.add('dragging');});
  header.addEventListener('pointermove',event=>{if(dragging)scroller.scrollLeft=startScroll-(event.clientX-startX);});
  const stopDrag=event=>{if(!dragging)return;dragging=false;header.classList.remove('dragging');if(header.hasPointerCapture(event.pointerId))header.releasePointerCapture(event.pointerId);};
  header.addEventListener('pointerup',stopDrag);header.addEventListener('pointercancel',stopDrag);
  new ResizeObserver(updateWidth).observe(table);updateWidth();
}
function updateStationOptions(){
  const select=$('#station-filter');if(!select)return;
  const line=$('#line-filter')?.value||'all',current=select.value;
  const names=stationsForLine(line);
  select.innerHTML=`<option value="all">全部車站</option>${names.map(name=>`<option value="${escapeHtml(name)}">${escapeHtml(name)}站</option>`).join('')}`;
  select.value=names.includes(current)?current:'all';
}

function updateDistrictOptions(){
  const select=$('#district-filter');
  if(!select)return;
  const city=$('#city-filter')?.value||'all',current=select.value;
  const districts=[...new Set(projects.filter(project=>city==='all'||project.city===city).map(project=>project.district).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'zh-Hant'));
  select.innerHTML=`<option value="all">全部行政區</option>${districts.map(district=>`<option value="${escapeHtml(district)}">${escapeHtml(district)}</option>`).join('')}`;
  select.value=districts.includes(current)?current:'all';
}
function syncTransitFilter(){
  const select=$('#transit-filter');if(!select)return;
  const line=$('#line-filter')?.value||'all',station=$('#station-filter')?.value||'all';
  select.value=line==='all'?'all':station==='all'?`line:${line}`:`station:${line}:${station}`;
  if(select.selectedIndex<0)select.value='all';
}
function updateTransitOptions(){
  const select=$('#transit-filter');if(!select)return;
  select.innerHTML='<option value="all">全部路線與車站</option>';
  for(const [line,label] of Object.entries(transitLineLabels)){
    const names=stationsForLine(line);if(!names.length)continue;
    const group=document.createElement('optgroup');group.label=label;
    const wholeLine=document.createElement('option');wholeLine.value=`line:${line}`;wholeLine.textContent=`整條${label}`;group.append(wholeLine);
    for(const name of names){const option=document.createElement('option');option.value=`station:${line}:${name}`;option.textContent=`${name}站`;group.append(option);}
    select.append(group);
  }
  syncTransitFilter();
}

const hazardKinds={fuel:'加油站',substation:'變電所',cemetery:'公墓／墓園',waste:'廢棄物設施',wastewater:'污水處理設施'};
function classify(tags={}){if(tags.amenity==='fuel')return 'fuel';if(tags.power==='substation')return 'substation';if(tags.landuse==='cemetery'||tags.amenity==='grave_yard')return 'cemetery';if(tags.man_made==='wastewater_plant')return 'wastewater';return 'waste';}
async function loadHazards(){
  const button=$('#refresh-hazards'),status=$('#hazard-status');button.disabled=true;status.textContent='正在查詢 OSM…';
  const centers=[...new Map(projects.filter(isMapped).map(project=>[`${project.lat},${project.lng}`,project])).values()];
  const around=centers.map(project=>`nwr(around:500,${project.lat},${project.lng})[amenity=fuel];nwr(around:500,${project.lat},${project.lng})[power=substation];nwr(around:500,${project.lat},${project.lng})[landuse=cemetery];nwr(around:500,${project.lat},${project.lng})[amenity=grave_yard];nwr(around:500,${project.lat},${project.lng})[man_made=wastewater_plant];nwr(around:500,${project.lat},${project.lng})[amenity=waste_transfer_station];`).join('');
  try{
    const response=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(`[out:json][timeout:35];(${around});out center;`)});if(!response.ok)throw new Error(`Overpass ${response.status}`);
    const data=await response.json(),seen=new Set(),features=[];
    for(const element of data.elements){const lat=element.lat??element.center?.lat,lng=element.lon??element.center?.lon,key=`${lat},${lng}`;if(!lat||!lng||seen.has(key))continue;seen.add(key);const kind=classify(element.tags);features.push({type:'Feature',properties:{label:hazardKinds[kind],name:element.tags?.name||'OSM 未命名設施'},geometry:{type:'Point',coordinates:[lng,lat]}});}
    const collection={type:'FeatureCollection',features};
    if(map.getSource('hazards'))map.getSource('hazards').setData(collection);else{
      map.addSource('hazards',{type:'geojson',data:collection});map.addLayer({id:'hazards',type:'circle',source:'hazards',paint:{'circle-radius':6,'circle-color':'#fff2eb','circle-stroke-color':'#b74838','circle-stroke-width':2}});
      map.on('click','hazards',event=>{const feature=event.features?.[0];if(feature)new maplibregl.Popup().setLngLat(event.lngLat).setHTML(`<b>${escapeHtml(feature.properties.label)}</b><br>${escapeHtml(feature.properties.name)}`).addTo(map);});
    }
    status.textContent=`已載入 ${features.length} 個 OSM 設施`;
  }catch(error){status.textContent='查詢失敗，稍後可再試';console.error(error);}finally{button.disabled=false;}
}

const hazardCacheKey='presale-base-hazards-v1';
const overpassEndpoints=['https://maps.mail.ru/osm/tools/overpass/api/interpreter','https://overpass.private.coffee/api/interpreter','https://lz4.overpass-api.de/api/interpreter','https://overpass-api.de/api/interpreter'];
const expandedHazardKinds={
  fuel:{label:'加油站',group:'重大環境設施',radius:500},substation:{label:'變電所',group:'重大環境設施',radius:500},powerTower:{label:'高壓電塔',group:'重大環境設施',radius:500},
  cemetery:{label:'公墓／墓園',group:'重大環境設施',radius:500},funeral:{label:'殯儀／殯葬設施',group:'重大環境設施',radius:500},crematorium:{label:'火葬場',group:'重大環境設施',radius:1000},
  waste:{label:'廢棄物／轉運設施',group:'重大環境設施',radius:1000},wastewater:{label:'污水處理設施',group:'重大環境設施',radius:1000},industrial:{label:'工業區／工廠',group:'重大環境設施',radius:1000},
  storage:{label:'油氣／大型儲槽',group:'重大環境設施',radius:500},slaughterhouse:{label:'屠宰／化工／瀝青設施',group:'重大環境設施',radius:1000},brownfield:{label:'棕地／疑似廢棄工業地',group:'重大環境設施',radius:1000},
  highway:{label:'快速道路／高架匝道',group:'生活影響設施',radius:300},rail:{label:'鐵路／調車設施',group:'生活影響設施',radius:300},transitDepot:{label:'軌道／公車機廠',group:'生活影響設施',radius:500},airport:{label:'機場影響範圍',group:'生活影響設施',radius:3000},
  emergency:{label:'醫院／急診',group:'生活影響設施',radius:500},fireStation:{label:'消防隊',group:'生活影響設施',radius:300},worship:{label:'宗教活動設施',group:'生活影響設施',radius:300},nightlife:{label:'夜間娛樂場所',group:'生活影響設施',radius:300},
  market:{label:'市場／夜市',group:'生活影響設施',radius:300},school:{label:'學校／幼兒園',group:'生活影響設施',radius:300},communications:{label:'通訊塔／基地台',group:'生活影響設施',radius:300},prison:{label:'監獄／看守所',group:'生活影響設施',radius:500},military:{label:'軍事設施',group:'生活影響設施',radius:500},
};
function classifyExpandedHazard(tags={}){
  if(tags.amenity==='fuel')return 'fuel';
  if(tags.power==='substation')return 'substation';
  if(tags.power==='tower')return 'powerTower';
  if(tags.landuse==='cemetery'||tags.amenity==='grave_yard')return 'cemetery';
  if(tags.amenity==='crematorium')return 'crematorium';
  if(tags.amenity==='funeral_hall'||tags.shop==='funeral_directors')return 'funeral';
  if(tags.man_made==='wastewater_plant')return 'wastewater';
  if(tags.amenity==='waste_transfer_station'||tags.landuse==='landfill')return 'waste';
  if(tags.landuse==='brownfield')return 'brownfield';
  if(tags.industrial&&/slaughterhouse|chemical|asphalt|concrete/.test(tags.industrial))return 'slaughterhouse';
  if(tags.man_made==='storage_tank')return 'storage';
  if(tags.landuse==='industrial')return 'industrial';
  if(tags.railway==='yard'||tags.railway==='depot'||tags.landuse==='railway'||tags.amenity==='bus_station')return 'transitDepot';
  if(tags.railway==='rail')return 'rail';
  if(tags.highway&&/^(motorway|motorway_link|trunk|trunk_link)$/.test(tags.highway))return 'highway';
  if(tags.aeroway==='aerodrome')return 'airport';
  if(tags.amenity==='hospital')return 'emergency';
  if(tags.amenity==='fire_station')return 'fireStation';
  if(tags.amenity==='place_of_worship')return 'worship';
  if(tags.amenity&&/^(bar|pub|nightclub|karaoke_box)$/.test(tags.amenity))return 'nightlife';
  if(tags.amenity==='marketplace')return 'market';
  if(tags.amenity&&/^(school|kindergarten|college|university)$/.test(tags.amenity))return 'school';
  if((tags.man_made==='mast'||tags.man_made==='tower')&&/communication|mobile_phone/.test(`${tags['tower:type']||''} ${tags.communication||''}`))return 'communications';
  if(tags.amenity==='prison')return 'prison';
  if(tags.landuse==='military'||tags.military)return 'military';
  return null;
}
function distanceMeters(aLat,aLng,bLat,bLng){
  const radians=value=>value*Math.PI/180;
  const dLat=radians(bLat-aLat),dLng=radians(bLng-aLng);
  const value=Math.sin(dLat/2)**2+Math.cos(radians(aLat))*Math.cos(radians(bLat))*Math.sin(dLng/2)**2;
  return 12742000*Math.asin(Math.sqrt(value));
}
function facilityIcon(shape,color){
  const canvas=document.createElement('canvas');canvas.width=40;canvas.height=40;
  const context=canvas.getContext('2d');context.beginPath();
  if(shape==='diamond'){context.moveTo(20,3);context.lineTo(37,20);context.lineTo(20,37);context.lineTo(3,20);context.closePath();}
  else{context.moveTo(20,3);context.lineTo(37,35);context.lineTo(3,35);context.closePath();}
  context.fillStyle=color;context.fill();context.strokeStyle='#fff';context.lineWidth=5;context.lineJoin='round';context.stroke();
  return context.getImageData(0,0,40,40);
}
function updateHazardVisibility(){
  const critical=$('#critical-facilities-toggle')?.checked??false;
  const impact=$('#impact-facilities-toggle')?.checked??false;
  if(map.getLayer('hazards')){
    const filter=critical&&impact?null:critical?['==',['get','group'],'重大環境設施']:impact?['==',['get','group'],'生活影響設施']:['==',['get','group'],'__none__'];
    map.setFilter('hazards',filter);
  }
  const visible=[critical&&'重大環境設施',impact&&'生活影響設施'].filter(Boolean);
  const status=$('#environment-layer-status');if(status)status.textContent=visible.length?`${visible.join('、')}開啟`:'環境設施目前關閉';
}
function clearRiskLayers(){
  $('#critical-facilities-toggle').checked=false;$('#impact-facilities-toggle').checked=false;updateHazardVisibility();
  $('#flood-toggle').checked=false;updateFloodLayer();
  $('#liquefaction-toggle').checked=false;updateGeologyLayer('liquefaction','#liquefaction-toggle');
  $('#active-faults-toggle').checked=false;updateGeologyLayer('activeFaults','#active-faults-toggle');
}
function setHazardData(collection){
  if(map.getSource('hazards')){
    map.getSource('hazards').setData(collection);
    return;
  }
  map.addSource('hazards',{type:'geojson',data:collection});
  if(!map.hasImage('hazard-diamond'))map.addImage('hazard-diamond',facilityIcon('diamond','#b74838'),{pixelRatio:2});
  if(!map.hasImage('impact-triangle'))map.addImage('impact-triangle',facilityIcon('triangle','#d38a18'),{pixelRatio:2});
  map.addLayer({id:'hazards',type:'symbol',source:'hazards',layout:{'icon-image':['match',['get','group'],'重大環境設施','hazard-diamond','impact-triangle'],'icon-size':['interpolate',['linear'],['zoom'],10,.68,14,1],'icon-allow-overlap':true,'icon-ignore-placement':true},paint:{'icon-opacity':.94}});
  updateHazardVisibility();
  map.on('click','hazards',event=>{
    const feature=event.features?.[0];
    if(feature)new maplibregl.Popup().setLngLat(event.lngLat).setHTML(`<b>${escapeHtml(feature.properties.label)}</b><br>${escapeHtml(feature.properties.name)}<br><small>${escapeHtml(feature.properties.group)} · 檢查 ${escapeHtml(feature.properties.radius)} 公尺</small>`).addTo(map);
  });
}
async function requestHazards(query){
  let lastError;
  for(const endpoint of overpassEndpoints){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),25000);
    try{
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(query),signal:controller.signal});
      if(!response.ok)throw new Error(`${new URL(endpoint).host} HTTP ${response.status}`);
      return await response.json();
    }catch(error){
      lastError=error;
    }finally{
      clearTimeout(timer);
    }
  }
  throw lastError||new Error('Overpass unavailable');
}
async function loadHazardsReliable(force=false){
  const button=$('#refresh-hazards'),status=$('#hazard-status');
  button.hidden=true;
  const centers=projects.filter(isMapped);
  let cached;
  try{cached=JSON.parse(localStorage.getItem(hazardCacheKey)||'null');}catch{cached=null;}
  if(cached?.collection){
    setHazardData(cached.collection);
    const ageHours=Math.floor((Date.now()-cached.updatedAt)/3600000);
    const critical=cached.collection.features.filter(feature=>feature.properties.group==='重大環境設施').length;
    status.textContent=`已載入 ${cached.collection.features.length} 個設施（重大 ${critical}；快取 ${ageHours} 小時）`;
    if(!force&&Date.now()-cached.updatedAt<12*3600000)return;
  }
  if(!force){
    try{
      const response=await fetch(`${import.meta.env.BASE_URL}data/environment-facilities.geojson`);
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const collection=await response.json();
      setHazardData(collection);
      const critical=collection.features.filter(feature=>feature.properties.group==='重大環境設施').length;
      const updatedAt=Date.parse(collection.metadata?.generatedAt)||Date.now();
      localStorage.setItem(hazardCacheKey,JSON.stringify({updatedAt,collection}));
      status.textContent=`已載入共用快取 ${collection.features.length} 個設施（重大 ${critical}）`;
      return;
    }catch(error){console.warn('共用環境設施快取無法載入，改用即時查詢',error);}
  }
  if(!centers.length){status.textContent='目前沒有已定位基地';return;}
  button.disabled=true;
  status.textContent='正在更新 OSM 嫌惡設施…';
  const padding=.035;
  const south=Math.min(...centers.map(item=>item.lat))-padding;
  const west=Math.min(...centers.map(item=>item.lng))-padding;
  const north=Math.max(...centers.map(item=>item.lat))+padding;
  const east=Math.max(...centers.map(item=>item.lng))+padding;
  const bbox=`(${south},${west},${north},${east})`;
  const queries=[
    `[out:json][timeout:30];(nwr[amenity~"fuel|crematorium|funeral_hall|waste_transfer_station"]${bbox};nwr[shop=funeral_directors]${bbox};nwr[power~"substation|tower"]${bbox};nwr[landuse~"cemetery|landfill"]${bbox};nwr[man_made~"wastewater_plant|storage_tank"]${bbox};);out center tags;`,
    `[out:json][timeout:30];(nwr[landuse~"industrial|brownfield"]${bbox};nwr[industrial~"slaughterhouse|chemical|asphalt|concrete"]${bbox};);out center tags;`,
    `[out:json][timeout:30];(nwr[amenity=bus_station]${bbox};nwr[landuse=railway]${bbox};nwr[railway~"yard|depot|rail"]${bbox};nwr[highway~"motorway|motorway_link|trunk|trunk_link"]${bbox};nwr[aeroway=aerodrome]${bbox};);out center tags;`,
    `[out:json][timeout:30];(nwr[amenity~"fire_station|hospital|school|kindergarten|college|university|place_of_worship|bar|pub|nightclub|karaoke_box|marketplace|prison"]${bbox};nwr[man_made~"mast|tower"]${bbox};nwr[landuse=military]${bbox};nwr[military]${bbox};);out center tags;`,
  ];
  try{
    const elements=[];
    let failedBatches=0;
    for(let index=0;index<queries.length;index++){
      status.textContent=`正在更新環境設施（${index+1}/${queries.length}）…`;
      try{
        const data=await requestHazards(queries[index]);
        elements.push(...(data.elements||[]));
      }catch(error){
        failedBatches++;
        console.warn(`環境設施第 ${index+1} 批查詢失敗`,error);
      }
    }
    if(!elements.length)throw new Error('所有環境設施查詢皆失敗');
    const seen=new Set(),features=[];
    for(const element of elements){
      const lat=element.lat??element.center?.lat,lng=element.lon??element.center?.lon;
      if(!Number.isFinite(lat)||!Number.isFinite(lng))continue;
      const kind=classifyExpandedHazard(element.tags);
      const definition=expandedHazardKinds[kind];
      if(!definition||!centers.some(project=>distanceMeters(lat,lng,project.lat,project.lng)<=definition.radius))continue;
      const key=`${element.type}/${element.id}`;
      if(seen.has(key))continue;
      seen.add(key);
      features.push({type:'Feature',properties:{label:definition.label,group:definition.group,radius:definition.radius,name:element.tags?.name||'OSM 未命名設施'},geometry:{type:'Point',coordinates:[lng,lat]}});
    }
    const collection={type:'FeatureCollection',features};
    setHazardData(collection);
    localStorage.setItem(hazardCacheKey,JSON.stringify({updatedAt:Date.now(),collection}));
    const critical=features.filter(feature=>feature.properties.group==='重大環境設施').length;
    status.textContent=`已更新 ${features.length} 個設施（重大 ${critical}）${failedBatches?`；${failedBatches} 批暫時無法更新`:''}`;
    button.hidden=failedBatches===0;
  }catch(error){
    status.textContent=cached?.collection?'更新失敗，保留上次資料':'查詢失敗，請稍後再試';
    button.hidden=false;
    console.error('嫌惡設施更新失敗',error);
  }finally{
    button.disabled=false;
  }
}

function placeFiltersAboveMap(){
  const mapSection=$('#map-section'),mapFrame=mapSection?.querySelector('.map-frame'),filters=$('.filter-panel');
  if(!mapSection||!mapFrame||!filters)return;
  filters.classList.add('map-filter-panel');
  filters.setAttribute('aria-label','建案篩選條件');
  mapSection.insertBefore(filters,mapFrame);
  const summary=document.createElement('div');
  summary.className='map-filter-summary';
  summary.innerHTML='目前地圖顯示 <b id="map-result-count">0</b> 筆符合條件的建案';
  mapSection.insertBefore(summary,mapFrame);
}

placeFiltersAboveMap();
addFloodControl();
setupResponsiveMapPanels();
map.on('load',()=>{addProjectAreas();showMetroLines(cachedMetroRoutes);showMetroStations();addProjectMarkers();render();loadMetroLines();setTimeout(()=>loadHazardsReliable(false),600);});
$('#city-filter')?.addEventListener('change',()=>{updateDistrictOptions();render();});
['district-filter','status-filter','rating-filter','walk-filter'].forEach(id=>$('#'+id)?.addEventListener('change',render));
$('#station-filter')?.addEventListener('change',()=>{syncTransitFilter();render();});
$('#line-filter')?.addEventListener('change',()=>{updateStationOptions();syncTransitFilter();render();});
$('#transit-filter')?.addEventListener('change',event=>{
  const [kind,line,...stationParts]=event.target.value.split(':');
  $('#line-filter').value=kind==='all'?'all':line;
  updateStationOptions();
  if(kind==='station')$('#station-filter').value=stationParts.join(':');
  syncTransitFilter();render();
});
$('#search-filter').addEventListener('input',render);
document.querySelectorAll('[data-scroll]').forEach(button=>button.addEventListener('click',()=>$('#'+button.dataset.scroll).scrollIntoView({behavior:'smooth'})));
document.querySelectorAll('[data-open-risk]').forEach(button=>button.addEventListener('click',()=>{
  $('#map-section').scrollIntoView({behavior:'smooth'});
  window.setTimeout(()=>{
    const panel=document.querySelector('.flood-control');
    if(!panel)return;
    document.querySelectorAll('.map-panel').forEach(item=>{
      item.classList.remove('panel-open');
      item.querySelector('.map-panel-toggle')?.setAttribute('aria-expanded','false');
      const icon=item.querySelector('.map-panel-toggle span');
      if(icon)icon.textContent='＋';
    });
    panel.classList.add('panel-open');
    const toggle=panel.querySelector('.map-panel-toggle');
    toggle?.setAttribute('aria-expanded','true');
    const icon=toggle?.querySelector('span');
    if(icon)icon.textContent='−';
  },450);
}));
$('#refresh-hazards').addEventListener('click',()=>loadHazardsReliable(true));
updateStationOptions();
updateDistrictOptions();
updateTransitOptions();
setupTableScrolling();
const mappedWalks=projects.map(project=>project.walk).filter(Number.isFinite);
$('#total-count').textContent=projects.length;$('#district-count').textContent=new Set(projects.map(project=>project.district)).size;$('#walk-average').textContent=mappedWalks.length?(mappedWalks.reduce((sum,walk)=>sum+walk,0)/mappedWalks.length).toFixed(1):'—';
render();
