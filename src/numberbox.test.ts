import {describe,it,expect} from 'vitest';
import type {Difficulty} from './math';
import {score} from './math';
import {boxLevels,countSolutions,evaluate,generateBox,lineValue,lines,type BoxOperation} from './numberbox';
import {KEY,loadProgress,saveResult,totals,type Result} from './progress';
function seeded(seed:number){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
const difficulties:Difficulty[]=['Easy','Medium','Challenge'],operations:BoxOperation[]=['Addition','Mixed'];
describe('number box arithmetic',()=>{
 it('works signs from left to right',()=>{expect(evaluate(2,3,4,['+','+'])).toBe(9);expect(evaluate(9,4,2,['−','+'])).toBe(7);expect(evaluate(3,5,6,['+','−'])).toBe(2);expect(evaluate(9,1,2,['−','−'])).toBe(6)});
});
describe('number box generation',()=>{
 it('uses each digit once, keeps every line correct, and has exactly one answer at every level',()=>{
  for(const operation of operations)for(const difficulty of difficulties)for(let seed=1;seed<=40;seed++){
   const box=generateBox({difficulty,operation},seeded(seed*104729));
   expect([...box.solution].sort()).toEqual([1,2,3,4,5,6,7,8,9]);
   expect(box.given.filter(g=>!g)).toHaveLength(boxLevels[difficulty].blanks);
   expect(lines(box)).toHaveLength(6);
   for(const line of lines(box)){expect(lineValue(line,box.solution)).toBe(line.target);expect(line.target).toBeGreaterThanOrEqual(0);const [a,b]=line.cells.map(i=>box.solution[i]);if(line.ops[0]==='−')expect(a).toBeGreaterThanOrEqual(b)}
   expect(countSolutions(box,5)).toBe(1);
  }
 });
 it('uses only plus signs for Addition and mixes in subtraction for Add & subtract',()=>{
  for(let seed=1;seed<=30;seed++){
   expect(lines(generateBox({difficulty:'Medium',operation:'Addition'},seeded(seed))).every(l=>l.ops.join('')==='++')).toBe(true);
   const mixed=lines(generateBox({difficulty:'Medium',operation:'Mixed'},seeded(seed)));expect(mixed.some(l=>l.ops.includes('−'))).toBe(true);expect(mixed.every(l=>l.ops.join('')!=='−−')).toBe(true);
  }
 });
 it('keeps Addition sums within reach of a second grader',()=>{for(let seed=1;seed<=30;seed++)for(const l of lines(generateBox({difficulty:'Easy',operation:'Addition'},seeded(seed)))){expect(l.target).toBeGreaterThanOrEqual(6);expect(l.target).toBeLessThanOrEqual(24)}});
 it('still returns a single-answer box when the random source is stuck',()=>{for(const value of [0,.2,.5,.999])for(const operation of operations){const box=generateBox({difficulty:'Challenge',operation},()=>value);expect(countSolutions(box,5)).toBe(1)}});
 it('reports an empty line as unfinished',()=>{const box=generateBox({difficulty:'Easy',operation:'Addition'},seeded(3));expect(lineValue(box.rows[0],box.solution.map(()=>null))).toBe(null)});
});
describe('number box progress',()=>{
 const memory=()=>{const values=new Map<string,string>();return {getItem:(k:string)=>values.get(k)||null,setItem:(k:string,v:string)=>{values.set(k,v)}}};
 const game:Result={id:'b1',date:'2026-01-03',correct:3,total:3,bestStreak:0,activity:'numberbox',settings:{operation:'Mixed',difficulty:'Easy',count:3},...score(3,3)};
 it('saves number boxes beside other games and counts them',()=>{const store=memory();saveResult(store,game);expect(loadProgress(store).results).toEqual([game]);expect(totals(loadProgress(store))).toMatchObject({games:1,boxes:1,words:0,stars:3})});
 it('discards number box results with broken settings',()=>{const store=memory();store.setItem(KEY,JSON.stringify({version:1,results:[{...game,settings:{difficulty:'Easy',operation:'Division',count:3}},{...game,id:'b2',settings:{difficulty:'Tiny',operation:'Mixed',count:3}}]}));expect(loadProgress(store).results).toEqual([])});
});
