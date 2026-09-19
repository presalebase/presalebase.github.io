import {developerRiskAudit,developerRiskCandidates,developerRiskAuditMeta} from './generated/developer-risk-audit.js';

const majorRiskRecordsByName={
  '宏普建設':[
    {
      title:'預售重要交易資訊錯誤且持續使用',
      detail:'公平會 2024 年處分認定，宏普中央公園銷售時提供之各戶持分總表有共有部分面積不足、遺漏及錯誤，且發現錯誤後仍持續以錯誤資訊交易；因此列為近期治理與消費交易高風險紀錄。',
      sources:[{label:'公平會 2024 年行政決定',url:'https://www.ftc.gov.tw/uploadDecision/6c41aa26-7a65-422e-9306-6aed425975e9.pdf',type:'公平交易委員會'}],
    },
  ],
  '興富發建設':[
    {
      title:'預售重要資訊未揭露與重複廣告裁處',
      detail:'公平會 2022 年認定鉑愛悦銷售時未提供地盤圖、各戶持分總表及預售屋契約等重要資訊；2023 年文心愛悅戶數資訊另遭裁處。本站將近期重複的消費交易與廣告法遵紀錄反映於治理、服務及風險分數。',
      sources:[
        {label:'公平會 2022 年行政決定',url:'https://www.ftc.gov.tw/uploadDecision/aff78222-e048-41f3-9c27-dd4fd8fbfe6a.pdf',type:'公平交易委員會'},
        {label:'公平會 2023 年行政決定',url:'https://www.ftc.gov.tw/uploadDecision/2cb647bd-cc40-482a-8f37-a097333ccb7b.pdf',type:'公平交易委員會'},
      ],
    },
  ],
  '遠雄建設':[
    {
      title:'銷售前資訊未提供與建案內容廣告裁處',
      detail:'公平會 2021 年認定遠雄辦理涉及預售屋銷售之活動並收取保證金，卻未提供契約、停車平面圖及貸款金融機構等資訊；2022 年文心匯中庭花園內容另遭裁處。近期重複紀錄已反映於治理、服務與風險分數。',
      sources:[
        {label:'公平會 2021 年行政決定',url:'https://www.ftc.gov.tw/uploadDecision/f4383562-077f-4352-b3b0-fd834263dda8.pdf',type:'公平交易委員會'},
        {label:'公平會 2022 年行政決定',url:'https://www.ftc.gov.tw/uploadDecision/3521ae96-7292-495e-9925-c4ac79a2ef50.pdf',type:'公平交易委員會'},
      ],
    },
  ],
  '茂德建設機構':[
    {
      title:'南港工地污染水體，環境部列為情節重大',
      detail:'環境部資料記載，茂德建設南港集合住宅工程的基樁泥沙未妥善處理，泥漿水經雨水側溝流入大坑溪；2025 年裁罰 24.9 萬元並處環境講習，官方「情節重大」欄位為是。',
      sources:[{label:'環境部列管事業污染源裁處資料',url:'https://data.gov.tw/dataset/34101',type:'環境部環境管理署'}],
    },
  ],
  '景星建設':[
    {
      title:'建商品牌與法人狀態待核對',
      detail:'案場使用的建商名稱與目前可查公司法人狀態存在落差，尚待確認實際出賣人、起造人及履約保證主體；這是主體辨識風險，不代表已發生工程事故。',
      sourceLabels:['景星建設公司登記','御品園建案及使用執照資料'],
    },
  ],
  '立鵬資產':[
    {
      title:'公共設施廣告不實處分',
      detail:'公平會曾就關係建案長耀挹品的公共設施廣告不實作成行政處分；本站不把關係企業全部履歷移轉給立鵬，並將處分納入治理與風險評估。',
      sourceLabels:['公平會行政決定'],
    },
  ],
  '新貴開發':[
    {
      title:'預售契約缺失與環評裁罰',
      detail:'臺北市稽查曾指出靜心多多契約多項內容不符規定並要求改善；新北市另有未依環評內容執行的裁罰紀錄。',
      sourceLabels:['靜心多多預售屋稽查結果','新貴開發環評裁罰紀錄'],
    },
  ],
  '金鑽號事業':[
    {
      title:'建案廣告不實處分',
      detail:'公平會曾就沐夏會館廣告不實作成處分並裁罰 50 萬元；公司亦非典型住宅開發登記，購屋前應再確認履約主體。',
      sourceLabels:['公平會廣告不實處分'],
    },
  ],
  '福容開發':[
    {
      title:'夾層空間廣告處分',
      detail:'君悅富國銷售廣告曾因夾層空間呈現不當遭公平會處分；此為銷售資訊風險，不是建物結構安全判定。',
      sourceLabels:['公平會行政處分'],
    },
  ],
  '喜琚建築開發':[
    {
      title:'不動產銷售違規紀錄',
      detail:'臺北市不動產開發業者銷售違規統計列有正式裁罰紀錄；標籤反映公司治理與銷售流程風險，不代表個案工程品質已被判定不良。',
      sourceLabels:['臺北市不動產開發業者銷售違規統計'],
    },
  ],
  '佳瑞建設':[
    {
      title:'契約查核改善與廣告處分紀錄',
      detail:'官方資料可見預售契約查核改善及廣告不實處分紀錄，本站已將其反映在治理、服務與風險分數。',
      sourceLabels:['桃園市預售契約查核','公平會處分彙編'],
    },
  ],
  '三境建設':[
    {
      title:'陽台外推廣告不實',
      detail:'公平會認定華亭樹廣告以陽台外推作為室內空間圖示，構成虛偽不實及引人錯誤表示，處三境建設 20 萬元罰鍰。',
      sourceLabels:['公平會公處字第 101190 號'],
    },
  ],
  '甲士林建設':[
    {
      title:'公共設施廣告處分紀錄',
      detail:'公平會曾就相關建案公共設施內容與核准用途不符作成處分，本站已下修治理及風險評分。',
      sourceLabels:['水立方廣告公平會處分'],
    },
  ],
  '名軒開發':[
    {
      title:'實品屋用途與夾層設計不實',
      detail:'公平會認定名軒富麗將一般事務所實品屋裝潢為住宅使用並展示未經核准的夾層設計，處名軒開發 150 萬元罰鍰。',
      sourceLabels:['公平會公處字第114050號'],
    },
  ],
  '怡富開發建設股份有限公司（怡富機構）':[
    {
      title:'建案廣告不實處分紀錄',
      detail:'公平會曾就時尚之星廣告不實作成處分；紀錄已反映於風險分數，並不等同旗下所有個案均有相同問題。',
      sourceLabels:['公平交易委員會處分書'],
    },
  ],
  '安家國際企業股份有限公司':[
    {
      title:'安家 T HOUSE 廣告／銷售處分',
      detail:'公平會就安家 T HOUSE 的廣告及銷售資訊作成正式處分，本站已將紀錄反映於治理與風險分數。',
      sourceLabels:['公平交易委員會安家 T HOUSE 處分書'],
    },
  ],
  '富晟科技':[
    {
      title:'預售價金未依規定交付信託',
      detail:'遠東商銀公告，中山富寓買方繳付價金曾未於規定期限內交付信託，且經限期催告後仍未提出說明、補足不足金額或改善。',
      sourceLabels:['預售價金信託異常公告'],
    },
  ],
  '富璟建設':[
    {
      title:'公園與捷運距離廣告不實',
      detail:'公平會認定圓山富璟對公園面積、首排位置及捷運步行距離的廣告與事實不符，處富璟建設 100 萬元罰鍰。',
      sourceLabels:['公平會圓山富璟處分說明'],
    },
  ],
  '昌鑫建設開發':[
    {
      title:'商業區建案以一般住宅用語廣告',
      detail:'公平會認定大直匯廣告使用一般住宅用語，使消費者誤認可作住宅使用，構成不實及引人錯誤表示，處 80 萬元罰鍰。',
      sourceLabels:['公平會公處字第108059號'],
    },
  ],
  '溪福建設':[
    {
      title:'機房、儲藏室與陽台標示為臥室',
      detail:'公平會認定三希堂廣告將機房、儲藏室與陽台標示為臥室，構成虛偽不實及引人錯誤表示，處 20 萬元罰鍰。',
      sourceLabels:['公平會三希堂處分書'],
    },
  ],
  '復翔建設':[
    {
      title:'開發信託查核報告缺件',
      detail:'台新銀行公告，復翔建設未提供南京葒預售屋不動產開發信託案之 114 年度會計師查核簽認報告；這是資金治理警訊，不等同已認定無法完工。',
      sourceLabels:['南京葒信託查核缺件公告'],
    },
  ],
  '百邑建設':[
    {
      title:'建案廣告實績表示不實',
      detail:'公平會認定百邑在建案廣告中使用其他公司的實績與商譽，構成虛偽不實及引人錯誤表示，並處 60 萬元罰鍰。',
      sourceLabels:['公平會公處字第112020號'],
    },
  ],
  '華鋐企業':[
    {
      title:'容積移轉許可撤銷案調查中',
      detail:'監察院會議紀錄記載，華鋐晴朗容積移轉原核准許可遭撤銷及可能影響購屋人權益等情正在處理；目前仍屬調查中事項，不等同已認定犯罪。',
      sourceLabels:['監察院第 6 屆第 79 次會議紀錄'],
    },
  ],
  '邦泰建設':[
    {
      title:'消費協商未到場與履約關係待釐清',
      detail:'新北市公布的消費協商未到場名單列有邦泰預售屋案件；都市更新會議紀錄另要求釐清相關債務、票據訴訟及解約關係。這是治理與履約警訊，不等同已判定建物有瑕疵。',
      sourceLabels:['新北市協商不到業者名單','三重都市更新官方會議紀錄'],
    },
  ],
  '森築開發':[
    {
      title:'公共空間用途廣告不實',
      detail:'公平會認定上河園對公共空間用途作虛偽不實及引人錯誤表示，對森築開發處 100 萬元罰鍰。',
      sourceLabels:['公平會上河園處分書'],
    },
  ],
  '長榮久盟開發建設':[
    {
      title:'不當限制預售契約審閱',
      detail:'公平會認定大坪林 ONE 銷售過程要求先付定金才提供契約攜回審閱，構成足以影響交易秩序的顯失公平行為，處 100 萬元罰鍰。',
      sourceLabels:['公平會公處字第 111002 號'],
    },
  ],
  '協鼎建設股份有限公司':[
    {
      title:'目前登記停業',
      detail:'經濟部商工登記記載停業期間為 2026 年 4 月 30 日至 2027 年 4 月 30 日；停業不等同倒閉，但在復業與個案交付狀況確認前屬重要營運風險。',
      sourceLabels:['經濟部商工登記（協鼎建設）'],
    },
  ],
  '富裔實業':[
    {
      title:'預售重要資訊與契約審閱違規',
      detail:'公平會認定國王雙子星銷售期間未提供各戶持分總表，並要求先付定金才提供契約攜回審閱，處富裔實業 160 萬元罰鍰。',
      sourceLabels:['公平會公處字第 114044 號'],
    },
  ],
  '日勝生活科技':[
    {
      title:'重大歷史爭議與銷售處分紀錄',
      detail:'公司年報揭露美河市仲裁等重大歷史爭議；日初不老莊園銷售資訊另有公平會處分。大型履約能力不會抵銷已確認的治理與消費交易紀錄。',
      sourceLabels:['日勝生活科技 113 年年報','日初不老莊園公平會處分'],
    },
  ],
  '基泰建設':[
    {
      title:'大直工地鄰房下陷事件',
      detail:'臺北市政府已就基泰大直施工造成鄰房下陷案公布調查與處置資料。標籤只表示存在需查核的重大工程事件，不代表旗下每一個案都有相同問題。',
      sourceLabels:['北市府調查報告說明','施工損鄰鑑定說明'],
    },
  ],
  '嘉源建設':[
    {
      title:'停業與停工案履約風險',
      detail:'臺北市政府曾公告公司有開始營業後自行停止營業六個月以上、通知限期申復情事；消基會亦就兩案停工及價金信託保障提出警示。',
      sourceLabels:['臺北市無營業公司限期申復公告','嘉源兩案履約保障分析'],
    },
  ],
  '御翔開發建設':[
    {
      title:'個案無法依約完工',
      detail:'受託銀行公告接獲建商通知，「大安信藝館」無法依約定完工，並依信託契約處理剩餘財產分配。',
      sourceLabels:['大安信藝館無法依約完工公告'],
    },
  ],
  '豐邑建設':[
    {
      title:'豐采520周邊道路塌陷',
      detail:'新竹縣政府專案會議紀錄記載，豐采520施工造成莊敬六街道路嚴重塌陷並形成公安事件；後續責任與改善狀態仍應以主管機關最新文件為準。',
      sources:[
        {label:'新竹縣政府專案會議紀錄',url:'https://ws.hsinchu.gov.tw/Download.ashx?n=MTEyMDUxMOWwiOahiOWwj%2Be1hOacg%2BitsOiomOmMhC5wZGY%3D&u=LzAwMS9VcGxvYWQvNy9SZWxGaWxlLzEwMTk4LzI3ODg2NS8xMTIwNTEw5bCI5qGI5bCP57WE5pyD6K2w6KiY6YyELnBkZg%3D%3D',type:'新竹縣政府'},
        {label:'監察院豐采520調查報告',url:'https://www.cy.gov.tw/CyBsBoxContent2.aspx?n=718&s=49227',type:'監察院'},
      ],
    },
    {
      title:'晴空匯火災調查',
      detail:'監察院調查資料涉及電力短路及多項防火避難設施失效，本站因此將此案列為需優先閱讀的重大事件紀錄。',
      sourceLabels:['監察院晴空匯火災調查'],
    },
  ],
  '永琦國際開發':[
    {
      title:'受託銀行認定特定事由',
      detail:'受託銀行認定個案達到客觀上無法依約完工交屋的契約「特定事由」，並召開買方受益權人會議。',
      sourceLabels:['永琦見璞受益權人會議公告'],
    },
  ],
  '永豐隆建設':[
    {
      title:'信用貶落與退票紀錄',
      detail:'受託銀行曾正式公告公司發生退票等信用貶落情事；即使個案後續完工，購屋前仍應重新查核公司與履約保障現況。',
      sourceLabels:['永豐隆信用貶落信託公告'],
    },
  ],
  '莘聖建設':[
    {
      title:'六張街工地損鄰事件',
      detail:'新北市政府資料確認開挖施工期間發生鄰房受損、傾斜與住戶撤離；最終肇因及責任仍以鑑定、裁判或主管機關文件為準。',
      sourceLabels:['六張街工地損鄰處置','公安事件後開挖審查紀錄'],
    },
  ],
  '睿暘建設':[
    {
      title:'結束營業與延遲履約紀錄',
      detail:'公司已結束營業，個案曾發生延遲、起造人及契約承擔移轉；法院判決內容支持購屋人遲延利息請求。',
      sourceLabels:['睿暘建設公司登記','新北地院 115 年度重簡字第 496 號判決'],
    },
  ],
};

