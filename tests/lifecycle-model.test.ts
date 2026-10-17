import test from 'node:test';
import assert from 'node:assert/strict';
import {centsInput,earliestSubscriptionReceipt} from '../src/lib/lifecycleModel.ts';
test('money inputs retain cents without accepting rounding, signs or exponent notation',()=>{
 assert.equal(centsInput('270'),27000);assert.equal(centsInput('19.99'),1999);assert.equal(centsInput('0.1'),10);
 for(const x of ['-5','2.999','1e3','NaN','1,000','Infinity'])assert.throws(()=>centsInput(x));
});
test('backfill install proxy uses the first positive authorized Subscription Revenue receipt, not deposits or refunds',()=>{
 const t=(id:string,date:string,account='Subscription Revenue',type='RECEIVE',status='AUTHORISED',amount='250')=>({id,date,accountNames:[account],contactId:'source-person',type,status,amount,lines:[{accountName:account,amount}]});
 const rows=[t('deposit','2020-01-01','Refundable Deposits'),t('deleted','2020-02-01','Subscription Revenue','RECEIVE','DELETED'),t('refund','2020-03-01','Subscription Revenue','SPEND'),t('first','2020-04-01'),t('later','2020-05-01'),t('zero','2019-01-01','Subscription Revenue','RECEIVE','AUTHORISED','0')];
 assert.equal(earliestSubscriptionReceipt(rows,['source-person'])?.id,'first');assert.equal(earliestSubscriptionReceipt(rows,['different-person']),null);
 assert.equal(earliestSubscriptionReceipt([t('deposit','2020-01-01','Deposit')],['source-person']),null);
});
