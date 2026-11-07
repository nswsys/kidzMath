export type Difficulty = 'Easy' | 'Medium' | 'Challenge';
export type Operation = 'Addition' | 'Subtraction' | 'Mixed';
export type Mode = 'Numbers' | 'Counting' | 'Stories';
export type Settings = {difficulty:Difficulty;operation:Operation;mode:Mode;count:number};
export type Problem = {a:number;b:number;op:'+'|'−';answer:number;kind:Mode;text:string;object:string};
export const limits:Record<Difficulty,number> = {Easy:20,Medium:100,Challenge:1000};
export const defaults:Settings = {difficulty:'Easy',operation:'Mixed',mode:'Numbers',count:10};
export function generateProblem(settings:Settings, random:()=>number=Math.random):Problem {
 const integer=(max:number)=>Math.floor(random()*(max+1));
 // Counting remains readable: never more than 20 concrete objects.
 const max=settings.mode==='Counting'?Math.min(20,limits[settings.difficulty]):limits[settings.difficulty];
 const op=settings.operation==='Mixed'?(random()<.5?'+':'−'):settings.operation==='Addition'?'+':'−';
 const a=integer(max),b=integer(op==='+'?max-a:a);
 const object=['apples','carrots','stars'][integer(2)];
 const text=op==='+'?`Milo has ${a} ${object}. Luna brings ${b} more. How many ${object} do they have altogether?`:`Luna has ${a} ${object}. She gives Milo ${b}. How many ${object} does Luna have left?`;
 return {a,b,op,answer:op==='+'?a+b:a-b,kind:settings.mode,text,object};
}
export function generateQuiz(settings:Settings, random:()=>number=Math.random):Problem[]{return Array.from({length:settings.count},()=>generateProblem(settings,random));}
export function isCorrect(input:string,problem:Problem){return /^\d+$/.test(input.trim()) && Number(input)===problem.answer;}
export function score(correct:number,total:number,bestStreak=0){const percentage=total>0?Math.round(correct/total*100):0;return {percentage,grade:percentage>=90?'A':percentage>=80?'B':percentage>=70?'C':percentage>=60?'D':'F',stars:percentage>=90?3:percentage>=60?2:1,points:correct*10+bestStreak*5};}
export function hint(p:Problem){return p.op==='+'?`Start at ${p.a}. Count up ${p.b} more. Try adding the tens first, then the ones.`:`Start at ${p.a}. Count back ${p.b}. Try taking away the tens first, then the ones.`;}
