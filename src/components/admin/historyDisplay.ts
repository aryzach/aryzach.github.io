/** Format date-only records without shifting them across time zones. */
export function historyDate(value:string|null|undefined):string {
 if(!value)return 'Unknown';
 const date=new Date(`${value.slice(0,10)}T12:00:00`);
 return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(date);
}
