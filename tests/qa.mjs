// Run with server and both databases running: npm run qa
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const base=process.env.QA_URL||'http://localhost:3000';
let total=0;
async function request(engine,path,method='GET',body){
  const res=await fetch(`${base}/api/${engine}${path}`,{method,headers:{'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  return {status:res.status,data:await res.json()};
}
async function check(engine){
  const marker='QA '+randomUUID().slice(0,8);
  let r=await request(engine,'/trips','POST',{name:marker,destination:'Italy'});assert.equal(r.status,201);const id=r.data.id;console.log(engine,'CREATE trip: 201');total++;
  r=await request(engine,`/trips/${id}/activities`,'POST',{title:'Visit museum'});assert.equal(r.status,201);const aid=r.data.id;console.log(engine,'CREATE activity: 201');total++;
  r=await request(engine,`/trips/${id}`);assert.equal(r.status,200);assert.equal(r.data.activities.length,1);console.log(engine,'READ with child: 200');total++;
  r=await request(engine,`/trips/${id}`,'PATCH',{name:marker+' updated'});assert.equal(r.data.name,marker+' updated');console.log(engine,'UPDATE trip: 200');total++;
  r=await request(engine,`/trips/${id}/activities/${aid}`,'PATCH',{title:'Visit gallery'});assert.equal(r.data.title,'Visit gallery');console.log(engine,'UPDATE embedded/related child: 200');total++;
  r=await request(engine,`/trips/${id}`);assert.equal(r.data.activities[0].title,'Visit gallery');total++;
  r=await request(engine,'/trips','POST',{name:'',destination:'Italy'});assert.equal(r.status,400);console.log(engine,'INVALID input: 400');total++;
  r=await request(engine,`/trips/${id}`,'DELETE');assert.equal(r.status,200);console.log(engine,'DELETE: 200');total++;
  r=await request(engine,`/trips/${id}`);assert.equal(r.status,404);console.log(engine,'POST-DELETE READ: 404');total++;
}
await check('sql');
// SQL orphan insert: UUID valid but doesn't exist; database FK should emit PG 23503 / HTTP 409.
let r=await request('sql',`/trips/${randomUUID()}/activities`,'POST',{title:'Orphan activity'});
assert.equal(r.status,409);assert.equal(r.data.code,'23503');console.log('sql FOREIGN KEY rejected orphan: 409 / PostgreSQL 23503');total++;
await check('mongo');
r=await fetch(`${base}/api/health`);assert.equal(r.status,200);console.log('HEALTH: 200');total++;
console.log(`PASS: ${total} automated assertions (inspect DB directly for evidence as well).`);
