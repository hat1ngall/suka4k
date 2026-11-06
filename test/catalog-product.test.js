import {test} from 'node:test';
import assert from 'node:assert/strict';
import {displayProductName} from '../public/assets/catalog-product.js';
test('supplier descriptions become readable without changing denominations',()=>{
 assert.equal(displayProductName('Fortnite',{label:'VB 1000 турция',sourceRow:2}),'1000 В-баксов');
 assert.equal(displayProductName('Google Play',{label:'google play турция турция TRYY 25',sourceRow:554}),'25 TRY');
 assert.equal(displayProductName('Xbox',{label:'xbox gift бразилия BRL 5',sourceRow:1}),'5 BRL');
 assert.equal(displayProductName('PUBG Mobile',{label:'pubg mobile автовыдача global 325',sourceRow:90}),'325');
 assert.equal(displayProductName('Xbox',{label:'xbox game pass ultimate 1 месяц япония',sourceRow:1016}),'Game Pass ultimate 1 месяц');
 assert.equal(displayProductName('Valorant',{label:'240 VP',sourceRow:11}),'240 VP');
});
