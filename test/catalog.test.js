import {test} from 'node:test';
import assert from 'node:assert/strict';
import {catalog,allProducts} from '../public/assets/catalog-data.js';
const labels=xs=>xs.map(x=>x.label);
const choice=(node,label)=>node.children.find(x=>x.label===label);
test('catalog contains the specified regional and product selection paths',()=>{
 assert.equal(allProducts.length,27);
 assert.deepEqual(labels(catalog.Fortnite.children),['Россия','Украина']);
 assert.equal(choice(catalog.Fortnite,'Россия').children.length,10);
 assert.deepEqual(labels(choice(catalog.Valorant,'Турция').children),['325 VP','825 VP','1700 VP','2925 VP','4325 VP','8900 VP']);
 const mobile=choice(catalog['PUBG Mobile'],'PUBG Mobile');
 const global=choice(mobile,'Global');
 assert.equal(choice(global,'Коды').children[8].label,'32400 UC');
 assert.equal(choice(global,'Автопополнение').children[8].label,'32800 UC');
 assert.equal(choice(mobile,'СНГ').children.length,8);
 assert.equal(choice(catalog.Minecraft,'Dungeons').children.length,2);
 assert.equal(choice(choice(catalog['Electronic Arts'],'EA Sports FC'),'EA Sports FC 26').children.length,5);
 assert.equal(choice(catalog.Xbox,'Подарочная карта').children.length,9);
 assert.equal(choice(choice(catalog.Xbox,'Подарочная карта'),'Турция').pending,true);
 assert.equal(new Set(labels(catalog.Amazon.children)).size,catalog.Amazon.children.length);
 assert.equal(catalog['Free Fire'].children[1].children.length,10);
 for(const name of Object.keys(catalog))assert.ok(allProducts.includes(name),name);
});

test('requested catalog removals stay scoped to their categories',()=>{
 const battle=choice(catalog['Battle.net'],'Подарочные карты');
 assert.equal(choice(battle,'Канада'),undefined);
 assert.equal(choice(battle,'Мексика'),undefined);
 assert.ok(choice(choice(catalog['Battle.net'],'World of Warcraft 60 Days Time Card'),'Канада'));
 assert.equal(choice(catalog['Steam Gifts'],'Польша'),undefined);
 assert.equal(choice(catalog['Steam Gifts'],'Великобритания'),undefined);
 assert.ok(choice(catalog.Steam,'Польша'));
 assert.equal(choice(choice(catalog.Nintendo,'Подписка'),'Чехия'),undefined);
 assert.equal(choice(catalog['Electronic Arts'],'The Sims 4'),undefined);
 assert.equal(choice(choice(catalog['Electronic Arts'],'EA Sports FC'),'EA Sports FC 24'),undefined);
});
