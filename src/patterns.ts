import type {Difficulty} from './math';
export type Pattern={terms:number[];blank:number;answer:number;choices:number[];rule:string};
export type PatternSettings={difficulty:Difficulty};
export type PatternPuzzle={difficulty:Difficulty;patterns:Pattern[]};
export const patternDefaults:PatternSettings={difficulty:'Easy'};
export const patternLevels:Record<Difficulty,{count:number}>={Easy:{count:6},Medium:{count:8},Challenge:{count:10}};
const TERMS=5;
function shuffle<T>(items:T[],random:()=>number){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export function generatePattern(difficulty:Difficulty,random:()=>number=Math.random):Pattern{
 const pick=<T>(items:T[])=>items[Math.floor(random()*items.length)],upTo=(max:number)=>Math.floor(random()*(max+1));
 let terms:number[],rule:string,near:number;
 const kind=difficulty==='Challenge'?pick(['step','step','growing','double'] as const):'step';
 if(kind==='growing'){
  // The jump itself grows: +2, +3, +4, +5.
  const first=1+upTo(2);let value=upTo(10);terms=[value];for(let i=0;i<TERMS-1;i++){value+=first+i;terms.push(value)}
  rule='The jump gets 1 bigger each time.';near=first+1;
 }else if(kind==='double'){
  let value=1+upTo(4);terms=[value];for(let i=0;i<TERMS-1;i++){value*=2;terms.push(value)}
  rule='Each number is double the one before.';near=2;
 }else{
  const step=difficulty==='Easy'?pick([1,2,5,10]):difficulty==='Medium'?pick([2,3,4,5,10]):3+upTo(9),down=difficulty!=='Easy'&&random()<.5;
  // Easy patterns start on a multiple of the step, like skip-counting out loud; a pattern counting down starts high enough to stay above zero.
  const start=difficulty==='Easy'?step*upTo(step===1?20:6):down?step*(TERMS-1)+upTo(difficulty==='Medium'?30:60):upTo(difficulty==='Medium'?30:60);
  terms=Array.from({length:TERMS},(_,i)=>start+(down?-1:1)*step*i);
  rule=`The numbers go ${down?'down':'up'} by ${step} each time.`;near=step;
 }
 // Easy leaves two numbers in front of the blank so the jump can be worked out by looking back.
 const blank=difficulty==='Easy'?2+upTo(2):1+upTo(3),answer=terms[blank];
 const others=[...new Set([answer+near,answer-near,answer+1,answer-1,answer+2,answer-2,answer+10,answer+near*2,answer+3,answer+4])].filter(n=>n>=0&&n!==answer);
 return {terms,blank,answer,choices:shuffle([answer,...shuffle(others,random).slice(0,3)],random),rule};
}
export function generatePatterns(settings:PatternSettings,random:()=>number=Math.random):PatternPuzzle{
 const patterns:Pattern[]=[];
 for(let i=0;i<patternLevels[settings.difficulty].count;i++){
  let next=generatePattern(settings.difficulty,random);
  // Try a few times for a pattern not already on the page.
  for(let attempt=0;attempt<8&&patterns.some(p=>p.terms.join()===next.terms.join());attempt++)next=generatePattern(settings.difficulty,random);
  patterns.push(next);
 }
 return {difficulty:settings.difficulty,patterns};
}
