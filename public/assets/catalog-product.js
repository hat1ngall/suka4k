// Clean supplier descriptions for display without changing product identity or price.
export function displayProductName(product, item, path=[]){
 let value=item.label;
 if(!item.sourceRow)return value;
 value=value.replace(/^(?:xbox\s+gift|xbox\s+game\s+pass|nintendo\s+(?:gift|подписка)|google\s+play|google|steam\s+gift|playstation\s+store|ps|apple|amazon|netflix|riot|openai\s+chatgpt|robux|battle\s*net|batlle\s*net|marvel\s+rivals|pubg\s+mobile|pubg\s+battlefrounds|apex\s+legends|standoff|free\s+fire\s+снг\s*:|free\s+fire\s+код\s+global)\s*/i,'');
 if(product==='Arena Breakout')value=value.replace(/^Arena Breakout:\s*/i,'');
 if(product==='GearUP Booster PC')value=value.replace(/^GearUP Booster PC:\s*/i,'').replace(/\bmonths?\b/i,'мес.');
 value=value.replace(/^VB\s+(\d+).*$/i,'$1 В-баксов').replace(/^VP\s+(\d+).*$/i,'$1 VP');
 if(product==='Xbox'&&/game pass/i.test(item.label))value='Game Pass '+value;
 if(product==='Roblox')value=value.replace(/\bglobal\b/i,'').trim()+' Robux';
 const regions=['саудовская аравия','арабские эмираты','великобритания','новая зеландия','казахстан','индонезия','филиппины','нидерланды','аргентина','австралия','вьетнам','малайзия','германия','франция','бразилия','испания','италия','сингапур','колумбия','америка','польша','польши','мексика','украина','беларусь','россия','турция','европа','япония','канада','гонконг','египет','индия','тайланд','таиланд','чехия','юар'];
 for(const region of regions)value=value.replace(new RegExp('(^|\\s)'+region+'(?=\\s|$)','ig'),' ');
 value=value.replace(/\bTRYY\b/ig,'TRY').replace(/\bglobal\b/ig,' ').replace(/автовыдача/ig,' ').replace(/\bauto\b/ig,' ').replace(/\s+/g,' ').trim();
 value=value.replace(/\b(BRL|USD|EUR|GBP|TRY|PLN|JPY|KZT|UAH|RUB|SAR|AED|AUD|CAD|IDR|INR|MXN|COP|CHF|SGD|ZAR|PHP|MYR|THB|HKD|NZD)\s+(\d+(?:[.,]\d+)?)/gi,(_,currency,amount)=>amount+' '+currency.toUpperCase());
 return value||item.label;
}
