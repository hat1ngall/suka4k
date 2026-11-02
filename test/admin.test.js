import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../app.js';
import {verifyPassword} from '../auth.js';
class AdminPool{
  admin=new Map(); users=[{id:'user-1',email:'a@example.test',nickname:'Player',bonus_balance:'0.00',purchase_blocked:false}]; sessions=new Map([['old-session','user-1']]); prices=new Map();
  async query(sql,v=[]){
    if(sql.startsWith('INSERT INTO admin_sessions')){this.admin.set(v[0],v[1]);return {rows:[]}}
    if(sql.startsWith('SELECT 1 FROM admin_sessions'))return {rows:this.admin.get(v[0])===v[1]?[{}]:[]};
    if(sql.startsWith('SELECT COUNT(*)::integer AS recorded_orders'))return {rows:[{recorded_orders:0,orders_today:0,rub_today:'0',bonus_today:'0',bonus_orders_today:0}]};
    if(sql.startsWith('WITH days AS'))return {rows:Array.from({length:v[0]},(_,i)=>({day:'2026-11-'+String(i+1).padStart(2,'0'),rub_orders:0,bonus_orders:0}))};
    if(sql.startsWith('SELECT COUNT(*)'))return {rows:[{total:this.users.length}]};
    if(sql.startsWith('SELECT id, email, nickname, bonus_balance, purchase_blocked'))return {rows:this.users.slice(v[0],v[0]+51)};
    if(sql.startsWith('UPDATE users SET purchase_blocked')){const u=this.users.find(x=>x.id===v[0]);if(u)u.purchase_blocked=v[1];return {rows:u?[u]:[]}}
    if(sql.startsWith('UPDATE users SET bonus_balance')){const u=this.users.find(x=>x.id===v[0]);if(u)u.bonus_balance=v[1];return {rows:u?[u]:[]}}
    if(sql.startsWith('WITH changed AS (UPDATE users SET password_hash')){const u=this.users.find(x=>x.id===v[0]);if(u){u.password_hash=v[1];for(const [key,id] of this.sessions)if(id===u.id)this.sessions.delete(key)}return {rows:u?[{id:u.id}]:[]}}
    if(sql.startsWith('SELECT product_name, price_rub'))return {rows:[...this.prices.values()]};
    if(sql.startsWith('INSERT INTO catalog_prices')){this.prices.set(v[0],{product_name:v[0],price_rub:v[1]});return {rows:[]}}
    throw Error('Unexpected SQL: '+sql);
  }
}
test('admin user controls and prices require authorization and validate updates',async()=>{
 const previous=process.env.ADMIN_PASSWORD;process.env.ADMIN_PASSWORD='testing-password-12345';const pool=new AdminPool(),server=createApp(pool).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}`;
 const post=(path,body,cookie,origin=base)=>fetch(base+path,{method:'POST',headers:{origin,'content-type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify(body)});
 try{
  assert.equal((await fetch(base+'/api/admin/users')).status,401);
  assert.equal((await post('/api/admin/users/user-1/bonus',{balance:5})).status,401);
  const login=await post('/api/admin/login',{password:'testing-password-12345'}),cookie=login.headers.get('set-cookie').split(';')[0];assert.equal(login.status,200);
  assert.equal((await post('/api/admin/users/user-1/block',{blocked:true},cookie,'https://other.example')).status,403);
  assert.equal((await post('/api/admin/users/user-1/block',{blocked:true},cookie)).status,200);assert.equal(pool.users[0].purchase_blocked,true);
  assert.equal((await post('/api/admin/users/user-1/bonus',{balance:-1},cookie)).status,400);
  assert.equal((await post('/api/admin/users/user-1/bonus',{balance:12.345},cookie)).status,400);
  assert.equal((await post('/api/admin/users/user-1/bonus',{balance:12.5},cookie)).status,200);assert.equal(pool.users[0].bonus_balance,'12.50');
  assert.equal((await post('/api/admin/users/user-1/password',{password:'short'},cookie)).status,400);
  assert.equal((await post('/api/admin/users/user-1/password',{password:'new-password-123'},cookie)).status,200);assert.equal(await verifyPassword('new-password-123',pool.users[0].password_hash),true);assert.equal(pool.sessions.size,0);
  assert.equal((await post('/api/admin/prices',{name:'not a product',price:500},cookie)).status,400);
  assert.equal((await post('/api/admin/prices',{name:'Fortnite',price:499.5},cookie)).status,200);
  const prices=await(await fetch(base+'/api/catalog/prices')).json();assert.equal(prices.products.find(p=>p.name==='Fortnite').price_rub,'499.50');
  const stats=await(await fetch(base+'/api/admin/stats',{headers:{cookie}})).json();assert.equal(stats.registered_users,1);assert.equal(stats.orders_available,false);assert.equal(stats.series.length,7);const day=await(await fetch(base+'/api/admin/stats?period=day',{headers:{cookie}})).json();assert.equal(day.series.length,1);const month=await(await fetch(base+'/api/admin/stats?period=month',{headers:{cookie}})).json();assert.equal(month.series.length,30);
  const users=await(await fetch(base+'/api/admin/users',{headers:{cookie}})).json();assert.equal(users.users.length,1);
 }finally{await new Promise(r=>server.close(r));if(previous===undefined)delete process.env.ADMIN_PASSWORD;else process.env.ADMIN_PASSWORD=previous}
});
