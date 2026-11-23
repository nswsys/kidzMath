import type {Difficulty,Settings} from './math';
type Base={id:string;date:string;correct:number;total:number;bestStreak:number;percentage:number;grade:string;stars:number;points:number};
/** Results saved before word searches existed have no `activity` and are math games. */
export type MathResult=Base&{activity?:'math';settings:Settings};
export type WordResult=Base&{activity:'wordsearch';settings:{theme:string;difficulty:Difficulty;count:number}};
export type BoxResult=Base&{activity:'numberbox';settings:{operation:'Addition'|'Mixed';difficulty:Difficulty;count:number}};
/** A maze has no right or wrong answers, so `correct` out of `total` (always 5) falls by one for each hint. `count` is the length of the route. */
export type MazeResult=Base&{activity:'maze';settings:{theme:string;difficulty:Difficulty;count:number}};
/** The activities added through the shared registry in activities.tsx. `count` is how many items the game had. */
export type ExtraActivity='scramble'|'patterns'|'crossword'|'colors';
export const extraActivities:ExtraActivity[]=['scramble','patterns','crossword','colors'];
export type ExtraResult=Base&{activity:ExtraActivity;settings:{difficulty:Difficulty;theme?:string;count:number}};
export type Result=MathResult|WordResult|BoxResult|MazeResult|ExtraResult;
export const isExtra=(r:Result):r is ExtraResult=>extraActivities.includes(r.activity as ExtraActivity);
export type Progress={version:1;results:Result[]};
export const KEY='kidzmath.progress.v1';
export interface Store{getItem(key:string):string|null;setItem(key:string,value:string):void}
function valid(r:Result){return r&&typeof r.id==='string'&&Number.isFinite(Date.parse(r.date))&&Number.isInteger(r.total)&&r.total>0&&Number.isInteger(r.correct)&&r.correct>=0&&r.correct<=r.total&&Number.isInteger(r.stars)&&r.stars>=1&&r.stars<=3&&Number.isFinite(r.points)&&r.points>=0&&Number.isFinite(r.percentage)&&r.percentage>=0&&r.percentage<=100&&Number.isInteger(r.bestStreak)&&r.bestStreak>=0&&typeof r.grade==='string'&&r.settings&&['Easy','Medium','Challenge'].includes(r.settings.difficulty)&&(extraActivities.includes(r.activity as ExtraActivity)?(s=>Number.isFinite(s.count)&&(s.theme===undefined||typeof s.theme==='string'))(r.settings as ExtraResult['settings']):r.activity==='wordsearch'||r.activity==='maze'?typeof r.settings.theme==='string':r.activity==='numberbox'?['Addition','Mixed'].includes(r.settings.operation):(r.activity===undefined||r.activity==='math')&&['Addition','Subtraction','Mixed'].includes(r.settings.operation)&&['Numbers','Counting','Stories'].includes(r.settings.mode))}
export function loadProgress(storage:Store):Progress{try{const p=JSON.parse(storage.getItem(KEY)||'null');if(p?.version===1&&Array.isArray(p.results))return {version:1,results:p.results.filter(valid).slice(0,1000)}}catch{/* Unavailable or corrupt storage starts fresh. */}return {version:1,results:[]};}
export function saveResult(storage:Store,result:Result):Progress {const p=loadProgress(storage);if(!p.results.some(r=>r.id===result.id))p.results.unshift(result);p.results=p.results.slice(0,1000);storage.setItem(KEY,JSON.stringify(p));return p;}
export function totals(p:Progress){const r=p.results;const answers=r.reduce((s,x)=>s+x.total,0);return {games:r.length,words:r.filter(x=>x.activity==='wordsearch').length,boxes:r.filter(x=>x.activity==='numberbox').length,mazes:r.filter(x=>x.activity==='maze').length,by:r.reduce<Record<string,number>>((n,x)=>{const a=x.activity??'math';n[a]=(n[a]??0)+1;return n},{}),accuracy:answers?Math.round(r.reduce((s,x)=>s+x.correct,0)/answers*100):0,stars:r.reduce((s,x)=>s+x.stars,0),points:r.reduce((s,x)=>s+x.points,0),streak:Math.max(0,...r.map(x=>x.bestStreak))};}
