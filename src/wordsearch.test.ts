import {describe,it,expect} from 'vitest';
import type {Difficulty} from './math';
import {generatePuzzle,levels,lineBetween,lines,matchWord,snapLine,themes,type ThemeId} from './wordsearch';
import {KEY,loadProgress,saveResult,totals,type Result} from './progress';
import {score} from './math';
/** Small deterministic generator so failures are reproducible. */
function seeded(seed:number){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
const difficulties:Difficulty[]=['Easy','Medium','Challenge'];
describe('word lists',()=>{
 it('use only uppercase letters, fit the grids, and are unique within a theme',()=>{for(const t of themes){expect(new Set(t.words).size).toBe(t.words.length);for(const w of t.words)expect(w).toMatch(/^[A-Z]{3,10}$/);expect(t.words.filter(w=>w.length<=levels.Easy.size).length).toBeGreaterThanOrEqual(levels.Challenge.words)}});
});
describe('puzzle generation',()=>{
 it('hides every listed word exactly once, in an allowed direction, for all themes and levels',()=>{
  for(const theme of themes)for(const difficulty of difficulties)for(let seed=1;seed<=10;seed++){
   const p=generatePuzzle({theme:theme.id,difficulty},seeded(seed*7919)),level=levels[difficulty];
   expect(p.size).toBe(level.size);expect(p.grid).toHaveLength(level.size);for(const row of p.grid){expect(row).toHaveLength(level.size);for(const ch of row)expect(ch).toMatch(/^[A-Z]$/)}
   expect(p.placements).toHaveLength(level.words);expect(new Set(p.placements.map(x=>x.word)).size).toBe(level.words);
   const all=lines(p.grid);
   for(const placement of p.placements){
    expect(theme.words).toContain(placement.word);
    expect(placement.cells.map(c=>p.grid[c.r][c.c]).join('')).toBe(placement.word);
    const step=[placement.cells[1].r-placement.cells[0].r,placement.cells[1].c-placement.cells[0].c];
    expect(level.directions.some(d=>d[0]===step[0]&&d[1]===step[1])).toBe(true);
    placement.cells.forEach((c,i)=>{expect(c.r).toBe(placement.cells[0].r+step[0]*i);expect(c.c).toBe(placement.cells[0].c+step[1]*i)});
    expect(all.filter(l=>l.includes(placement.word))).toHaveLength(1);
    expect(matchWord(p,placement.cells,[])).toBe(placement.word);expect(matchWord(p,[...placement.cells].reverse(),[])).toBe(placement.word);expect(matchWord(p,placement.cells,[placement.word])).toBe(null);
   }
  }
 },30000);
 it('keeps Easy puzzles reading forwards and never spells unkind filler',()=>{
  for(let seed=1;seed<=60;seed++){const p=generatePuzzle({theme:'animals',difficulty:'Easy'},seeded(seed));for(const x of p.placements){const dr=x.cells[1].r-x.cells[0].r,dc=x.cells[1].c-x.cells[0].c;expect(dr>=0&&dc>=0).toBe(true)}}
  for(let seed=1;seed<=60;seed++){const all=lines(generatePuzzle({theme:'space',difficulty:'Challenge'},seeded(seed)).grid);for(const bad of ['POO','BUTT','DUMB','HATE','UGLY'])expect(all.some(l=>l.includes(bad))).toBe(false)}
 });
 it('still finishes when the random source is stuck on one value',()=>{for(const value of [0,.2,.999]){const p=generatePuzzle({theme:'fruits',difficulty:'Medium'},()=>value);expect(p.placements).toHaveLength(levels.Medium.words)}});
 it('makes a different puzzle each time',()=>{expect(generatePuzzle({theme:'sports',difficulty:'Medium'},seeded(1)).grid).not.toEqual(generatePuzzle({theme:'sports',difficulty:'Medium'},seeded(2)).grid)});
});
describe('selection helpers',()=>{
 it('finds straight lines and rejects crooked ones',()=>{expect(lineBetween({r:0,c:0},{r:0,c:3})).toHaveLength(4);expect(lineBetween({r:3,c:3},{r:0,c:0})).toEqual([{r:3,c:3},{r:2,c:2},{r:1,c:1},{r:0,c:0}]);expect(lineBetween({r:0,c:0},{r:1,c:3})).toBe(null);expect(lineBetween({r:2,c:2},{r:2,c:2})).toEqual([{r:2,c:2}])});
 it('snaps a wobbly drag to a row, column, or diagonal inside the grid',()=>{expect(snapLine({r:0,c:0},{r:1,c:5},8)).toEqual(lineBetween({r:0,c:0},{r:0,c:5}));expect(snapLine({r:0,c:0},{r:5,c:1},8)).toEqual(lineBetween({r:0,c:0},{r:5,c:0}));expect(snapLine({r:0,c:0},{r:3,c:4},8)).toEqual(lineBetween({r:0,c:0},{r:4,c:4}));expect(snapLine({r:6,c:6},{r:7,c:3},8).every(c=>c.r>=0&&c.r<8&&c.c>=0&&c.c<8)).toBe(true)});
});
describe('word search progress',()=>{
 const memory=()=>{const values=new Map<string,string>();return {getItem:(k:string)=>values.get(k)||null,setItem:(k:string,v:string)=>{values.set(k,v)}}};
 const word:Result={id:'w1',date:'2026-01-02',correct:5,total:6,bestStreak:0,activity:'wordsearch',settings:{theme:'animals' satisfies ThemeId,difficulty:'Easy',count:6},...score(5,6)};
 it('saves word searches beside math games and counts them',()=>{const store=memory();saveResult(store,word);expect(loadProgress(store).results).toEqual([word]);expect(totals(loadProgress(store))).toMatchObject({games:1,words:1,stars:2})});
 it('discards word search results with broken settings',()=>{const store=memory();store.setItem(KEY,JSON.stringify({version:1,results:[{...word,settings:{difficulty:'Easy'}},{...word,id:'w2',settings:{theme:'animals',difficulty:'Huge'}},{...word,id:'w3',activity:'chess'}]}));expect(loadProgress(store).results).toEqual([])});
});
