import { matureIntegratedProjects } from './generated/mature-integrated-projects.js';
import { matureRegistryProjects } from './generated/mature-registry-projects.js';
import { findDeveloperResearch,isNonBuilderRole } from './developer-research.js';

const lineStations={
  R:'象山、台北101/世貿、信義安和、大安、大安森林公園、東門、中正紀念堂、台大醫院、台北車站、中山、雙連、民權西路、圓山、劍潭、士林、芝山、明德、石牌、唭哩岸、奇岩、北投、新北投、復興崗、忠義、關渡、竹圍、紅樹林、淡水',
  G:'新店、新店區公所、七張、小碧潭、大坪林、景美、萬隆、公館、台電大樓、古亭、中正紀念堂、小南門、西門、北門、中山、松江南京、南京復興、台北小巨蛋、南京三民、松山',
  O:'南勢角、景安、永安市場、頂溪、古亭、東門、忠孝新生、松江南京、行天宮、中山國小、民權西路、大橋頭、台北橋、菜寮、三重、先嗇宮、頭前庄、新莊、輔大、丹鳳、迴龍、三重國小、三和國中、徐匯中學、三民高中、蘆洲',
  BL:'頂埔、永寧、土城、海山、亞東醫院、府中、板橋、新埔、江子翠、龍山寺、西門、台北車站、善導寺、忠孝新生、忠孝復興、忠孝敦化、國父紀念館、市政府、永春、後山埤、昆陽、南港、南港展覽館',
  BR:'動物園、木柵、萬芳社區、萬芳醫院、辛亥、麟光、六張犁、科技大樓、大安、忠孝復興、南京復興、中山國中、松山機場、大直、劍南路、西湖、港墘、文德、內湖、大湖公園、葫洲、東湖、南港軟體園區、南港展覽館',
  Y:'大坪林、十四張、秀朗橋、景平、景安、中和、橋和、中原、板新、板橋、新埔民生、頭前庄、幸福、新北產業園區',
};
const stationLines={};
for(const [line,names] of Object.entries(lineStations)){
  for(const station of names.split('、'))(stationLines[station]??=[]).push(line);
}

const verifiedExisting=matureIntegratedProjects
  .map(project=>({...project,lines:stationLines[project.station]||[]}));

const existingNames=new Set(verifiedExisting.map(project=>project.name.replace(/[・。\s]/g,'')));
// These registry rows are the same projects as richer, independently verified
// records above, but their exported names contain damaged glyphs and therefore
// cannot be caught by the generic normalized-name check.
const verifiedRegistryDuplicates=new Set(['崧?']);
// Commercial-only projects do not belong in the residential shortlist even if
// their source row was exported through the same pre-sale registry pipeline.
const excludedNonResidentialNames=new Set(['奧斯卡內湖舊宗商辦案']);
const rawMatureProjects=[
  ...verifiedExisting,
  ...matureRegistryProjects
    .filter(project=>!excludedNonResidentialNames.has(project.name)&&!verifiedRegistryDuplicates.has(project.name)&&!existingNames.has(project.name.replace(/[・。\s]/g,'')))
    .map(project=>({...project,lines:project.lines?.length?project.lines:(stationLines[project.station]||[])})),
];

