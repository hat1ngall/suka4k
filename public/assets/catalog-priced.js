// Integrate each spreadsheet entry into its normal product/category/region path.
const norm=value=>value.toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[™®]/g,'').replace(/\s+/g,' ').trim();
function branch(parent,label){
 parent.children ||= [];
 let child=parent.children.find(item=>norm(item.label)===norm(label));
 if(!child){child={label,children:[]};parent.children.push(child)}
 if(child.pending){delete child.pending;child.children=[]}
 child.children ||= [];
 return child;
}
function regionName(group,entry){
 const text=norm(entry.label);
 if(group.includes('Без указанного региона')){
  if(/\bpln\b/.test(text)&&/польш/.test(text))return 'Польша';
  if(/тайланд/.test(text))return 'Таиланд';
 }
 return group.replace(/^Подарочная карта · |^Подписка · /,'').replace(/^Global$/,'Глобал');
}
function route(root,product,group,entry){
 if(['GearUP Booster PC','Rockstar Games'].includes(product))return root;
 if(product==='Steam')return branch(branch(root,'Подарочные карты'),regionName(group,entry));
 if(product==='Fortnite'&&group.startsWith('Fortnite Gift Card · '))return branch(branch(root,'Fortnite Gift Card'),group.replace('Fortnite Gift Card · ',''));
 if(product==='ExitLag'&&/^Tier [123]$/.test(group))return branch(root,group);
 if(['Honkai: Star Rail','Zenless Zone Zero'].includes(product))return root;
 if(product==='PUBG Mobile'){
  if(group==='PUBG: Battlegrounds')return branch(root,'PUBG: Battlegrounds');
  const mobile=branch(root,'PUBG Mobile');
  if(group==='СНГ')return branch(mobile,'СНГ');
  const global=branch(mobile,'Global');
  return branch(global,group==='PUBG Mobile · Коды Global'?'Коды':'Автопополнение');
 }
 if(product==='Xbox'||product==='Nintendo'){
  const gift=group.startsWith('Подарочная карта · ');
  return branch(branch(root,gift?'Подарочная карта':product==='Xbox'?'Подписка Xbox':'Подписка'),regionName(group,entry));
 }
 if(product==='Battle.net')return branch(branch(root,'Подарочные карты'),regionName(group,entry));
 if(product==='Electronic Arts'){
  if(group!=='Без указанного региона')return branch(branch(root,'Подарочные карты'),regionName(group,entry));
  const s=norm(entry.label);
  if(s.includes('ea sports fc'))return branch(branch(root,'EA Sports FC'),'EA Sports FC 26');
  if(s.includes('battlefield'))return branch(root,'Battlefield 4');
  if(s.includes('split fiction'))return branch(root,'Split Fiction');
  return branch(root,'Star Wars Zero Company');
 }
 if(product==='Minecraft'){
  const s=norm(entry.label);
  return branch(root,s.includes('minecoins')?'Валюта':s.includes('dungeons')?'Dungeons':'Паки');
 }
 if(product==='Free Fire')return branch(root,group==='Коды Global'?'Коды · Global':'Автопополнение · СНГ');
 if(product==='Apex Legends')return branch(root,group==='PC'?'EA PC':group);
 if(['Marvel Rivals','Standoff 2','ChatGPT / OpenAI'].includes(product))return root;
 return branch(root,regionName(group,entry));
}
function keyFor(product,label){
 const s=norm(label);
 if(product==='Fortnite'||product==='Valorant'||product==='PUBG Mobile'||product==='Apex Legends'||product==='Marvel Rivals'||product==='Standoff 2'||product==='ChatGPT / OpenAI'||product==='Minecraft'&&(/minecoins/.test(s)||/^\d+$/.test(s))){
  const match=s.match(/\d+/);return match?'quantity:'+match[0]:null;
 }
 if(product==='Electronic Arts'&&/fc points/.test(s)){const match=s.match(/(\d+)\s*fc points/);return match?'points:'+match[1]:null}
 if(product==='Electronic Arts'&&s.includes('team of the year'))return 'team of the year';
 if(product==='Free Fire'){
  const diamonds=s.match(/(\d+)\s*\+\s*(\d+)\s*diamonds/);if(diamonds)return 'diamonds:'+diamonds[1]+'+'+diamonds[2];
  return s.replace(/^free fire\s*(?:cis|снг)\s*:\s*/,'').replace(/\s+(?:снг\s+)?автовыдача$/,'').trim();
 }
 return s;
}
function addEntries(target,product,entries){
 for(const entry of entries){
  const key=keyFor(product,entry.label);
  const candidates=key?target.children.filter(item=>!item.children&&!item.pending&&keyFor(product,item.label)===key):[];
  const existing=candidates.length===1&&!('priceRub' in candidates[0])?candidates[0]:null;
  if(existing){existing.priceRub=entry.priceRub;existing.sourceRow=entry.sourceRow}
  else target.children.push({...entry});
 }
}
export function buildPricedCatalog(product,base,lists){
 const root=JSON.parse(JSON.stringify(base||{title:product,children:[]}));
 for(const [group,entries] of Object.entries(lists[product==='Steam'?'Steam Gifts':product]||{}))for(const entry of entries){
  const target=route(root,product,group,entry);
  addEntries(target,product,[entry]);
 }
 return root;
}
