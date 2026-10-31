import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../app.js';

class PromoPool {
  sessions = new Map();
  promos = new Map();
  async query(sql, values = []) {
    if (sql.startsWith('INSERT INTO admin_sessions')) { this.sessions.set(values[0], values[1]); return {rows: []}; }
    if (sql.startsWith('SELECT 1 FROM admin_sessions')) return {rows: this.sessions.get(values[0]) === values[1] ? [{}] : []};
    if (sql.startsWith('DELETE FROM admin_sessions')) { this.sessions.delete(values[0]); return {rows: []}; }
    if (sql.startsWith('INSERT INTO promo_codes')) { if(this.promos.has(values[0])) throw Object.assign(new Error('duplicate'),{code:'23505'}); this.promos.set(values[0],{code:values[0],percent:values[1],active:true}); return {rows:[]}; }
    if (sql.startsWith('SELECT code, percent, active')) return {rows:[...this.promos.values()]};
    if (sql.startsWith('UPDATE promo_codes')) { const p=this.promos.get(values[0]); if(p)p.active=false; return {rows:p?[p]:[]}; }
    if (sql.startsWith('SELECT code, percent FROM promo_codes')) { const p=this.promos.get(values[0]); return {rows:p?.active?[p]:[]}; }
    throw new Error('Unexpected SQL: '+sql);
  }
}

test('promo codes require admin, reject cross-origin writes, validate and deactivate', async () => {
  const previous=process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD='testing-password-12345';
  const server=createApp(new PromoPool()).listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const post=(path,body,cookie,origin=base)=>fetch(base+path,{method:'POST',headers:{origin,'content-type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify(body)});
  try {
    assert.equal((await post('/api/admin/promos',{code:'MUPPLE10',percent:10})).status,401);
    assert.equal((await post('/api/admin/login',{password:'wrong-password-123'})).status,401);
    assert.equal((await post('/api/admin/login',{password:'testing-password-12345'},null,'https://evil.example')).status,403);
    const login=await post('/api/admin/login',{password:'testing-password-12345'});assert.equal(login.status,200);
    const cookie=login.headers.get('set-cookie').split(';')[0];
    assert.match(login.headers.get('set-cookie'),/HttpOnly/i);
    assert.equal((await post('/api/admin/promos',{code:'x',percent:10},cookie)).status,400);
    assert.equal((await post('/api/admin/promos',{code:'MUPPLE10',percent:101},cookie)).status,400);
    assert.equal((await post('/api/admin/promos',{code:'mupple10',percent:10},cookie)).status,201);
    assert.equal((await post('/api/admin/promos',{code:'MUPPLE10',percent:10},cookie)).status,409);
    const check=await post('/api/promo/check',{code:'mupple10'});assert.equal(check.status,200);assert.equal((await check.json()).percent,10);
    assert.equal((await post('/api/admin/promos/deactivate',{code:'MUPPLE10'},cookie)).status,200);
    assert.equal((await post('/api/promo/check',{code:'MUPPLE10'})).status,404);
    assert.equal((await post('/api/admin/logout',{},cookie)).status,200);
    assert.equal((await post('/api/admin/promos',{code:'OTHER',percent:5},cookie)).status,401);
  } finally { await new Promise(resolve=>server.close(resolve)); if(previous===undefined)delete process.env.ADMIN_PASSWORD;else process.env.ADMIN_PASSWORD=previous; }
});
