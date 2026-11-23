import type {Difficulty} from './math';
export type MazeThemeId='garden'|'space'|'puppy'|'bunny'|'island'|'jungle'|'home'|'cheese';
export type MazeTheme={id:MazeThemeId;name:string;hero:string;goal:string;mission:string;wall:string;trail:string};
export type MazeSettings={theme:MazeThemeId;difficulty:Difficulty};
export type Direction='up'|'right'|'down'|'left';
/** `open[i]` is a bit mask of the directions you can walk from cell i (row-major). */
export type Maze={width:number;height:number;open:number[];start:number;goal:number;solution:number[];theme:MazeThemeId;difficulty:Difficulty};
export const bit:Record<Direction,number>={up:1,right:2,down:4,left:8};
const opposite:Record<Direction,Direction>={up:'down',right:'left',down:'up',left:'right'};
export const directions:Direction[]=['up','right','down','left'];
export const mazeThemes:MazeTheme[]=[
 {id:'garden',name:'Busy bee',hero:'🐝',goal:'🌸',mission:'Help the bee find the flower',wall:'#4f8a4b',trail:'#f2b632'},
 {id:'space',name:'Space trip',hero:'🚀',goal:'🪐',mission:'Fly the rocket to the planet',wall:'#4b4a8f',trail:'#8f7df0'},
 {id:'puppy',name:'Hungry puppy',hero:'🐶',goal:'🦴',mission:'Lead the puppy to the bone',wall:'#8a5a34',trail:'#e39a52'},
 {id:'bunny',name:'Bunny snack',hero:'🐰',goal:'🥕',mission:'Hop the bunny to the carrot',wall:'#7a5aa8',trail:'#f08a4b'},
 {id:'island',name:'Summer island',hero:'⛵',goal:'🏝️',mission:'Sail the boat to the island',wall:'#2f7f9c',trail:'#34b3c9'},
 {id:'jungle',name:'Jungle swing',hero:'🐵',goal:'🍌',mission:'Swing the monkey to the banana',wall:'#3f7a55',trail:'#d9a520'},
 {id:'home',name:'Way home',hero:'🚗',goal:'🏠',mission:'Drive the car back home',wall:'#5c6478',trail:'#e2574c'},
 {id:'cheese',name:'Cheese chase',hero:'🐭',goal:'🧀',mission:'Guide the mouse to the cheese',wall:'#8a6a2a',trail:'#b58cf0'}
];
export const mazeDefaults:MazeSettings={theme:'garden',difficulty:'Easy'};
export const mazeLevels:Record<Difficulty,{size:number}>={Easy:{size:6},Medium:{size:9},Challenge:{size:12}};
export const mazeThemeOf=(id:string)=>mazeThemes.find(t=>t.id===id)??mazeThemes[0];
/** The neighbouring cell in a direction, or -1 at the edge of the maze. */
export function neighbour(maze:{width:number;height:number},cell:number,d:Direction){
 const x=cell%maze.width,y=Math.floor(cell/maze.width);
 if(d==='up')return y>0?cell-maze.width:-1;
 if(d==='down')return y<maze.height-1?cell+maze.width:-1;
 if(d==='left')return x>0?cell-1:-1;
 return x<maze.width-1?cell+1:-1;
}
/** Where a step lands, or -1 when a wall or the edge is in the way. */
export function step(maze:Maze,cell:number,d:Direction){return maze.open[cell]&bit[d]?neighbour(maze,cell,d):-1}
/** The direction from one cell to a touching cell, if any. */
export function directionTo(maze:{width:number;height:number},from:number,to:number){return directions.find(d=>neighbour(maze,from,d)===to)??null}
/** Shortest walk between two cells, both included. Every maze here has exactly one. */
export function pathBetween(maze:Maze,from:number,to:number):number[]{
 const before=new Map<number,number>([[from,-1]]),queue=[from];
 for(let i=0;i<queue.length&&!before.has(to);i++)for(const d of directions){const n=step(maze,queue[i],d);if(n>=0&&!before.has(n)){before.set(n,queue[i]);queue.push(n)}}
 if(!before.has(to))return [];
 const path:number[]=[];for(let c=to;c!==-1;c=before.get(c)!)path.unshift(c);return path;
}
export function generateMaze(settings:MazeSettings,random:()=>number=Math.random):Maze{
 const size=mazeLevels[settings.difficulty].size,shape={width:size,height:size},open=Array<number>(size*size).fill(0),seen=new Set<number>([0]),stack=[0];
 // Carve passages by wandering to unvisited neighbours and backing up at dead ends: one route between any two cells, no loops.
 while(stack.length){
  const cell=stack[stack.length-1],choices=directions.filter(d=>{const n=neighbour(shape,cell,d);return n>=0&&!seen.has(n)});
  if(!choices.length){stack.pop();continue}
  const d=choices[Math.floor(random()*choices.length)],next=neighbour(shape,cell,d);
  open[cell]|=bit[d];open[next]|=bit[opposite[d]];seen.add(next);stack.push(next);
 }
 const maze:Maze={...shape,open,start:0,goal:0,solution:[],theme:settings.theme,difficulty:settings.difficulty};
 // The finish is the spot farthest from the start, so the walk is as long as this maze allows.
 let far=0,best:number[]=[0];
 for(let c=1;c<open.length;c++){const p=pathBetween(maze,0,c);if(p.length>best.length){best=p;far=c}}
 maze.goal=far;maze.solution=best;return maze;
}
/** Wall segments as [x1,y1,x2,y2] in cell units, for drawing. */
export function walls(maze:Maze){
 const out:[number,number,number,number][]=[];
 for(let c=0;c<maze.open.length;c++){const x=c%maze.width,y=Math.floor(c/maze.width);
  if(!(maze.open[c]&bit.up))out.push([x,y,x+1,y]);
  if(!(maze.open[c]&bit.left))out.push([x,y,x,y+1]);
  if(x===maze.width-1)out.push([x+1,y,x+1,y+1]);
  if(y===maze.height-1)out.push([x,y+1,x+1,y+1]);
 }
 return out;
}
