'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {checkBody,checkContract} = require('../src');
test('schema memeriksa field wajib, tipe dan nested object',()=>{
  const schema={type:'object',required:['id','profile'],properties:{id:{type:'number'},profile:{type:'object',required:['name'],properties:{name:{type:'string'}}}}};
  assert.deepEqual(checkBody({id:1,profile:{name:'A'}},schema),[]);
  assert.equal(checkBody({id:'bad',profile:{}},schema).length,2);
});
test('schema tidak didukung ditolak',()=>assert.throws(()=>checkBody({},{type:'object',additionalProperties:false})));
test('status, header dan JSON cocok',async()=>{
  const fake=async()=>new Response(JSON.stringify({ok:true}),{status:200,headers:{'content-type':'application/json'}});
  const r=await checkContract('http://localhost/',{status:200,headers:{'content-type':'application/json'},schema:{type:'object',required:['ok'],properties:{ok:{type:'boolean'}}}},{fetch:fake});
  assert.equal(r.ok,true);
});
test('status dan header salah dilaporkan',async()=>{
  const r=await checkContract('http://localhost/',{status:200,headers:{'x-test':'expected'}},{fetch:async()=>new Response('',{status:404})});
  assert.equal(r.errors.length,2);
});
test('respons JSON rusak dilaporkan',async()=>{
  const r=await checkContract('http://localhost/',{status:200,schema:{type:'object'}},{fetch:async()=>new Response('bad')});
  assert.ok(r.errors.includes('body: invalid JSON'));
});
test('timeout membatalkan fetch',async()=>{
  const fake=(_,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted'))));
  const r=await checkContract('http://localhost/',{status:200},{fetch:fake,timeoutMs:10});
  assert.deepEqual(r.errors,['request timeout']);
});
test('URL dan parameter tidak aman ditolak',async()=>{
  await assert.rejects(checkContract('file:///etc/passwd',{status:200}));
  await assert.rejects(checkContract('https://u:p@example.com',{status:200}));
});
test('endpoint HTTP lokal benar-benar diperiksa',async()=>{
  const http=require('node:http');const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'application/json'});res.end('{"ok":true}');});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  try {const r=await checkContract('http://127.0.0.1:'+server.address().port,{status:200,schema:{type:'object',required:['ok'],properties:{ok:{type:'boolean'}}}});assert.equal(r.ok,true);} finally {await new Promise(resolve=>server.close(resolve));}
});
