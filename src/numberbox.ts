import type {Difficulty} from './math';
export type BoxOperation='Addition'|'Mixed';
export type Op='+'|'−';
export type BoxSettings={difficulty:Difficulty;operation:BoxOperation};
/** One row or column: three cell indexes (0–8, reading order), the two signs between them, and the answer shown outside the box. */
export type Line={cells:[number,number,number];ops:[Op,Op];target:number};
export type Box={solution:number[];given:boolean[];rows:Line[];cols:Line[];difficulty:Difficulty;operation:BoxOperation};
export const boxDefaults:BoxSettings={difficulty:'Easy',operation:'Addition'};
/** How many of the nine squares start empty. */
export const boxLevels:Record<Difficulty,{blanks:number}>={Easy:{blanks:3},Medium:{blanks:5},Challenge:{blanks:7}};
export const operationName=(o:BoxOperation)=>o==='Mixed'?'Add & subtract':'Addition';
const shape:[number,number,number][]=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8]];
function shuffle<T>(items:T[],random:()=>number){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
/** Signs are worked left to right, the way a second grader reads them. */
export function evaluate(a:number,b:number,c:number,ops:[Op,Op]){const first=ops[0]==='+'?a+b:a-b;return ops[1]==='+'?first+c:first-c}
/** The value of a line, or null while any of its squares is empty. */
export function lineValue(line:Line,values:(number|null)[]){const [a,b,c]=line.cells.map(i=>values[i]);return a==null||b==null||c==null?null:evaluate(a,b,c,line.ops)}
/** A line never dips below zero, neither part-way nor at the end. */
function friendly(a:number,b:number,c:number,ops:[Op,Op]){return (ops[0]==='+'||a>=b)&&evaluate(a,b,c,ops)>=0}
function signs(a:number,b:number,c:number,operation:BoxOperation,random:()=>number):[Op,Op]{
 if(operation==='Addition')return ['+','+'];
 // Every mixed line has one plus and one minus when the numbers allow it without going below zero.
 const options:[Op,Op][]=random()<.5?[['+','−'],['−','+']]:[['−','+'],['+','−']];
 return options.find(o=>friendly(a,b,c,o))??['+','+'];
}
export const lines=(box:Box)=>[...box.rows,...box.cols];
/** Counts the ways to finish the box with the unused digits, stopping at `limit`. */
export function countSolutions(box:Box,limit=2){
 const blanks=box.given.flatMap((g,i)=>g?[]:[i]),spare=[1,2,3,4,5,6,7,8,9].filter(d=>!box.solution.some((v,i)=>box.given[i]&&v===d)),values:(number|null)[]=box.solution.map((v,i)=>box.given[i]?v:null),all=lines(box);
 let found=0;
 const place=(at:number)=>{
  if(found>=limit)return;
  if(at===blanks.length){found++;return}
  for(let k=0;k<spare.length;k++){const d=spare[k];if(d===0)continue;values[blanks[at]]=d;spare[k]=0;
   // Abandon a branch as soon as a finished line misses its answer.
   if(all.every(l=>!l.cells.includes(blanks[at])||(v=>v===null||v===l.target)(lineValue(l,values))))place(at+1);
   spare[k]=d;values[blanks[at]]=null}
 };
 place(0);return found;
}
export function generateBox(settings:BoxSettings,random:()=>number=Math.random):Box{
 let fallback:Box|null=null;
 // Fewer empty squares always leads to a single answer eventually, so this loop is certain to return.
 for(let blanks=boxLevels[settings.difficulty].blanks;blanks>=1;blanks--)for(let attempt=0;attempt<40;attempt++){
  const solution=shuffle([1,2,3,4,5,6,7,8,9],random);
  const made=shape.map(cells=>{const [a,b,c]=cells.map(i=>solution[i]),ops=signs(a,b,c,settings.operation,random);return {cells,ops,target:evaluate(a,b,c,ops)}});
  const empty=new Set(shuffle([0,1,2,3,4,5,6,7,8],random).slice(0,blanks));
  const box:Box={solution,given:solution.map((_,i)=>!empty.has(i)),rows:made.slice(0,3),cols:made.slice(3),difficulty:settings.difficulty,operation:settings.operation};
  fallback=box;
  if(countSolutions(box)===1)return box;
 }
 return fallback!;
}
