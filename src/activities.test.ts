import {describe,it,expect} from 'vitest';
import type {Difficulty} from './math';
import {score} from './math';
import {themes} from './wordsearch';
import {generateScramble,isUnscrambled,scrambleLetters,scrambleLevels} from './scramble';
import {generatePattern,generatePatterns,patternLevels} from './patterns';
import {crosswordLevels,crosswordThemes,generateCrossword} from './crossword';
import {colorLevels,expression,generateColoring,paints,pictures,valueOf} from './colorbynumber';
import {KEY,loadProgress,saveResult,totals,type Result} from './progress';
import {OUTFIT_KEY,items,loadOutfits,noOutfits,saveOutfits,toggleItem,unlockedItems,visibleOutfits} from './outfit';
function seeded(seed:number){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
const difficulties:Difficulty[]=['Easy','Medium','Challenge'],stuck=[0,.2,.5,.999];
describe('word scramble',()=>{
 it('mixes the same letters into a different order, even with an unlucky shuffle',()=>{for(const word of ['CAT','LION','BANANA','SPONGEBOB'])for(const random of [seeded(4),...stuck.map(v=>()=>v)]){const letters=scrambleLetters(word,random);expect([...letters].sort()).toEqual([...word].sort());expect(letters.join('')).not.toBe(word)}});
 it('deals the right number of fitting words for every theme and level',()=>{for(const theme of themes)for(const difficulty of difficulties)for(let seed=1;seed<=10;seed++){const level=scrambleLevels[difficulty],p=generateScramble({theme:theme.id,difficulty},seeded(seed*31));expect(p.words).toHaveLength(level.count);expect(new Set(p.words.map(w=>w.word)).size).toBe(level.count);for(const w of p.words){expect(theme.words).toContain(w.word);expect(w.word.length).toBeGreaterThanOrEqual(level.min);expect(w.word.length).toBeLessThanOrEqual(level.max);expect(w.letters.join('')).not.toBe(w.word)}}});
 it('accepts the word or another theme word made from the same tiles, and nothing else',()=>{const p={theme:'fruits' as const,difficulty:'Easy' as const,words:[{word:'LEMON',letters:[...'MOLEN']}]};expect(isUnscrambled(p,0,'LEMON')).toBe(true);expect(isUnscrambled(p,0,'MELON')).toBe(true);expect(isUnscrambled(p,0,'MONEL')).toBe(false);expect(isUnscrambled(p,0,'PEACH')).toBe(false)});
});
describe('number patterns',()=>{
 it('follows its rule, hides one number, and offers four different choices including the answer',()=>{
  for(const difficulty of difficulties)for(let seed=1;seed<=200;seed++){
   const p=generatePattern(difficulty,seeded(seed*17));
   expect(p.terms).toHaveLength(5);expect(p.terms.every(n=>Number.isInteger(n)&&n>=0)).toBe(true);expect(p.answer).toBe(p.terms[p.blank]);expect(p.blank).toBeGreaterThanOrEqual(difficulty==='Easy'?2:1);expect(p.blank).toBeLessThan(5);
   expect(p.choices).toHaveLength(4);expect(new Set(p.choices).size).toBe(4);expect(p.choices).toContain(p.answer);expect(p.choices.every(n=>n>=0)).toBe(true);
   const jumps=p.terms.slice(1).map((n,i)=>n-p.terms[i]);
   if(/double/.test(p.rule))p.terms.slice(1).forEach((n,i)=>expect(n).toBe(p.terms[i]*2));
   else if(/bigger/.test(p.rule))jumps.slice(1).forEach((j,i)=>expect(j).toBe(jumps[i]+1));
   else{const m=p.rule.match(/go (up|down) by (\d+)/)!;expect(new Set(jumps)).toEqual(new Set([Number(m[2])*(m[1]==='up'?1:-1)]))}
   if(difficulty==='Easy'){expect([1,2,5,10]).toContain(jumps[0]);expect(Math.max(...p.terms)).toBeLessThanOrEqual(100)}
   if(difficulty!=='Challenge')expect(/go (up|down) by/.test(p.rule)).toBe(true);
  }
 });
 it('fills a game with the right number of patterns, even when the random source is stuck',()=>{for(const difficulty of difficulties){expect(generatePatterns({difficulty},seeded(9)).patterns).toHaveLength(patternLevels[difficulty].count);for(const v of stuck){const p=generatePatterns({difficulty},()=>v);expect(p.patterns).toHaveLength(patternLevels[difficulty].count);for(const q of p.patterns){expect(new Set(q.choices).size).toBe(4);expect(q.choices).toContain(q.answer)}}}});
});
describe('mini crossword',()=>{
 it('has clean clue banks',()=>{for(const t of crosswordThemes){expect(new Set(t.clues.map(c=>c[0])).size).toBe(t.clues.length);for(const [word,clue] of t.clues){expect(word).toMatch(/^[A-Z]{3,7}$/);expect(clue.length).toBeGreaterThan(8);expect(clue.toUpperCase()).not.toContain(word)}}});
 it('builds a connected grid where every run of letters is a clued word',()=>{
  for(const theme of crosswordThemes)for(const difficulty of difficulties)for(let seed=1;seed<=25;seed++){
   const cw=generateCrossword({theme:theme.id,difficulty},seeded(seed*101)),level=crosswordLevels[difficulty];
   expect(cw.entries).toHaveLength(level.words);expect(cw.rows).toBeLessThanOrEqual(level.span);expect(cw.cols).toBeLessThanOrEqual(level.span);expect(cw.letters).toHaveLength(cw.rows*cw.cols);
   expect(new Set(cw.entries.map(e=>e.word)).size).toBe(level.words);
   for(const e of cw.entries){expect(theme.clues).toContainEqual([e.word,e.clue]);expect(e.cells.map(i=>cw.letters[i]).join('')).toBe(e.word);expect(cw.numbers[e.cells[0]]).toBe(e.number);const stepSize=e.direction==='across'?1:cw.cols;e.cells.forEach((c,i)=>expect(c).toBe(e.cells[0]+stepSize*i));if(e.direction==='across')expect(Math.floor(e.cells[0]/cw.cols)).toBe(Math.floor(e.cells[e.cells.length-1]/cw.cols))}
   // Every horizontal or vertical run of two or more letters must be exactly one of the entries: no accidental words.
   const runs:string[]=[];
   for(let r=0;r<cw.rows;r++){let run:number[]=[];for(let c=0;c<=cw.cols;c++){if(c<cw.cols&&cw.letters[r*cw.cols+c])run.push(r*cw.cols+c);else{if(run.length>1)runs.push('across:'+run.join());run=[]}}}
   for(let c=0;c<cw.cols;c++){let run:number[]=[];for(let r=0;r<=cw.rows;r++){if(r<cw.rows&&cw.letters[r*cw.cols+c])run.push(r*cw.cols+c);else{if(run.length>1)runs.push('down:'+run.join());run=[]}}}
   expect(runs.sort()).toEqual(cw.entries.map(e=>`${e.direction}:${e.cells.join()}`).sort());
   // Every word crosses another, so the whole grid is one piece.
   for(const e of cw.entries)expect(cw.entries.some(o=>o!==e&&o.cells.some(c=>e.cells.includes(c)))).toBe(true);
   // Numbers count up in reading order with no gaps.
   const starts=cw.numbers.filter(n=>n>0);expect(starts).toEqual(starts.map((_,i)=>i+1));
   // No row or column of the grid is empty.
   for(let r=0;r<cw.rows;r++)expect(cw.letters.slice(r*cw.cols,(r+1)*cw.cols).some(Boolean)).toBe(true);
  }
 });
 it('still builds a full puzzle when the random source is stuck',()=>{for(const v of stuck)for(const theme of crosswordThemes)for(const difficulty of difficulties)expect(generateCrossword({theme:theme.id,difficulty},()=>v).entries).toHaveLength(crosswordLevels[difficulty].words)});
});
describe('color by number',()=>{
 it('draws ten-by-ten pictures with known paints',()=>{for(const p of pictures){expect(p.rows).toHaveLength(10);for(const row of p.rows){expect(row).toHaveLength(10);for(const ch of row)if(ch!=='.')expect(paints[ch]).toBeTruthy()}expect(new Set(p.rows.join('').replace(/\./g,'')).size).toBeGreaterThanOrEqual(2)}expect(new Set(pictures.map(p=>p.name)).size).toBe(pictures.length)});
 it('writes sums that match the level and work out to the paint number',()=>{
  for(const difficulty of difficulties)for(let n=colorLevels[difficulty].low;n<=colorLevels[difficulty].high;n++)for(let seed=1;seed<=30;seed++){
   const text=expression(n,difficulty,seeded(seed*13+n));expect(valueOf(text)).toBe(n);
   const parts=text.split(/[+−]/).map(Number);
   if(difficulty==='Easy')expect(text).toBe(String(n));
   if(difficulty==='Medium'){expect(text).toMatch(/^\d+\+\d+$/);expect(parts.every(x=>x>=1)).toBe(true)}
   if(difficulty==='Challenge'){expect(text).toMatch(/^\d+[+−]\d+$/);expect(parts.every(x=>x>=1&&x<=20)).toBe(true)}
  }
 });
 it('gives each paint its own number and each square a sum for its paint',()=>{
  for(const difficulty of difficulties)for(let seed=1;seed<=40;seed++){
   const p=generateColoring({difficulty},seeded(seed*7));
   expect(p.cells).toHaveLength(100);expect(new Set(p.colors.map(c=>c.number)).size).toBe(p.colors.length);
   for(const c of p.colors){expect(c.number).toBeGreaterThanOrEqual(colorLevels[difficulty].low);expect(c.number).toBeLessThanOrEqual(colorLevels[difficulty].high)}
   const used=new Set<string>();for(const cell of p.cells)if(cell){used.add(cell.key);expect(valueOf(cell.text)).toBe(p.colors.find(c=>c.key===cell.key)!.number)}
   expect([...used].sort()).toEqual(p.colors.map(c=>c.key).sort());expect(p.cells.filter(Boolean).length).toBeGreaterThanOrEqual(20);
  }
  for(const v of stuck)expect(generateColoring({difficulty:'Challenge'},()=>v).cells).toHaveLength(100);
 });
 it('shows every picture sooner or later',()=>{const seen=new Set<string>();for(let seed=1;seed<=200;seed++)seen.add(generateColoring({difficulty:'Easy'},seeded(seed*2654435761)).name);expect(seen.size).toBe(pictures.length)});
});
describe('progress for the newer activities',()=>{
 const memory=()=>{const values=new Map<string,string>();return {getItem:(k:string)=>values.get(k)||null,setItem:(k:string,v:string)=>{values.set(k,v)}}};
 const game=(activity:'scramble'|'patterns'|'crossword'|'colors',id:string):Result=>({id,date:'2026-01-05',correct:4,total:5,bestStreak:0,activity,settings:{difficulty:'Easy',theme:'animals',count:5},...score(4,5)});
 it('saves and counts each one',()=>{const store=memory();for(const a of ['scramble','patterns','crossword','colors'] as const)saveResult(store,game(a,a));expect(loadProgress(store).results).toHaveLength(4);expect(totals(loadProgress(store)).by).toEqual({scramble:1,patterns:1,crossword:1,colors:1})});
 it('files older results under math and discards unknown activities or broken settings',()=>{const store=memory();store.setItem(KEY,JSON.stringify({version:1,results:[{...game('scramble','x'),activity:'chess'},{...game('patterns','y'),settings:{difficulty:'Huge',count:5}},{...game('colors','z'),settings:{difficulty:'Easy',count:'many'}},{id:'old',date:'2026-01-01',correct:4,total:5,bestStreak:3,settings:{difficulty:'Easy',operation:'Mixed',mode:'Numbers',count:5},...score(4,5,3)}]}));expect(loadProgress(store).results.map(r=>r.id)).toEqual(['old']);expect(totals(loadProgress(store)).by).toEqual({math:1})});
});
describe('buddy outfits',()=>{
 const memory=()=>{const values=new Map<string,string>();return {getItem:(k:string)=>values.get(k)||null,setItem:(k:string,v:string)=>{values.set(k,v)}}};
 it('unlocks items in order as stars grow',()=>{expect(unlockedItems(0)).toEqual([]);expect(unlockedItems(3).map(i=>i.id)).toEqual(['hat']);expect(unlockedItems(15).map(i=>i.id)).toEqual(['hat','bow','glasses']);expect(unlockedItems(999)).toHaveLength(items.length);expect(items.map(i=>i.stars)).toEqual([...items.map(i=>i.stars)].sort((a,b)=>a-b));expect(new Set(items.map(i=>i.id)).size).toBe(items.length)});
 it('wears one item per slot and takes an item off when it is picked again',()=>{
  let o=toggleItem(noOutfits,'puppy','hat');expect(o).toEqual({puppy:['hat'],bunny:[]});
  o=toggleItem(o,'puppy','glasses');expect(o.puppy).toEqual(['hat','glasses']);
  // The crown and the party hat both go on the head, so the crown replaces the hat.
  o=toggleItem(o,'puppy','crown');expect(o.puppy).toEqual(['glasses','crown']);
  o=toggleItem(o,'bunny','crown');expect(o.bunny).toEqual(['crown']);
  o=toggleItem(o,'puppy','glasses');expect(o.puppy).toEqual(['crown']);expect(noOutfits).toEqual({puppy:[],bunny:[]});
 });
 it('shows only what the current stars have unlocked',()=>{expect(visibleOutfits({puppy:['hat','crown'],bunny:['cape']},10)).toEqual({puppy:['hat'],bunny:[]});expect(visibleOutfits({puppy:['hat','crown'],bunny:['cape']},60)).toEqual({puppy:['hat','crown'],bunny:['cape']})});
 it('round-trips through storage and ignores junk',()=>{const store=memory();saveOutfits(store,{puppy:['bow'],bunny:['flower','cape']});expect(loadOutfits(store)).toEqual({puppy:['bow'],bunny:['flower','cape']});for(const text of ['nope','null','[]','{"puppy":"hat"}','{"puppy":["hat","laser"],"bunny":5}']){store.setItem(OUTFIT_KEY,text)}expect(loadOutfits(store)).toEqual({puppy:['hat'],bunny:[]});store.setItem(OUTFIT_KEY,'nope');expect(loadOutfits(store)).toEqual(noOutfits)});
});
