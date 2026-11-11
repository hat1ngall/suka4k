import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyItemPrices} from '../public/assets/item-prices.js';
import {autoItems} from '../public/assets/auto-topup.js';
import {buildPricedCatalog} from '../public/assets/catalog-priced.js';
test('saved item prices update catalog and auto top-up without affecting other items',async()=>{const original=globalThis.fetch;globalThis.fetch=async()=>({ok:true,json:async()=>({prices:[{product_name:'Free Fire',source_row:12,price_rub:'777.00'}]})});try{const lists={'Free Fire':{'Автопополнение СНГ':[{label:'Free Fire CIS: 100 diamonds',sourceRow:12,priceRub:100},{label:'Free Fire CIS: 200 diamonds',sourceRow:13,priceRub:200}]}};await applyItemPrices(lists);assert.equal(autoItems('Free Fire',lists)[0].priceRub,777);assert.equal(autoItems('Free Fire',lists)[1].priceRub,200);const root=buildPricedCatalog('Free Fire',{title:'Free Fire',children:[]},lists);assert.equal(root.children[0].children[0].priceRub,777)}finally{globalThis.fetch=original}});