const limitedEvidencePattern=/資料不足|公開資料不足|揭露不足|缺少.*資料|樣本.*不足|有限.*資料|資料有限|缺乏.*資料|未見.*資料|不足以/;
const substantiveNegativePattern=/重大|無法依約|退票|停工|停業|事故|法院|裁罰|處分|判決|結束營業|信用貶落|協商不到|不實|違反|缺件|異常公告|撤銷|受損|傾斜/;

function resolveRecordSources(record,profile){
  if(record.sources)return record.sources;
  return (record.sourceLabels||[]).map(label=>profile.sources.find(source=>source.label===label)).filter(Boolean);
}

const criticalRiskPattern=/塌陷|下陷|火災|損鄰|無法依約|停工|信用貶落|退票|特定事由|結束營業|延遲履約|停業與停工|污染水體|預售價金未依規定交付信託/;
const governanceRiskPattern=/未揭露|持續使用|銷售前資訊未提供|重大歷史爭議|信託查核|容積移轉|協商未到場|主體辨識|法人狀態|契約缺失與環評|目前登記停業/;
const recordSeverity=record=>{
  const text=`${record.title} ${record.detail}`;
  if(criticalRiskPattern.test(text))return 'critical';
  if(governanceRiskPattern.test(text))return 'governance';
  return 'regulatory';
};

