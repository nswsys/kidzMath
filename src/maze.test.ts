import {describe,it,expect} from 'vitest';
import type {Difficulty} from './math';
import {score} from './math';
import {bit,directionTo,directions,generateMaze,mazeLevels,mazeThemes,neighbour,pathBetween,step,walls} from './maze';
import {KEY,loadProgress,saveResult,totals,type Result} from './progress';
function seeded(seed:number){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
const difficulties:Difficulty[]=['Easy','Medium','Challenge'];
describe('maze generation',()=>{
 it('connects every cell with exactly one route and agrees on both sides of each opening',()=>{
  for(const difficulty of difficulties)for(let seed=1;seed<=30;seed++){
   const maze=generateMaze({theme:'garden',difficulty},seeded(seed*7907)),size=mazeLevels[difficulty].size,cells=size*size;
   expect(maze.width).toBe(size);expect(maze.height).toBe(size);expect(maze.open).toHaveLength(cells);
   let passages=0;
   for(let c=0;c<cells;c++)for(const d of directions){const n=neighbour(maze,c,d);if(maze.open[c]&bit[d]){expect(n).toBeGreaterThanOrEqual(0);expect(directionTo(maze,n,c)).not.toBe(null);expect(step(maze,n,directionTo(maze,n,c)!)).toBe(c);passages++}}
   // A connected maze with cells-1 passages is a tree: no loops, so one route between any two cells.
   expect(passages/2).toBe(cells-1);
   for(let c=0;c<cells;c++)expect(pathBetween(maze,maze.start,c).length).toBeGreaterThan(0);
  }
 });
 it('puts the finish at the farthest cell and stores a walkable solution',()=>{
  for(const difficulty of difficulties)for(let seed=1;seed<=20;seed++){
   const maze=generateMaze({theme:'space',difficulty},seeded(seed));
   expect(maze.start).toBe(0);expect(maze.goal).not.toBe(maze.start);expect(maze.solution[0]).toBe(maze.start);expect(maze.solution[maze.solution.length-1]).toBe(maze.goal);
   for(let i=1;i<maze.solution.length;i++){const d=directionTo(maze,maze.solution[i-1],maze.solution[i]);expect(d).not.toBe(null);expect(step(maze,maze.solution[i-1],d!)).toBe(maze.solution[i])}
   for(let c=0;c<maze.open.length;c++)expect(pathBetween(maze,maze.start,c).length).toBeLessThanOrEqual(maze.solution.length);
   expect(maze.solution.length).toBeGreaterThanOrEqual(mazeLevels[difficulty].size*2-1);
  }
 });
 it('finishes with a stuck random source and varies otherwise',()=>{for(const value of [0,.2,.999])expect(generateMaze({theme:'home',difficulty:'Challenge'},()=>value).solution.length).toBeGreaterThan(1);expect(generateMaze({theme:'home',difficulty:'Medium'},seeded(1)).open).not.toEqual(generateMaze({theme:'home',difficulty:'Medium'},seeded(2)).open)});
 it('draws a closed outer border and a wall wherever a step is blocked',()=>{
  const maze=generateMaze({theme:'island',difficulty:'Easy'},seeded(5)),all=walls(maze).map(w=>w.join()),size=maze.width;
  for(let i=0;i<size;i++){expect(all).toContain([i,0,i+1,0].join());expect(all).toContain([i,size,i+1,size].join());expect(all).toContain([0,i,0,i+1].join());expect(all).toContain([size,i,size,i+1].join())}
  expect(new Set(all).size).toBe(all.length);expect(all.length).toBe(4*size+(2*size*(size-1)-(size*size-1)));
 });
 it('gives every theme a hero, a goal, and a mission',()=>{expect(new Set(mazeThemes.map(t=>t.id)).size).toBe(mazeThemes.length);for(const t of mazeThemes){expect(t.hero).toBeTruthy();expect(t.goal).toBeTruthy();expect(t.hero).not.toBe(t.goal);expect(t.mission.length).toBeGreaterThan(10)}});
});
describe('maze progress',()=>{
 const memory=()=>{const values=new Map<string,string>();return {getItem:(k:string)=>values.get(k)||null,setItem:(k:string,v:string)=>{values.set(k,v)}}};
 const game:Result={id:'m1',date:'2026-01-04',correct:4,total:5,bestStreak:0,activity:'maze',settings:{theme:'garden',difficulty:'Medium',count:31},...score(4,5)};
 it('saves mazes beside other games and counts them',()=>{const store=memory();saveResult(store,game);expect(loadProgress(store).results).toEqual([game]);expect(totals(loadProgress(store))).toMatchObject({games:1,mazes:1,words:0,boxes:0,stars:2})});
 it('discards maze results with broken settings',()=>{const store=memory();store.setItem(KEY,JSON.stringify({version:1,results:[{...game,settings:{difficulty:'Medium',count:31}},{...game,id:'m2',settings:{theme:'garden',difficulty:'Giant',count:31}}]}));expect(loadProgress(store).results).toEqual([])});
});
