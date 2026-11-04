// Clean supplier descriptions for display without changing product identity or price.
export function displayProductName(product, item, path=[]){
 let value=item.label;
 if(!item.sourceRow)return value;
 value=value.replace(/^(?:xbox\s+gift|xbox\s+game\s+pass|nintendo\s+(?:gift|подписка)|google\s+play|google|steam\s+gift|playstation\s+store|ps|apple|amazon|netflix|riot|openai\s+chatgpt|robux|battle\s*net|batlle\s*net|marvel\s+rivals|pubg\s+mobile|pubg\s+battlefrounds|apex\s+legends|standoff|free\s+fire\s+снг\s*:|free\s+fire\s+код\s+global)\s*/i,'');
 value=value.replace(/^VB\s+(\d+).*$/i,'$1 В-баксов').replace(/^VP\s+(\d+).*$/i,'$1 VP');
 if(product==='Xbox'&&/game pass/i.test(item.label))value='Game Pass '+value;
 if(product==='Roblox')value=value.replace(/\bglobal\b/i,'').trim()+' Robux';
 const regions=['саудовская аравия','арабские эмираты','великобритания','новая зеландия','казахстан','индонезия','филиппины','нидерланды','аргентина','австралия','вьетнам','малайзия','германия','франция','бразилия','испания','италия','сингапур','колумбия','америка','польша','польши','мексика','украина','беларусь','россия','турция','европа','япония','канада','гонконг','египет','индия','тайланд','таиланд','чехия','юар'];
 for(const region of regions)value=value.replace(new RegExp('(^|\\s)'+region+'(?=\\s|$)','ig'),' ');
 value=value.replace(/\bTRYY\b/ig,'TRY').replace(/\bglobal\b/ig,' ').replace(/\s+автовыдача(?=\s|$)/ig,' ').replace(/\s+/g,' ').trim();
 return value||item.label;
}
