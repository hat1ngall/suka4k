import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, pbkdf2Sync } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { createApp } from '../app.js';
import { hashPassword, verifyPassword, normalizeEmail, validPassword } from '../auth.js';

test('password hashes are salted, checked and invalid input is rejected', async () => {
  const one = await hashPassword('strong-pass-123');
  const two = await hashPassword('strong-pass-123');
  assert.notEqual(one, two);
  assert.equal(await verifyPassword('strong-pass-123', one), true);
  assert.equal(await verifyPassword('wrong-password', one), false);
  assert.equal(await verifyPassword('anything', 'invalid'), false);
  assert.equal(normalizeEmail('  A@Example.com '), 'a@example.com');
  assert.equal(normalizeEmail('invalid'), null);
  assert.equal(validPassword('short'), false);
  const salt='0123456789abcdef0123456789abcdef'; let key=Buffer.from('imported-pass');
  for(let i=0;i<6;i++) key=pbkdf2Sync(key, `${salt}:${i}`, 100000, 32, 'sha256');
  const oldHash=`pbkdf2-sha256-chain6$100000$${salt}$${key.toString('hex')}`;
  assert.equal(await verifyPassword('imported-pass',oldHash), true);
  assert.equal(await verifyPassword('wrong-password',oldHash), false);
});

class FakePool {
  users = [];
  sessions = new Map();
  orders = [];
  async query(sql, params = []) {
    if(sql.startsWith('SELECT expire_user_bonuses'))return {rows:[]};
    if (sql.startsWith('INSERT INTO users')) {
      if (this.users.some(u => u.email === params[1])) throw Object.assign(new Error('duplicate'), {code: '23505'});
      const user = {id: params[0], email: params[1], password_hash: params[2], nickname: params[3]};
      this.users.push(user); return {rows: [user]};
    }
    if (sql.startsWith('SELECT id, email, nickname, password_hash')) {
      return {rows: this.users.filter(u => u.email === params[0]).map(u => ({...u, orders_count: this.orders.filter(o => o.user_id === u.id).length}))};
    }
    if (sql.startsWith('INSERT INTO sessions')) { this.sessions.set(params[0], params[1]); return {rows: []}; }
    if (sql.startsWith('SELECT u.id, u.email')) {
      const u = this.users.find(x => x.id === this.sessions.get(params[0]));
      return {rows: u ? [{id:u.id,email:u.email,nickname:u.nickname,bonus_balance:u.bonus_balance??0,orders_count:this.orders.filter(o => o.user_id === u.id).length}] : []};
    }
    if (sql.startsWith('SELECT COUNT(*)::integer AS total FROM sales_orders')) {
      return {rows: [{total: this.orders.filter(o => o.user_id === params[0]).length}]};
    }
    if (sql.startsWith('SELECT id, paid_at, rub_amount, bonus_amount')) {
      const mine = this.orders.filter(o => o.user_id === params[0]).sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at));
      const limit = params[1] ?? 51, offset = params[2] ?? 0;
      return {rows: mine.slice(offset, offset + limit)};
    }
    if (sql.startsWith('DELETE FROM sessions')) { this.sessions.delete(params[0]); return {rows: []}; }
    throw new Error(`Unexpected SQL: ${sql}`);
  }
}

