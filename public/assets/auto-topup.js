export function isAutoDelivery(product,path=[]){
 if(['Marvel Rivals','Honkai: Star Rail','Zenless Zone Zero'].includes(product))return true;
 if(product==='Free Fire')return path.includes('Автопополнение · СНГ');
 return product==='PUBG Mobile'&&path[0]==='PUBG Mobile'&&(path.includes('СНГ')||path.includes('Автопополнение'));
}
export function autoItems(product,lists){
 const groups=lists[product]||{};
 return Object.entries(groups).filter(([group])=>product==='Free Fire'?group==='Автопополнение СНГ':product==='PUBG Mobile'?['СНГ','Global'].includes(group):['Marvel Rivals','Honkai: Star Rail','Zenless Zone Zero'].includes(product)).flatMap(([group,items])=>items.map(item=>({...item,group})));
}
