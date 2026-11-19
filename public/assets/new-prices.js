export const newPrices = {"Honkai: Star Rail":{"Автопополнение":[{"label":"60 Oneiric Shards","priceRub":109.0,"sourceRow":11138},{"label":"Express Supply Pass","priceRub":519.0,"sourceRow":11139},{"label":"300+30 Oneiric Shards","priceRub":519.0,"sourceRow":11140},{"label":"980+110 Oneiric Shards","priceRub":1549.0,"sourceRow":11141},{"label":"1980+260 Oneiric Shards","priceRub":3099.0,"sourceRow":11142},{"label":"3280+600 Oneiric Shards","priceRub":5199.0,"sourceRow":11143},{"label":"6480+1600 Oneiric Shards","priceRub":10399.0,"sourceRow":11144}]},"ExitLag":{"Tier 1":[{"label":"ExitLag tier 1 - 1 месяц","priceRub":739.0,"sourceRow":11145},{"label":"ExitLag tier 1 - 6 месяцев","priceRub":3249.0,"sourceRow":11146},{"label":"ExitLag tier 1 - 12 месяцев","priceRub":5579.0,"sourceRow":11147}],"Tier 2":[{"label":"ExitLag tier 2 - 1 месяц","priceRub":549.0,"sourceRow":11148},{"label":"ExitLag tier 2 - 3 месяца","priceRub":1299.0,"sourceRow":11149},{"label":"ExitLag tier 2 - 12 месяцев","priceRub":3999.0,"sourceRow":11150}],"Tier 3":[{"label":"ExitLag tier 3 - 1 месяц","priceRub":379.0,"sourceRow":11151},{"label":"ExitLag tier 3 - 3 месяца","priceRub":869.0,"sourceRow":11152},{"label":"ExitLag tier 3 - 12 месяцев","priceRub":2749.0,"sourceRow":11153}]},"Fortnite":{"Fortnite Gift Card · Европа":[{"label":"EUR 10 Fortnite gift card","priceRub":1149.0,"sourceRow":11433},{"label":"EUR 25 Fortnite gift card","priceRub":2899.0,"sourceRow":11434},{"label":"EUR 50 Fortnite gift card","priceRub":5829.0,"sourceRow":11435},{"label":"EUR 100 Fortnite gift card","priceRub":11599.0,"sourceRow":11436}],"Fortnite Gift Card · Великобритания":[{"label":"GBP 10 Fortnite gift card","priceRub":1399.0,"sourceRow":11437},{"label":"GBP 20 Fortnite gift card","priceRub":2799.0,"sourceRow":11438},{"label":"GBP 40 Fortnite gift card","priceRub":5599.0,"sourceRow":11439},{"label":"GBP 75 Fortnite gift card","priceRub":10499.0,"sourceRow":11440}],"Fortnite Gift Card · Америка":[{"label":"USD 15 Fortnite gift card","priceRub":1529.0,"sourceRow":11441},{"label":"USD 25 Fortnite gift card","priceRub":2629.0,"sourceRow":11442},{"label":"USD 30 Fortnite gift card","priceRub":3079.0,"sourceRow":11443},{"label":"USD 50 Fortnite gift card","priceRub":5249.0,"sourceRow":11444},{"label":"USD 75 Fortnite gift card","priceRub":7899.0,"sourceRow":11445},{"label":"USD 100 Fortnite gift card","priceRub":10499.0,"sourceRow":11446},{"label":"USD 150 Fortnite gift card","priceRub":110879.0,"sourceRow":11447}]}};

// Updated Fortnite gift card prices, grouped by activation region.
const fortniteUpdates = {
 'Европа':['EUR',[[10,1139],[25,2849],[50,5699],[100,11429]]],
 'Великобритания':['GBP',[[10,1369],[20,2739],[40,5479],[75,10279]]],
 'Америка':['USD',[[15,1529],[25,2609],[30,3079],[50,5269],[75,7849],[100,10499]]],
 'Франция':['EUR',[[10,1179],[15,1779],[20,2279],[25,2849],[30,3429],[40,4559],[50,5699],[75,8549],[100,11429],[125,14279],[150,17149]]],
 'Германия':['EUR',[[10,1179],[15,1779],[20,2279],[25,2849],[30,3429],[40,4569],[50,5699],[75,8549],[100,11429],[125,14279],[150,17149]]],
 'Швеция':['SEK',[[150,1529],[200,2229],[250,2799],[300,3079],[400,4479],[500,5599],[750,7699],[1000,10249],[1250,12829],[1500,15399]]],
 'Швейцария':['CHF',[[10,1229],[15,1849],[20,2459],[25,3079],[30,3699],[40,4939],[50,6179],[75,9279],[100,12369],[125,15459],[150,18549]]],
 'Ирландия':['EUR',[[10,1129],[15,1699],[20,2279],[25,2849],[30,3429],[40,4569],[50,5699],[75,8549],[100,11429],[125,14279],[150,17149]]],
 'Норвегия':['NOK',[[150,1679],[200,2229],[250,2799],[300,3349],[400,4479],[500,5599],[750,8399],[1000,11199],[1250,13999],[1500,16799]]]
};
let fortniteSourceRow=40000;
for(const [region,[currency,entries]] of Object.entries(fortniteUpdates)){
 const key='Fortnite Gift Card · '+region;
 const existing=newPrices.Fortnite[key]||[];
 for(const [amount,priceRub] of entries){
  const item=existing.find(x=>x.label===`${currency} ${amount} Fortnite gift card`);
  if(item)item.priceRub=priceRub;
  else existing.push({label:`${currency} ${amount} Fortnite gift card`,priceRub,sourceRow:fortniteSourceRow++});
 }
 newPrices.Fortnite[key]=existing;
}

newPrices['Steam Gifts'] ||= {};
for (const [index,region] of ['Аргентина','Бразилия','Канада','Чили','Китай','Гонконг','Индия','Япония','Казахстан','Россия','ЮАР','Турция','Украина','Америка'].entries()) {
 newPrices['Steam Gifts']['Steam Автореги · '+region] = [{label:'Steam авто-регистрация · '+region,priceRub:49,sourceRow:41000+index}];
}

// PlayStation prices from the supplied workbook, retail-price column.
newPrices['PlayStation Store'] ||= {};
for(const [region,currency,items] of [
 ['Великобритания','GBP',[[10,1299],[20,2499],[40,4999],[50,6349],[70,8429],[100,11999],[120,14399],[150,19429],[200,24449]]],
 ['Индонезия','IDR',[[100000,549],[225000,1279],[300000,1699],[600000,3449],[1000000,5749],[1500000,8599]]]
]) {
 const start=region==='Великобритания'?42000:42009;
 newPrices['PlayStation Store'][region]=items.map(([amount,priceRub],i)=>({label:`ps ${region} ${amount} ${currency}`,priceRub,sourceRow:start+i}));
}
