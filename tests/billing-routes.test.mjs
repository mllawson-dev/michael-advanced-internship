import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
async function handler(path, dependencies) {
 const source=readFileSync(new URL(path,import.meta.url),'utf8').replace(/^import .*from ["'].*["'];\s*$/gm,'');
 const compiled=ts.transpileModule('const { database, failure, identity, origin, prices, stripe, subscription, randomUUID } = globalThis.__billingTest;\n'+source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 globalThis.__billingTest=dependencies;
 return import('data:text/javascript;base64,'+Buffer.from(compiled+'\n//'+Math.random()).toString('base64'));
}
test('checkout rejects invalid identity, origin, and plan before side effects', async () => {
 for (const failureAt of ['origin','identity','plan']) {
  let writes=0;
  const deps={origin:()=>{if(failureAt==='origin')throw Error();return 'http://localhost:3000';},identity:async()=>{if(failureAt==='identity')throw Error();return {uid:'user'};},prices:()=>({monthly:'price_month',annual:'price_year'}),database:()=>{writes++;throw Error('must not write');},failure:()=>new Response('',{status:403})};
  const {POST}=await handler('../app/api/billing/checkout/route.ts',deps);
  const response=await POST(new Request('http://localhost:3000/api/billing/checkout',{method:'POST',body:JSON.stringify({plan:failureAt==='plan'?'invalid':'monthly'})}));
  assert.equal(response.status,403);assert.equal(writes,0);
 }
});
test('webhook rejects signature failure before any database access', async () => {
 process.env.STRIPE_WEBHOOK_SECRET='test-signing-secret';let writes=0;
 const {POST}=await handler('../app/api/billing/webhook/route.ts',{stripe:()=>({webhooks:{constructEvent(){throw Error('bad signature');}}}),database:()=>{writes++;throw Error();}});
 assert.equal((await POST(new Request('http://localhost/api/billing/webhook',{method:'POST',body:'invalid'}))).status,400);
 assert.equal(writes,0);
});
test('webhook transaction deduplicates events and risk block survives subscription updates', async () => {
 process.env.STRIPE_WEBHOOK_SECRET='test-signing-secret';const seen=new Set();const customer={};let event={id:'evt1',type:'charge.refunded',livemode:false,created:1,data:{object:{customer:'cus1',refunded:true}}};let applied=0;
 const customerRef={id:'user'};
 const db={collection(name){if(name==='billingCustomers')return {where(){return {limit(){return {get:async()=>({empty:false,docs:[{ref:customerRef}]})};}};}};return {doc:id=>({id})};},async runTransaction(fn){await fn({get:async ref=>({exists:seen.has(ref.id)}),set(_ref,data){Object.assign(customer,data);applied++;},create(ref){seen.add(ref.id);}});}};
 const {POST}=await handler('../app/api/billing/webhook/route.ts',{stripe:()=>({webhooks:{constructEvent:()=>event},charges:{retrieve:async()=>({customer:'cus1'})}}),database:()=>db});
 const request=()=>new Request('http://localhost/api/billing/webhook',{method:'POST',body:'event'});
 assert.equal((await POST(request())).status,200);assert.equal((await POST(request())).status,200);assert.equal(applied,1);assert.equal(customer.blocked,true);
 event={...event,id:'evt2',type:'customer.subscription.updated',data:{object:{customer:'cus1',trial_start:1}}};await POST(request());assert.equal(customer.blocked,true);assert.equal(customer.trialUsed,true);
 event={...event,id:'evt3',type:'charge.dispute.created',data:{object:{charge:'ch1'}}};await POST(request());assert.equal(customer.blocked,true);assert.equal(seen.size,3);
});
test('checkout recovers lost session response with the same durable idempotency key', async () => {
 const data={customerId:'cus1'};let calls=0;const keys=[];const ref={get:async()=>({data:()=>data}),set:async update=>Object.assign(data,update)};
 const db={collection:()=>({doc:()=>ref}),runTransaction:async fn=>fn({get:async()=>({data:()=>data}),set:(_ref,update)=>Object.assign(data,update),update:(_ref,update)=>Object.assign(data,update)})};
 const deps={origin:()=> 'http://localhost:3000',identity:async()=>({uid:'user'}),prices:()=>({monthly:'price_month',annual:'price_year'}),randomUUID:()=> 'owner',subscription:async()=>({entitled:false,checkoutAllowed:true}),database:()=>db,failure:()=>new Response('',{status:403}),stripe:()=>({subscriptions:{list:()=>({async *[Symbol.asyncIterator](){}})},checkout:{sessions:{create:async(_params,options)=>{keys.push(options.idempotencyKey);if(++calls===1)throw Error('response lost');return {id:'cs1',url:'https://checkout.stripe.com/c/pay/cs1'};},retrieve:async()=>({status:'open',url:'https://checkout.stripe.com/c/pay/cs1'})}}})};
 const {POST}=await handler('../app/api/billing/checkout/route.ts',deps);
 const request=()=>new Request('http://localhost:3000/api/billing/checkout',{method:'POST',body:JSON.stringify({plan:'monthly'})});
 assert.equal((await POST(request())).status,403);
 assert.equal((await POST(request())).status,200);
 assert.deepEqual(keys,['checkout-user-1','checkout-user-1']);
 assert.equal((await POST(request())).status,200);assert.equal(calls,2);
});
test('checkout refuses ineligible customer before creating any Stripe session', async () => {
 let created=0;const data={customerId:'cus1'};const ref={get:async()=>({data:()=>data})};
 const db={collection:()=>({doc:()=>ref}),runTransaction:async fn=>fn({get:async()=>({data:()=>data}),set:(_ref,update)=>Object.assign(data,update),update:(_ref,update)=>Object.assign(data,update)})};
 const {POST}=await handler('../app/api/billing/checkout/route.ts',{origin:()=> 'http://localhost:3000',identity:async()=>({uid:'user'}),prices:()=>({monthly:'price_month',annual:'price_year'}),randomUUID:()=> 'owner',subscription:async()=>({entitled:false,checkoutAllowed:false}),database:()=>db,failure:()=>new Response('',{status:403}),stripe:()=>{created++;throw Error();}});
 assert.equal((await POST(new Request('http://localhost:3000/api/billing/checkout',{method:'POST',body:JSON.stringify({plan:'annual'})}))).status,409);assert.equal(created,0);
});
test('monthly checkout has no trial and eligible annual checkout has seven days', async () => {
 for (const plan of ['monthly','annual']) {
  const data={customerId:'cus1'};let parameters;
  const ref={get:async()=>({data:()=>data}),set:async update=>Object.assign(data,update)};
  const db={collection:()=>({doc:()=>ref}),runTransaction:async fn=>fn({get:async()=>({data:()=>data}),set:(_ref,update)=>Object.assign(data,update),update:(_ref,update)=>Object.assign(data,update)})};
  const {POST}=await handler('../app/api/billing/checkout/route.ts',{origin:()=> 'http://localhost:3000',identity:async()=>({uid:'user'}),prices:()=>({monthly:'price_month',annual:'price_year'}),randomUUID:()=> 'owner',subscription:async()=>({checkoutAllowed:true}),database:()=>db,failure:()=>new Response('',{status:403}),stripe:()=>({subscriptions:{list:()=>({async *[Symbol.asyncIterator](){}})},checkout:{sessions:{create:async params=>{parameters=params;return {id:'cs1',url:'https://checkout.stripe.com/c/pay/cs1'};}}}})});
  assert.equal((await POST(new Request('http://localhost:3000/api/billing/checkout',{method:'POST',body:JSON.stringify({plan})}))).status,200);
  assert.equal(parameters.subscription_data.trial_period_days,plan==='annual'?7:undefined);
 }
});