const impactLabels={delivery:'履約與推案',quality:'工程品質制度',governance:'財務與治理',service:'售後與保固',risk:'風險調整'};
function impactDimensions(records){
  const dimensions=new Set(['risk']);
  const titles=records.map(record=>record.title).join('、');
  if(/塌陷|下陷|火災|損鄰|公安|工程/.test(titles))dimensions.add('quality');
  if(/信託|完工|停工|停業|信用|退票|營運|履約|法人狀態|主體/.test(titles)){
    dimensions.add('delivery');
    dimensions.add('governance');
  }
  if(/廣告|契約|銷售|消費|公共設施|實品屋|空間|用途/.test(titles)){
    dimensions.add('governance');
    dimensions.add('service');
  }
  if(/調查|容積|歷史爭議|裁罰/.test(titles))dimensions.add('governance');
  return [...dimensions].map(key=>impactLabels[key]);
}

function riskData(profile){
  const records=(majorRiskRecordsByName[profile.name]||[]).map(record=>({...record,severity:record.severity||recordSeverity(record),sources:resolveRecordSources(record,profile)}));
  const regulatoryRecords=developerRiskCandidates.filter(record=>record.id===profile.id&&record.name===profile.name).map(record=>({
    ...record,
    reversed:/撤銷原處分|全部撤銷/.test(record.title),
    historical:Number(record.date.slice(0,4))<2015,
  }));
  return {records,regulatoryRecords};
}

