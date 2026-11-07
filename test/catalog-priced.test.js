import {test} from 'node:test';
import assert from 'node:assert/strict';
import {catalog} from '../public/assets/catalog-data.js';
import {priceLists} from '../public/assets/price-list.js';
import {buildPricedCatalog} from '../public/assets/catalog-priced.js';
const get=(node,...path)=>path.reduce((n,label)=>n?.children?.find(child=>child.label===label),node);
const priced=name=>buildPricedCatalog(name,catalog[name],priceLists);
const collect=node=>[...(node.sourceRow?[node.sourceRow]:[]),...(node.children||[]).flatMap(collect)];
test('prices appear in existing paths, with all spreadsheet entries accessible',()=>{
 for(const [name,groups] of Object.entries(priceLists)){
  const root=priced(name),expected=Object.entries(groups).filter(([group])=>name!=='League of Legends'||group!=='Регион не указан').flatMap(([,entries])=>entries).map(x=>x.sourceRow).sort((a,b)=>a-b),actual=collect(root).sort((a,b)=>a-b);
  assert.deepEqual(actual,expected,name);
  assert.equal(get(root,'Товары и цены'),undefined,name);
 }
 assert.equal(get(priced('Valorant'),'Россия','240 VP').priceRub,249);
 assert.equal(get(priced('Fortnite'),'Украина','2400 В-баксов').priceRub,1499);
 assert.equal(get(priced('PUBG Mobile'),'PUBG Mobile','Global','Коды','60 UC').priceRub,99);
 assert.equal(get(priced('PUBG Mobile'),'PUBG Mobile','Global','Автопополнение','325 UC').priceRub,499);
 assert.equal(get(priced('Apex Legends'),'EA PC','1000').priceRub,1229);
 assert.equal(get(priced('Apex Legends'),'Xbox','1000').priceRub,879);
 assert.equal(get(priced('Minecraft'),'Валюта','1720').priceRub,849);
 assert.equal(get(priced('Free Fire'),'Коды · Global','100+10 Diamonds').priceRub,99);
 assert.equal(get(priced('Electronic Arts'),'EA Sports FC','EA Sports FC 26','1050 FC Points').priceRub,849);
 assert.ok(get(priced('Apple'),'Польша').children.some(x=>x.sourceRow===295));
 assert.ok(get(priced('Nintendo'),'Подписка','Польша').children.some(x=>x.sourceRow===962));
 assert.ok(get(priced('Steam Gifts'),'Таиланд').children.length);
 assert.ok(get(priced('Steam'),'Подарочные карты','Таиланд').children.length);
 assert.ok(get(priced('Steam'),'Steam Автореги','Польша'));
 assert.equal(get(priced('Steam Gifts'),'Польша'),undefined);
});

test('League of Legends uses known currency regions and hides unspecified region selectors',()=>{const root=priced('League of Legends');for(const region of ['Европа','Новая Зеландия','Бразилия','Великобритания','Австралия','Канада'])assert.ok(get(root,region)?.children.length,region);assert.equal(get(root,'Регион не указан'),undefined);for(const entry of root.children)assert.ok(entry.children,entry.label)});