async function scenario(pool) {
  let server = createApp(pool).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  let base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, data, cookie, origin = base) => fetch(base + path, {method:'POST', headers:{origin, ...(data ? {'content-type':'application/json'} : {}), ...(cookie ? {cookie} : {})}, ...(data ? {body:JSON.stringify(data)} : {})});
  try {
    const home = await fetch(base + '/'); assert.equal(home.status, 200); assert.match(await home.text(), /id="account-button"/);
    assert.equal((await fetch(base + '/home')).status, 200);
    assert.equal((await fetch(base + '/offer.html')).status, 200);
    assert.equal((await post('/api/auth/register', {email:'a@example.test',password:' pass word 123 ',nickname:'Player',consent:true}, null, 'https://evil.example')).status, 403);
    assert.equal((await post('/api/auth/register', {email:'a@example.test', password:' pass word 123 ', nickname:'Player'})).status, 400);
    assert.equal((await post('/api/auth/register', {email:'a@example.test', password:' pass word 123 ', nickname:'X', consent:true})).status, 400);
    let res = await post('/api/auth/register', {email:'A@example.test', password:' pass word 123 ', nickname:'Player', consent:true});
    assert.equal(res.status, 201);
    const created = await res.json(); assert.equal(created.user.email, 'a@example.test'); assert.equal(created.user.nickname, 'Player'); assert.equal(created.user.orders_count, 0);
    const cookie = res.headers.get('set-cookie').split(';')[0];
    assert.equal((await fetch(base + '/api/orders')).status, 401);
    if (pool instanceof FakePool) {
      pool.orders.push(
        {id:'older',user_id:created.user.id,paid_at:new Date('2025-01-10T10:00:00Z'),rub_amount:150,bonus_amount:0,status:'completed',description:'Steam · 150 ₽',items:[{platform:'Steam',productName:'',region:'Россия · RUB',login:'demo_steam',currency:'RUB',amount:150}]},
        {id:'own',user_id:created.user.id,paid_at:new Date('2026-11-20T10:00:00Z'),rub_amount:10,bonus_amount:0,status:'paid',description:null,items:null},
        {id:'other',user_id:'other-user',paid_at:new Date(),rub_amount:999,bonus_amount:0,status:'paid',description:null,items:null}
      );
      const orderResponse=await fetch(base+'/api/orders?limit=1&offset=0',{headers:{cookie}});
      const page1=await orderResponse.json();
      assert.deepEqual(page1.orders.map(o=>o.id),['own']);
      assert.equal(page1.total,2);
      assert.equal(page1.has_more,true);
      const page2=await (await fetch(base+'/api/orders?limit=1&offset=1',{headers:{cookie}})).json();
      assert.deepEqual(page2.orders.map(o=>o.id),['older']);
      assert.equal(page2.orders[0].items[0].login,'demo_steam');
      assert.equal(page2.has_more,false);
      const meWithOrders=await (await fetch(base+'/api/auth/me',{headers:{cookie}})).json();
      assert.equal(meWithOrders.user.orders_count,2);
    }
    assert.match(res.headers.get('set-cookie'), /HttpOnly/i);
    assert.match(res.headers.get('set-cookie'), /SameSite=Lax/i);
    assert.equal((await post('/api/auth/register', {email:'a@example.test',password:' pass word 123 ',nickname:'Player',consent:true})).status, 409);
    assert.equal((await post('/api/auth/login', {email:'a@example.test',password:'badpassword'})).status, 401);
    assert.equal((await post('/api/auth/login', {email:'a@example.test',password:'pass word 123'})).status, 401);
    await new Promise(resolve => server.close(resolve));
    server = createApp(pool).listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
    res = await fetch(base + '/api/auth/me', {headers:{cookie}});
    assert.equal((await res.json()).user.email, 'a@example.test');
    assert.equal((await post('/api/auth/logout', null, cookie)).status, 200);
    res = await fetch(base + '/api/auth/me', {headers:{cookie}});
    assert.equal((await res.json()).user, null);
    res = await post('/api/auth/login', {email:'a@example.test',password:' pass word 123 '});
    assert.equal(res.status, 200);
    assert.equal((await res.json()).user.email, 'a@example.test');
  } finally { await new Promise(resolve => server.close(resolve)); }
}

test('HTTP auth lifecycle, CSRF and restart using an in-memory database double', async () => scenario(new FakePool()));

test('HTTP auth lifecycle against isolated PostgreSQL schema', {skip: !process.env.TEST_DATABASE_URL}, async () => {
  const schema = `test_${randomBytes(8).toString('hex')}`;
  const admin = new pg.Pool({connectionString: process.env.TEST_DATABASE_URL});
  await admin.query(`CREATE SCHEMA "${schema}"`);
  const pool = new pg.Pool({connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema}`});
  try { await pool.query(await readFile(new URL('../schema.sql', import.meta.url), 'utf8')); await pool.query(await readFile(new URL('../bonus.sql', import.meta.url), 'utf8')); await scenario(pool); }
  finally { await pool.end(); await admin.query(`DROP SCHEMA "${schema}" CASCADE`); await admin.end(); }
});
