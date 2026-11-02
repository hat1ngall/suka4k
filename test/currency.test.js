import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

test('Steam presets update amounts and currency labels when region changes',async()=>{
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 const match=html.match(/let presetCurrency=null;function updateCurrency\(\)\{[^\n]+\}/);assert.ok(match,'currency update function is present');
 let rawAmount='1000';const platform={value:'Steam'},region={value:'RUB'},amount={get value(){return rawAmount},set value(value){rawAmount=String(value)}},label={textContent:''},sign={textContent:''};
 const buttons=Array.from({length:4},()=>({dataset:{},textContent:'',classList:{active:false,toggle(name,value){if(name==='active')this.active=value}}}));
 const nodes={'#platform':platform,'#region':region,'#amount':amount,'#currency-label':label,'#currency-sign':sign};
 const context={document:{querySelector:key=>nodes[key],querySelectorAll:()=>buttons},currencySigns:{RUB:'₽',KZT:'₸',UAH:'₴'}};
 vm.runInNewContext(match[0]+';globalThis.applyCurrency=updateCurrency;',context);
 const check=(currency,expected,selected,symbol)=>{region.value=currency;context.applyCurrency();assert.deepEqual(buttons.map(x=>Number(x.dataset.amount)),expected);assert.equal(amount.value,String(selected));assert.equal(sign.textContent,symbol);assert.equal(buttons.find(x=>x.classList.active).dataset.amount,String(selected))};
 check('RUB',[500,1000,2500,5000],1000,'₽');check('KZT',[3000,6000,14000,28000],6000,'₸');check('UAH',[300,600,1400,2800],600,'₴');check('RUB',[500,1000,2500,5000],1000,'₽');
});
