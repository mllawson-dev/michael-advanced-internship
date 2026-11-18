import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accessForSubscription } from '../app/lib/billing-policy.ts';
test('only active or trialing allowlisted plans unlock catalog', () => {
 for (const status of ['active', 'trialing']) {
  assert.deepEqual(accessForSubscription(status,'monthly','monthly','annual'),{entitled:true,plan:'premium'});
  assert.deepEqual(accessForSubscription(status,'annual','monthly','annual'),{entitled:true,plan:'premium-plus'});
 }
 for (const status of ['past_due','unpaid','canceled','incomplete','paused','none']) assert.equal(accessForSubscription(status,'annual','monthly','annual').entitled,false);
 assert.equal(accessForSubscription('active','other','monthly','annual').entitled,false);
 assert.equal(accessForSubscription('active','annual','monthly','annual',true).entitled,false);
});

test('checkout eligibility blocks risk holds and nonterminal billing independently from catalog access', async () => {
 const { canStartCheckout } = await import('../app/lib/billing-policy.ts');
 assert.equal(canStartCheckout(true,[],['annual']),false);
 for (const status of ['active','trialing','past_due','unpaid','incomplete','paused']) assert.equal(canStartCheckout(false,[{status,priceIds:['annual']}],['annual']),false);
 for (const status of ['canceled','incomplete_expired']) assert.equal(canStartCheckout(false,[{status,priceIds:['annual']}],['annual']),true);
});
