import {test} from 'node:test';
import assert from 'node:assert/strict';
import {priceLists} from '../public/assets/price-list.js';

test('price list preserves product, region, denomination and price',()=>{
 const region=(product,name)=>priceLists[product][name];
 assert.equal(region('Valorant','Россия').find(x=>x.label==='VP 240 россия').priceRub,249);
 assert.equal(region('Fortnite','Турция').find(x=>x.label==='VB 800 турция').priceRub,499);
 assert.deepEqual(region('PlayStation Store','Великобритания').map(x=>x.priceRub),[1299,2499,4999,6349,8429,11999,14399,19429,24449]);
 assert.deepEqual(region('PlayStation Store','Индонезия').map(x=>x.priceRub),[549,1279,1699,3449,5749,8599]);
 assert.equal(region('Apex Legends','Xbox').find(x=>x.label==='apex legends xbox 1000').priceRub,879);
 assert.equal(region('Apex Legends','PC').find(x=>x.label==='apex legends pc 1000').priceRub,1229);
 assert.deepEqual(region('Google Play','Япония').filter(x=>x.label.toLowerCase()==='google play япония jpy 1000').map(x=>x.priceRub),[679]);
 assert.ok(Object.values(priceLists).flatMap(Object.values).flat().every(x=>Number.isFinite(x.priceRub)&&x.priceRub>0));
});