const ratingOrder={C:1,B:2,A:3,S:4};
const severeCriticalPattern=/無法依約|信用貶落|退票|停工|停業|結束營業|延遲履約|特定事由/;
const recentGovernancePattern=/持續使用|未揭露|銷售前資訊未提供/;
const eventYear=record=>Number(String(record.date||'').slice(0,4))||0;

export function capDeveloperRating(rating,cap){
  if(!cap||!ratingOrder[rating]||ratingOrder[rating]<=ratingOrder[cap])return rating;
  return cap;
}

export function getDeveloperRiskAssessment(profile){
  const {records,regulatoryRecords}=riskData(profile);
  const criticalRecords=records.filter(record=>record.severity==='critical');
  const governanceRecords=records.filter(record=>record.severity==='governance');
  const manualRegulatoryRecords=records.filter(record=>record.severity==='regulatory');
  const activeRegulatory=regulatoryRecords.filter(record=>!record.reversed);
  const recentRegulatory=activeRegulatory.filter(record=>eventYear(record)>=2019);
  const modernRegulatory=activeRegulatory.filter(record=>eventYear(record)>=2015&&eventYear(record)<2019);
  let penalty=0;
  let ratingCap=null;
  const reasons=[];

  if(criticalRecords.length){
    penalty=Math.min(25,8+Math.max(0,criticalRecords.length-1)*5);
    const severe=criticalRecords.some(record=>severeCriticalPattern.test(`${record.title} ${record.detail}`));
    ratingCap=severe?'C':'B';
    reasons.push(`重大公安／履約事件 ${criticalRecords.length} 筆`);
    reasons.push(severe?'仍涉及履約、信用或營運存續風險，評級最高 C':'重大事件評級最高 B');
  }else if(governanceRecords.length){
    penalty=Math.min(12,5+Math.max(0,governanceRecords.length-1)*3+Math.min(4,recentRegulatory.length));
    const recentOrRepeated=recentRegulatory.length>0||activeRegulatory.length>=2||governanceRecords.some(record=>recentGovernancePattern.test(`${record.title} ${record.detail}`));
    ratingCap=recentOrRepeated?'B':null;
    reasons.push(`交易／治理事件 ${governanceRecords.length} 筆`);
    if(recentRegulatory.length)reasons.push(`2019 年後公平會有效裁處 ${recentRegulatory.length} 筆`);
    if(ratingCap)reasons.push('近期或重複治理事件，評級最高 B');
  }else{
    const unmatchedManual=activeRegulatory.length?0:manualRegulatoryRecords.length;
    penalty=Math.min(5,recentRegulatory.length*2+modernRegulatory.length+unmatchedManual);
    if(recentRegulatory.length)reasons.push(`2019 年後公平會有效裁處 ${recentRegulatory.length} 筆`);
    if(modernRegulatory.length)reasons.push(`2015–2018 年公平會有效裁處 ${modernRegulatory.length} 筆`);
    if(unmatchedManual)reasons.push(`其他一般裁處紀錄 ${unmatchedManual} 筆`);
  }

  return {penalty,ratingCap,reasons,counts:{critical:criticalRecords.length,governance:governanceRecords.length,regulatory:activeRegulatory.length}};
}

