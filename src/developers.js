import './mobile-navigation.js';
import { matureProjects } from './mature-data.js';
import './developer-radar.css';
import { developerResearch,developerRubric } from './developer-research.js';
import { developerFlagDefinitions,getDeveloperFlags,developerRiskAuditMeta } from './developer-flags.js';

const ratingRank={S:4,A:3,B:2,C:1,NR:0};
const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const projectCount=profile=>matureProjects.filter(project=>profile.aliases.some(alias=>String(project.builder).includes(alias))).length;
const profiles=developerResearch.map(profile=>({...profile,count:projectCount(profile),flags:getDeveloperFlags(profile)}));
const dimensions=developerRubric.map(item=>[item.label,item.key]);
const cards=document.querySelector('#developer-cards');
const countNode=document.querySelector('#developer-count');
const empty=document.querySelector('#developer-empty');
const ratedProjects=matureProjects.filter(project=>['S','A','B','C'].includes(project.rating)).length;
document.querySelector('#profile-total').textContent=profiles.length;
document.querySelector('#rated-project-total').textContent=ratedProjects;
document.querySelector('#pending-project-total').textContent=matureProjects.filter(project=>project.rating==='NR').length;
document.querySelector('#developer-flag option[value="major"]').textContent=`${developerFlagDefinitions.major.label}（${profiles.filter(profile=>profile.flags.major).length}）`;
document.querySelector('#developer-flag option[value="governance"]').textContent=`${developerFlagDefinitions.governance.label}（${profiles.filter(profile=>profile.flags.governance).length}）`;
document.querySelector('#developer-flag option[value="regulatory"]').textContent=`${developerFlagDefinitions.regulatory.label}（${profiles.filter(profile=>profile.flags.regulatory).length}）`;
document.querySelector('#developer-flag option[value="limited"]').textContent=`${developerFlagDefinitions.limited.label}（${profiles.filter(profile=>profile.flags.limited).length}）`;
document.querySelector('#ftc-audit-total').textContent=developerRiskAuditMeta.sources.ftc.decisionCount.toLocaleString('zh-TW');
document.querySelector('#environment-audit-total').textContent=developerRiskAuditMeta.sources.environment.penaltyCount.toLocaleString('zh-TW');
document.querySelector('#ftc-audit-date').textContent=new Date(developerRiskAuditMeta.generatedAt).toLocaleDateString('zh-TW');

function radarHtml(profile){
  const labels=['履約推案','工程制度','財務治理','售後保固'];
  const dimensionCount=dimensions.length;
  const point=(index,value)=>{
    const angle=-Math.PI/2+index*Math.PI*2/dimensionCount;
    return [160+Math.cos(angle)*82*value/100,123+Math.sin(angle)*82*value/100];
  };
  const coordinates=points=>points.map(p=>p.map(n=>n.toFixed(2)).join(',')).join(' ');
  const values=dimensions.map(([,key])=>profile.scores?.[key]);
  const valid=value=>Number.isFinite(value)&&value>=0&&value<=100;
  const complete=values.every(valid);
  const description=dimensions.map(([label],index)=>`${label}：${valid(values[index])?values[index]+' 分':'待研究'}`).join('；');
  return `<figure class="developer-radar"><svg viewBox="0 0 320 250" role="img" aria-label="${escapeHtml(profile.name+' 四項基礎能力評分，固定 0 至 100 分。'+description)}">
    ${[20,40,60,80,100].map(level=>`<polygon class="radar-grid" points="${coordinates(dimensions.map((_,i)=>point(i,level)))}"/>`).join('')}
    ${dimensions.map((_,i)=>`<line class="radar-axis" x1="160" y1="123" x2="${point(i,100)[0]}" y2="${point(i,100)[1]}"/>`).join('')}
    ${complete?`<polygon class="radar-area" points="${coordinates(values.map((value,i)=>point(i,value)))}"/>`:''}
    ${values.map((value,i)=>valid(value)?`<circle class="radar-point" cx="${point(i,value)[0]}" cy="${point(i,value)[1]}" r="3"><title>${escapeHtml(dimensions[i][0])} ${value} 分</title></circle>`:'').join('')}
    ${labels.map((label,i)=>{const [x,y]=point(i,132);return `<text class="radar-label" x="${x}" y="${y-5}" text-anchor="middle"><tspan x="${x}">${label}</tspan><tspan class="radar-value" x="${x}" dy="17">${valid(values[i])?values[i]+' 分':'待研究'}</tspan></text>`;}).join('')}
    ${[0,50,100].map(level=>`<text class="radar-scale" x="166" y="${point(0,level)[1]+4}">${level}</text>`).join('')}
    </svg><figcaption>四項基礎能力各 0–100 分；事件風險另行扣分${complete?'':' · 資料未齊，僅顯示已評分項目'}</figcaption></figure>`;
}

