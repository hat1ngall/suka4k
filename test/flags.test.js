import {test} from 'node:test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {catalog} from '../public/assets/catalog-data.js';
import {flagCodes,flagForRegion} from '../public/assets/region-flags.js';

test('every used region has a local flag and product variants do not',async()=>{
 for(const code of new Set(Object.values(flagCodes)))await access(new URL('../public/assets/flags/'+code+'.svg',import.meta.url));
 for(const name of ['Россия','Украина','Беларусь','Турция','Европа','Америка','ЮАР','Бразилия','Саудовская Аравия','Великобритания','Гонконг','Польша','Индия','Япония','Мексика','Индонезия','Франция','Испания','Арабские Эмираты','Германия','Канада','Египет','Австралия','Новая Зеландия','Колумбия','Чехия','Нидерланды','Италия','Вьетнам','Малайзия','Филиппины','Таиланд','Сингапур','Аргентина','Глобал','Global','СНГ'])assert.ok(flagForRegion(name),name);
 for(const node of catalog.Valorant.children)assert.ok(flagForRegion(node.label),node.label);
 assert.equal(flagForRegion('325 VP'),null);assert.equal(flagForRegion('Xbox'),null);assert.equal(flagForRegion('toString'),null);
});
