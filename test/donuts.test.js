import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import pg from 'pg';
import {priceLists} from '../public/assets/price-list.js';
import {buildDonutProducts} from '../public/assets/donuts-data.js';

test('all 14 bonus variants use their regular price minus one and follow overrides', () => {
  const products = buildDonutProducts(priceLists);
  assert.equal(products.length, 14);
  assert.equal(products.find(p => p.sourceRow === 2).bonusAmount, 498);
  assert.equal(products.find(p => p.sourceRow === 691).bonusAmount, 428);
  for (const p of products) {
    const original = Object.values(priceLists[p.platform]).flat().find(x => x.sourceRow === p.sourceRow);
    assert.equal(p.bonusAmount + p.amount, original.priceRub);
    assert.equal(p.amount, 1);
  }
  const changed = structuredClone(priceLists);
  changed.Fortnite['Турция'].find(p => p.sourceRow === 2).priceRub = 750;
  assert.equal(buildDonutProducts(changed).find(p => p.sourceRow === 2).bonusAmount, 749);
});

test('bonus SQL: thresholds, expiry, FIFO, insufficient funds, duplicate orders and migration rerun',
  {skip:!process.env.TEST_DATABASE_URL && !process.env.TEST_PGLITE_MODULE}, async () => {
  let db, admin, schema;
  if (process.env.TEST_PGLITE_MODULE) {
    const {PGlite} = await import(process.env.TEST_PGLITE_MODULE);
    db = new PGlite();
  } else {
    schema = 'bonus_test_' + randomBytes(8).toString('hex');
    admin = new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});
    await admin.query(`CREATE SCHEMA "${schema}"`);
    db = new pg.Pool({connectionString:process.env.TEST_DATABASE_URL, options:`-c search_path=${schema}`});
  }
  const sql = await readFile(new URL('../bonus.sql', import.meta.url),'utf8');
  const exec = s => db.exec ? db.exec(s) : db.query(s);
  const balance = async () => Number((await db.query("SELECT bonus_balance FROM users WHERE id='u'")).rows[0].bonus_balance);
  try {
    await exec(await readFile(new URL('../schema.sql', import.meta.url),'utf8'));
    await db.query("INSERT INTO users(id,email,password_hash,bonus_balance) VALUES('u','bonus@example.test','unused',10)");
    await exec(sql);
    await exec(sql);
    assert.equal(await balance(),10);
    const pay = (id,rub,bonus=0) => db.query('INSERT INTO sales_orders(id,user_id,rub_amount,bonus_amount) VALUES($1,$2,$3,$4)',[id,'u',rub,bonus]);
    await pay('small',499);
    assert.equal(await balance(),24.97);
    await pay('edge',999.99);
    assert.equal(await balance(),54.97);
    await pay('large',1000);
    assert.equal(await balance(),104.97);
    await assert.rejects(pay('large',1000));
    assert.equal(await balance(),104.97);
    await db.query("UPDATE bonus_lots SET expires_at=NOW()-INTERVAL '1 second' WHERE order_id='small'");
    await db.query("SELECT expire_user_bonuses('u')");
    assert.equal(await balance(),90);
    await db.query("UPDATE bonus_lots SET expires_at=NOW()+INTERVAL '1 day' WHERE order_id='edge'");
    await pay('redeem',1,25);
    assert.equal(await balance(),65);
    assert.equal(Number((await db.query("SELECT remaining FROM bonus_lots WHERE order_id='edge'")).rows[0].remaining),5);
    await assert.rejects(pay('too-much',1,66));
    assert.equal(await balance(),65);
    assert.equal((await db.query("SELECT id FROM sales_orders WHERE id='too-much'")).rows.length,0);
    await db.query("UPDATE users SET bonus_balance=200 WHERE id='u'");
    assert.equal(await balance(),200);
    await db.query("UPDATE users SET bonus_balance=12 WHERE id='u'");
    assert.equal(await balance(),12);
    await exec(sql);
    assert.equal(await balance(),12);
    await db.query("UPDATE bonus_lots SET expires_at=NOW()-INTERVAL '1 second' WHERE user_id='u'");
    await db.query("SELECT expire_user_bonuses('u')");
    assert.equal(await balance(),0);
    await exec(sql);
    assert.equal(await balance(),0);
  } finally {
    if (db.close) await db.close(); else await db.end();
    if (admin) {await admin.query(`DROP SCHEMA "${schema}" CASCADE`);await admin.end();}
  }
});