export function getDeveloperFlags(profile){
  const {records,regulatoryRecords}=riskData(profile);
  const audit=developerRiskAudit.find(record=>record.id===profile.id&&record.name===profile.name);
  const caveat=profile.caveat||'';
  const limited=['B','C'].includes(profile.rating)&&limitedEvidencePattern.test(caveat)&&!substantiveNegativePattern.test(caveat)&&records.length===0;
  const critical=records.some(record=>record.severity==='critical');
  const governance=records.some(record=>record.severity==='governance');
  const manualRegulatory=records.some(record=>record.severity==='regulatory');
  return {major:critical,critical,governance,regulatory:manualRegulatory||regulatoryRecords.some(record=>!record.reversed),limited,records,regulatoryRecords,audit,impact:impactDimensions(records)};
}

export const developerFlagDefinitions={
  major:{label:'重大公安／履約風險',description:'公安事故、無法依約完工、停工、信用貶落、信託重大異常或官方認定情節重大事件。'},
  governance:{label:'交易／治理風險',description:'重要交易資訊未揭露、信託或契約缺失、治理爭議等，嚴重度高於一般廣告裁處，但不等同工程公安事故。'},
  regulatory:{label:'公平會裁處紀錄',description:'以建商完整公司名稱或已確認別名，逐筆比對公平會行政決定；廣告或交易資訊裁處不等同工程重大事故，已撤銷者另行標示。'},
  limited:{label:'資料有限，保守評分',description:'目前缺少足夠的跨案交付、品管、財務治理或售後證據，因此先採較保守分數；不是負面事件標籤。'},
};

export {developerRiskAuditMeta};
