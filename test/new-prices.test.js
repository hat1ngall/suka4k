import {test} from 'node:test';
import assert from 'node:assert/strict';
import {catalog} from '../public/assets/catalog-data.js';
import {priceLists} from '../public/assets/price-list.js';
import {buildPricedCatalog} from '../public/assets/catalog-priced.js';
import {autoItems,isAutoDelivery} from '../public/assets/auto-topup.js';
import {getActivationGuide} from '../public/assets/activation-guides.js';
const choose=(node,label)=>node.children.find(x=>x.label===label);
test('new prices stay in the requested sections',()=>{
 assert.equal(catalog['Zenless Zone Zero'],undefined);
 assert.equal(priceLists['Zenless Zone Zero'],undefined);
 const fortnite=buildPricedCatalog('Fortnite',catalog.Fortnite,priceLists);
 const gift=choose(fortnite,'Fortnite Gift Card');
 assert.ok(choose(gift,'Европа').children.some(item=>item.priceRub===1149));
 assert.ok(choose(fortnite,'Россия'));
 const exitlag=buildPricedCatalog('ExitLag',catalog.ExitLag,priceLists);
 assert.ok(choose(exitlag,'Tier 1').children.some(item=>item.priceRub===739));
 for(const name of ['Honkai: Star Rail']){
  const items=autoItems(name,priceLists);assert.equal(items.length,7);assert.ok(items.every(item=>item.priceRub>0&&item.sourceRow>10000));
  assert.equal(isAutoDelivery(name,[]),true);
 }
});
test('additional activation instructions are available for the matching category',()=>{
 for(const name of ['Arena Breakout','ExitLag','GearUP Booster PC','Rockstar Games','Razer Gold','Rewarble','Eneba'])assert.ok(getActivationGuide(name)?.length,name);
});