// Registry CSV exports replace a number of uncommon Unicode glyphs with "?".
// Apply only verified corrections; unresolved glyphs remain explicitly marked for review.
const verifiedTextCorrections=new Map(Object.entries({
  '宏築天?':'宏築天蘊','綠野心?':'綠野心瀞','力銘?埕':'力銘裏埕','三磐橋?':'三磐橋峯',
  '大安謙?':'大安謙韵','真?和光':'真実和光','連雲玥?':'連雲玥恒','敦南詠?':'敦南詠楽',
  '?山':'裏山','?白':'瑠白','睿泰?':'睿泰絵。','漢皇城?':'漢皇城双','震大懷?':'震大懷真',
  '岳泰峰?':'岳泰峰碩','怡富景?':'怡富景絵','首泰大?':'首泰大喆','豐?':'豐琙',
  '日健?':'日健邸','新濠一?':'新濠一邸','家?美':'家悦美','晴山?6期':'晴山滙6期',
  '久年??':'久年橒画','偉鉅中山?匯':'偉鉅中山双匯','寶亞世界公?':'寶亞世界公舘',
  '樹里?':'樹里画','三輝敦?':'三輝敦画',
  '中?中央廣場、??':'中悅中央廣場、栢悅','松江?阡語':'松江阡語',
  '寶亞新公?':'寶亞新公舘','幸福?':'幸福の駅','晴山?V期四季莊園':'晴山滙V四季莊園',
  '晴山?III期-香緹花園':'晴山滙III期-香緹花園','森原樹?樹之丘':'森原樹．樹之丘',
  '?達土地開發股份有限公司':'堃達土地開發股份有限公司',
  '備查起造人：?達土地開發股份有限公司':'備查起造人：堃達土地開發股份有限公司',
  '?正利建設股份有限公司':'双正利建設股份有限公司',
  '備查起造人：?正利建設股份有限公司':'備查起造人：双正利建設股份有限公司',
  '(山秦)盛建設股份有限公司':'𡻈盛建設股份有限公司',
  '備查起造人：(山秦)盛建設股份有限公司':'備查起造人：𡻈盛建設股份有限公司',
  '台北市北投區公?路255巷1弄11號1樓':'台北市北投區公館路255巷1弄11號1樓',
  '台北市北投區公?路326巷11號2樓共8筆':'台北市北投區公館路326巷11號2樓共8筆',
  '台北市萬華區糖?里大理街135號 共4筆':'台北市萬華區糖廍里大理街135號 共4筆',
  '松江桓?':'松江．桓榀',
}));
const verifiedProjectBuilderCorrections=new Map([
  ['?暘城中央','備查起造人：咊暘建設股份有限公司'],
  ['文心慕慕','備查起造人：北碁建設股份有限公司（文心建設）'],
  ['璽來登帝璽','共同投資興建：家悦開發地產有限公司、家聖建設開發股份有限公司'],
  ['宏道豐?','投資興建：豐滙建設開發股份有限公司'],
  ['捷韻富境','備查起造人：冠亘建設有限公司'],
  ['?和心','備查起造人：龍瑩建設事業股份有限公司'],
  ['好植','共同投資興建：富時代地產開發股份有限公司、寶和建設股份有限公司'],
  ['和典永峰','共同投資興建：誠毅建設股份有限公司、誠新國際開發股份有限公司（和典建設機構）'],
  ['雙捷萃','共同投資興建：陣屋建設股份有限公司、廷豪建設股份有限公司'],
  ['宏道仁?','投資興建：豐滙建設開發股份有限公司／森鉅建設股份有限公司'],
  ['文昌匯','備查起造人：瑝益實業有限公司／宏信建設股份有限公司'],
  ['友座大學之道','備查起造人：住欣建設股份有限公司（友座機構）'],
  ['松捷樂','花樣有限公司（投資興建）'],
  ['青琉','備查起造人：双華建設股份有限公司'],
  ['耕玥','備查起造人：恒緯建設有限公司'],
  ['家?美','備查起造人：家悅建設股份有限公司'],
  ['璽來登日朗','備查起造人：家悅建設股份有限公司／家偉開發事業股份有限公司／家聖建設開發股份有限公司'],
  ['中?中央廣場、??','備查起造人：中悅建設開發股份有限公司'],
  ['京東賞','共同投資興建：駿華開發建設股份有限公司／忠碩不動產股份有限公司'],
  ['聿德觀璟','備查起造人：聿德企業股份有限公司（統編 83413800）'],
]);
const verifiedProjectNameCorrections=new Map([
  ['?暘城中央','咊暘城中央'],
  ['宏道豐?','宏道豐滙'],
  ['?和心','龍瑩双和心'],
  ['宏道仁?','宏道仁滙'],
  ['輕山?','輕山敘'],
  ['成華織心?','成華織心画'],
  ['鴻華天?','鴻華天滙'],
]);
const repairRegistryText=value=>{
  if(typeof value!=='string'||!/[?？]/.test(value))return value;
  const verified=verifiedTextCorrections.get(value);
  if(verified)return verified;
  const readable=value.replace(/[?？]+/g,'').replace(//g,'').trim();
  return `${readable||'名稱'}（缺字待核）`;
};
const visibleTextFields=['name','builder','district','station','address','status','completion','type','size','price','source','locationAccuracy'];
export const matureProjects=rawMatureProjects.map(project=>{
  const repaired={...project,id:String(project.id).replace(/[?？]+/g,'missing')};
  repaired.name=verifiedProjectNameCorrections.get(project.name)||repaired.name;
  repaired.builder=verifiedProjectBuilderCorrections.get(project.name)||repaired.builder;
  for(const field of visibleTextFields)repaired[field]=repairRegistryText(repaired[field]);
  const research=findDeveloperResearch(repaired.builder);
  if(research){
    repaired.rating=research.rating;
    repaired.ratingBasis=research.score==null?`建商研究已覆核（${research.reviewed}）：${research.caveat}`:`建商研究 ${research.score} 分（基礎 ${research.baseScore} − 風險調整 ${research.riskAdjustment}；${research.reviewed} 覆核）`;
  }else if(isNonBuilderRole(repaired.builder)){
    repaired.rating='NA';
    repaired.ratingBasis='不適用建商評等：備查起造人為建經、銀行、政府、更新會、公益財團法人、自然人或尚待選定實施者，不直接視為住宅品牌';
  }else if(repaired.rating!=='NR'){
    repaired.rating='NR';
    repaired.ratingBasis='待評估：尚未完成一致口徑的公司級公開資料查核，不以品牌名稱或案量推定等級';
  }
  return repaired;
});
