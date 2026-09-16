// Navigation rules apply equally to pointer, keyboard and gesture actions.
export class BirthdayJourney {
 constructor(){this.completed=false;this.seen=new Set();}
 canGo(from,to,{count=0,wishDone=false}={}){
  if(from===to)return false;
  if(this.completed)return true;
  return (from==='entry'&&to==='room') || (from==='room'&&to==='memory') ||
   (from==='memory'&&to==='cake'&&this.seen.size>=count) ||
   (from==='cake'&&to==='ending'&&wishDone);
 }
 visit(index){this.seen.add(index);}
 nextUnread(count){for(let i=0;i<count;i++)if(!this.seen.has(i))return i;return -1;}
}
