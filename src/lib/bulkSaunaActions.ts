import {AdminRequestUncertain} from './adminRequest.ts';
export type SaunaActionTarget={id:string;commandId:string};
export type SaunaActionResult=SaunaActionTarget&{status:'saved'|'failed'|'unconfirmed'|'not_attempted';message?:string};
export async function runSaunaActions(targets:SaunaActionTarget[],perform:(target:SaunaActionTarget)=>Promise<void>,onResult:(result:SaunaActionResult)=>void){
 const results:SaunaActionResult[]=[];
 const report=(result:SaunaActionResult)=>{results.push(result);onResult(result);};
 for(let index=0;index<targets.length;index++){
  const target=targets[index];
  try{await perform(target);report({...target,status:'saved'});}
  catch(error){
   let message=error instanceof Error?error.message:'Could not save this sauna';
   try{const body=JSON.parse(message);if(typeof body.error==='string')message=body.error;}catch{/* Plain errors are already suitable for display. */}
   const uncertain=error instanceof AdminRequestUncertain;
   report({...target,status:uncertain?'unconfirmed':'failed',message});
   if(uncertain){for(const next of targets.slice(index+1))report({...next,status:'not_attempted',message:'Stopped after an unconfirmed result. Refresh and review before continuing.'});break;}
  }
 }
 return results;
}