function render(){
  const query=document.querySelector('#developer-search').value.trim().toLowerCase();
  const minimum=document.querySelector('#developer-rating').value;
  const flag=document.querySelector('#developer-flag').value;
  const sort=document.querySelector('#developer-sort').value;
  const result=profiles.filter(profile=>(minimum==='all'||ratingRank[profile.rating]>=ratingRank[minimum])&&(!query||profile.name.toLowerCase().includes(query))&&(flag==='all'||(flag==='major'&&profile.flags.major)||(flag==='governance'&&profile.flags.governance)||(flag==='regulatory'&&profile.flags.regulatory)||(flag==='limited'&&profile.flags.limited)||(flag==='clear'&&!profile.flags.major&&!profile.flags.governance&&!profile.flags.regulatory&&!profile.flags.limited)));
  result.sort((a,b)=>sort==='projects'?b.count-a.count:sort==='confidence'?b.sources.length-a.sources.length:sort==='name'?a.name.localeCompare(b.name,'zh-Hant'):(b.score??-1)-(a.score??-1)||b.count-a.count);
  countNode.textContent=result.length;
  empty.hidden=result.length>0;
  cards.innerHTML=result.map(profile=>`<article class="developer-card">
    <header><span class="grade grade-${profile.rating.toLowerCase()}">${profile.rating==='NR'?'—':profile.rating}</span><div><h2>${escapeHtml(profile.name)}</h2><small>研究信心 ${profile.confidence} · 本站 ${profile.count} 案</small></div><strong>${profile.score??'—'}<small>${profile.score==null?'不評分':'/100'}</small></strong></header>
    ${(profile.flags.major||profile.flags.governance||profile.flags.regulatory||profile.flags.limited)?`<div class="developer-flags">${profile.flags.major?`<span class="developer-flag flag-major">${developerFlagDefinitions.major.label}</span>`:''}${profile.flags.governance?`<span class="developer-flag flag-governance">${developerFlagDefinitions.governance.label}</span>`:''}${profile.flags.regulatory?`<span class="developer-flag flag-regulatory">${developerFlagDefinitions.regulatory.label}</span>`:''}${profile.flags.limited?`<span class="developer-flag flag-limited">${developerFlagDefinitions.limited.label}</span>`:''}</div>`:''}
    <div class="developer-score-equation" aria-label="計分結果"><span><small>基礎能力</small><b>${profile.baseScore??'—'}</b></span><i>−</i><span><small>風險調整</small><b>${profile.riskAdjustment??0}</b></span><i>＝</i><span class="score-final"><small>最終分</small><b>${profile.score??'—'}</b></span>${profile.ratingCap?`<em>評級上限 ${profile.ratingCap}</em>`:''}</div>
    ${profile.riskReasons.length?`<p class="developer-score-reasons">${profile.riskReasons.map(escapeHtml).join(' · ')}</p>`:''}
    ${radarHtml(profile)}
    <p class="research-summary">${escapeHtml(profile.summary)}</p>
    <p class="research-caveat"><b>判讀限制</b>${escapeHtml(profile.caveat)}</p>
    ${profile.flags.records.length?`<div class="developer-risk-records">${profile.flags.records.map(record=>`<article class="risk-${record.severity}"><span class="risk-kind">${record.severity==='critical'?developerFlagDefinitions.major.label:record.severity==='governance'?developerFlagDefinitions.governance.label:developerFlagDefinitions.regulatory.label}</span><h3>${escapeHtml(record.title)}</h3><p>${escapeHtml(record.detail)}</p><div>${record.sources.map(source=>`<a href="${source.url}" target="_blank" rel="noopener">${escapeHtml(source.label)}<small>${escapeHtml(source.type)}</small></a>`).join('')}</div></article>`).join('')}<p class="developer-score-impact"><b>評分影響</b>已反映於：${profile.flags.impact.map(escapeHtml).join('、')}</p></div>`:''}
    ${profile.flags.regulatoryRecords.length?`<details class="developer-regulatory-records"><summary>公平會完整名稱比對：${profile.flags.regulatoryRecords.length} 筆</summary>${profile.flags.regulatoryRecords.map(record=>`<article><div><time>${escapeHtml(record.date)}</time>${record.reversed?'<span>處分已撤銷</span>':record.historical?'<span>歷史紀錄</span>':'<span>納入治理／風險複核</span>'}</div><p>${escapeHtml(record.title)}</p><a href="${record.url}" target="_blank" rel="noopener">開啟公平會原始決定</a></article>`).join('')}<small>完整名稱命中仍不等同事件嚴重度；已撤銷處分不扣分，2015 年前紀錄主要作歷史背景，近期重複或涉及交易資訊者優先影響治理與風險判讀。</small></details>`:''}
    <div class="research-meta"><span>覆核 ${profile.reviewed}</span>${profile.sources.map(source=>`<a href="${source.url}" target="_blank" rel="noopener">${escapeHtml(source.label)}<small>${escapeHtml(source.type)}</small></a>`).join('')}</div>
  </article>`).join('');
}

document.querySelector('#developer-search').addEventListener('input',render);
document.querySelector('#developer-rating').addEventListener('change',render);
document.querySelector('#developer-flag').addEventListener('change',render);
document.querySelector('#developer-sort').addEventListener('change',render);
render();
