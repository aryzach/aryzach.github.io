/** Owner-approved CAC rules. No contractor, owner-time, or general-software allocation. */
export function acquisitionCategory(account:string,payee:string):'Advertising'|'Acquisition tools'|null {
 const name=payee.toLowerCase().replace(/[^a-z0-9]/g,'');
 if(name.includes('upwork')||name.includes('contractor')||['fiverr','slate','nadia','vasily'].includes(name))return null;
 if(account==='6000')return 'Advertising';
 return ['6155','5025'].includes(account)&&['highlevel','brightlocal','elfsight','web3forms'].includes(name)?'Acquisition tools':null;
}
