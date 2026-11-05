import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isAutoDelivery,autoItems} from '../public/assets/auto-topup.js';
import {getActivationGuide} from '../public/assets/activation-guides.js';
import {priceLists} from '../public/assets/price-list.js';
test('automatic top-ups exclude codes and retain workbook prices',()=>{
 assert.equal(isAutoDelivery('PUBG Mobile',['PUBG Mobile','Global','Коды']),false);
 assert.equal(isAutoDelivery('PUBG Mobile',['PUBG Mobile','Global','Автопополнение']),true);
 assert.equal(isAutoDelivery('PUBG Mobile',['PUBG: Battlegrounds']),false);
 assert.equal(isAutoDelivery('Free Fire',['Коды · Global']),false);
 assert.equal(isAutoDelivery('Free Fire',['Автопополнение · СНГ']),true);
 assert.equal(isAutoDelivery('Marvel Rivals',[]),true);
 const free=autoItems('Free Fire',priceLists);assert.ok(free.length);assert.ok(free.every(x=>x.group==='Автопополнение СНГ'&&x.priceRub>0));
 const pubg=autoItems('PUBG Mobile',priceLists);assert.ok(pubg.some(x=>x.group==='Global'));assert.ok(pubg.some(x=>x.group==='СНГ'));assert.ok(pubg.every(x=>['Global','СНГ'].includes(x.group)));
});
test('activation instructions follow the selected product branch',()=>{
 assert.equal(getActivationGuide('Xbox',[]),null);
 assert.match(getActivationGuide('Xbox',['Подписка Xbox']).join(' '),/Microsoft/);
 assert.match(getActivationGuide('PUBG Mobile',['PUBG: Battlegrounds']).join(' '),/лобби/);
 assert.match(getActivationGuide('PUBG Mobile',['PUBG Mobile','Global','Коды']).join(' '),/midasbuy/);
 assert.equal(getActivationGuide('PUBG Mobile',['PUBG Mobile','СНГ']),null);
 assert.match(getActivationGuide('Nintendo',['Подписка']).join(' '),/ec.nintendo/);
 assert.match(getActivationGuide('Nintendo',['Подарочная карта']).join(' '),/eShop/);
 assert.match(getActivationGuide('Amazon',[]).join(' '),/региона/);
});
