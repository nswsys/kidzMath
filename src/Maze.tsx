import {useEffect,useRef,useState,type PointerEvent} from 'react';
import {ArrowDown,ArrowLeft,ArrowRight,ArrowUp,Check,Map as MapIcon,RotateCcw} from 'lucide-react';
import type {Difficulty} from './math';
import {AskBuddy,Buddy,PaperBuddy,useSay,type Animal} from './GameShell';
import {Mascot} from './Mascot';
import type {Cue} from './sounds';
import {directionTo,mazeLevels,mazeThemeOf,mazeThemes,pathBetween,step,walls,type Direction,type Maze,type MazeSettings} from './maze';
/** A maze has no wrong answers; each hint takes one of these five "tries" away when stars are counted. */
export const MAZE_TRIES=5;
const HINT_STEPS=4;
const centre=(maze:Maze,cell:number)=>[cell%maze.width+.5,Math.floor(cell/maze.width)+.5] as const;
const points=(maze:Maze,cells:number[])=>cells.map(c=>centre(maze,c).join(',')).join(' ');

/** The maze drawing shared by the game and the printed page. */
function MazeArt({maze,trail,hint,solution,hero,label}:{maze:Maze;trail?:number[];hint?:number[];solution?:boolean;hero?:number;label:string}){
 const theme=mazeThemeOf(maze.theme),[sx,sy]=centre(maze,maze.start),[gx,gy]=centre(maze,maze.goal),at=hero??maze.start,[hx,hy]=centre(maze,at);
 return <svg className="mz-art" viewBox={`-0.3 -0.3 ${maze.width+.6} ${maze.height+.6}`} role="img" aria-label={label} style={{['--mz-wall' as string]:theme.wall,['--mz-trail' as string]:theme.trail}}>
  <rect className="mz-floor" x="0" y="0" width={maze.width} height={maze.height} rx=".25"/>
  <circle className="mz-spot start" cx={sx} cy={sy} r=".4"/><circle className="mz-spot goal" cx={gx} cy={gy} r=".4"/>
  {solution&&<polyline className="mz-solution" points={points(maze,maze.solution)}/>}
  {trail&&trail.length>1&&<polyline className="mz-trail" points={points(maze,trail)}/>}
  {hint&&hint.length>1&&<polyline className="mz-hint" points={points(maze,hint)}/>}
  {walls(maze).map(([x1,y1,x2,y2])=><line className="mz-wall" key={`${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2}/>)}
  <text className="mz-emoji" x={gx} y={gy} aria-hidden="true">{theme.goal}</text>
  {maze.theme==='puppy'||maze.theme==='bunny'?<g className="mz-buddy" aria-hidden="true"><Mascot animal={maze.theme} happy={at===maze.goal} box={{x:hx-.42,y:hy-.56,width:.84,height:.98}}/></g>:<text className={`mz-emoji mz-hero ${at===maze.goal?'home':''}`} x={hx} y={hy} aria-hidden="true">{theme.hero}</text>}
 </svg>;
}

export function MazeSetup({settings,onChange,onStart}:{settings:MazeSettings;onChange:(next:MazeSettings)=>void;onStart:()=>void}){
 return <section className="setup-card mz-setup" aria-label="Choose your maze">
  <div className="step-heading"><span className="step-number">1</span><h3>Pick a mission!</h3></div>
  <div className="ws-themes mz-themes">{mazeThemes.map(t=><button key={t.id} aria-label={`${t.name}: ${t.mission}`} aria-pressed={settings.theme===t.id} className={settings.theme===t.id?'chosen':''} onClick={()=>onChange({...settings,theme:t.id})}><span aria-hidden="true">{t.hero}<i>→</i>{t.goal}</span><strong>{t.name}</strong>{settings.theme===t.id&&<span className="selected-tick"><Check size={13}/></span>}</button>)}</div>
  <fieldset className="ws-level"><legend><span className="step-number">2</span> Choose your power</legend><div className="segments levels">{(['Easy','Medium','Challenge'] as Difficulty[]).map((d,i)=><button key={d} onClick={()=>onChange({...settings,difficulty:d})} aria-pressed={settings.difficulty===d} className={settings.difficulty===d?'chosen':''}><span>{['🌱','🌿','🌳'][i]} {d}</span><small>{mazeLevels[d].size}×{mazeLevels[d].size} paths</small></button>)}</div></fieldset>
  <div className="start-row"><span><MapIcon size={16}/> A fresh maze every time.</span><button className="primary start" onClick={onStart}>Enter the maze! <ArrowRight size={20}/></button></div>
 </section>;
}

export function MazeGame({maze,play,onLeave,onFinish}:{maze:Maze;play:(cue:Cue)=>void;onLeave:()=>void;onFinish:(outcome:{hints:number;steps:number})=>void}){
 // Milo guides the mazes, except when he is the one walking through it; then Luna cheers him on.
 const theme=mazeThemeOf(maze.theme),guide:Animal=maze.theme==='puppy'?'bunny':'puppy';
 const [trail,setTrail]=useState<number[]>([maze.start]),[hint,setHint]=useState<number[]>([]),[hints,setHints]=useState(0);
 const [note,setMessage]=useSay(),message=note.text;
 const headingRef=useRef<HTMLHeadingElement>(null),boardRef=useRef<HTMLDivElement>(null),dragging=useRef(false),latest=useRef(trail);latest.current=trail;
 const here=trail[trail.length-1],done=here===maze.goal,left=pathBetween(maze,here,maze.goal).length-1,total=maze.solution.length-1;
 useEffect(()=>{headingRef.current?.focus({preventScroll:true})},[]);
 /** Walk to a touching cell: stepping back onto the trail rubs it out, anywhere else extends it. */
 function walk(path:number[]){
  let next=latest.current;
  for(const cell of path)next=next.length>1&&next[next.length-2]===cell?next.slice(0,-1):[...next,cell];
  if(next===latest.current)return;
  latest.current=next;setTrail(next);
  const at=next[next.length-1];setHint(h=>h.includes(at)?h.slice(h.indexOf(at)):[]);
  if(at===maze.goal){play('correct');setMessage(`You made it to the ${theme.goal}!`,'happy')}else setMessage('');
 }
 function move(d:Direction){
  if(done)return;
  const next=step(maze,here,d);
  if(next<0){setMessage(`There’s a wall ${d==='up'?'above':d==='down'?'below':`on the ${d}`}. Try another way.`,'oops');return}
  play('tap');walk([next]);
 }
 function cellAt(e:PointerEvent){const box=boardRef.current?.querySelector('svg')?.getBoundingClientRect();if(!box||!box.width)return -1;const unit=box.width/(maze.width+.6),x=Math.floor((e.clientX-box.left)/unit-.3),y=Math.floor((e.clientY-box.top)/unit-.3);return x<0||y<0||x>=maze.width||y>=maze.height?-1:y*maze.width+x}
 /** Follow the finger while it stays on a straight open corridor from the hero, so fast drags do not skip squares. */
 function follow(e:PointerEvent){
  if(!dragging.current||latest.current[latest.current.length-1]===maze.goal)return;
  const target=cellAt(e),from=latest.current[latest.current.length-1];if(target<0||target===from)return;
  const sameRow=Math.floor(target/maze.width)===Math.floor(from/maze.width),sameColumn=target%maze.width===from%maze.width;if(!sameRow&&!sameColumn)return;
  const d:Direction=sameRow?(target>from?'right':'left'):(target>from?'down':'up'),path:number[]=[];
  for(let at=from;at!==target;){const next=step(maze,at,d);if(next<0)return;path.push(next);at=next}
  walk(path);
 }
 // Arrow keys are heard on the window so they keep working when the focused button disappears or is disabled.
 useEffect(()=>{const keys=(e:globalThis.KeyboardEvent)=>{const map:Record<string,Direction>={ArrowUp:'up',ArrowRight:'right',ArrowDown:'down',ArrowLeft:'left'};const d=map[e.key];if(d&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!document.querySelector('dialog[open]')){e.preventDefault();move(d)}};window.addEventListener('keydown',keys);return()=>window.removeEventListener('keydown',keys)});
 function showHint(){if(done)return;play('tap');const way=pathBetween(maze,here,maze.goal).slice(0,HINT_STEPS+1);setHint(way);setHints(h=>h+1);const d=directionTo(maze,way[0],way[1]);setMessage(`Follow the glowing path. Start by going ${d}.`)}
 function restart(){if(done||trail.length<2)return;play('tap');latest.current=[maze.start];setTrail([maze.start]);setHint([]);setMessage('Back at the start. Off we go again!')}
 return <section className={`game-shell mz-game ${done?'mz-done':''}`}>
  <div className="game-top"><button className="text-link" onClick={onLeave}><ArrowLeft size={18}/> Leave game</button><span className="game-context"><strong>{theme.hero} {theme.name} maze</strong><small>{maze.difficulty} · {theme.mission}</small></span><span className="streak"><MapIcon size={17}/>{done?'Arrived!':`${left} to go`}</span></div>
  <div className="progress-track" role="progressbar" aria-label="Distance to the finish" aria-valuenow={total-left} aria-valuemin={0} aria-valuemax={total}><div style={{width:`${(total-left)/total*100}%`}}/></div>
  <div className="mz-layout">
   <div ref={boardRef} className="mz-board" onPointerDown={e=>{dragging.current=true;follow(e)}} onPointerMove={follow} onPointerUp={()=>{dragging.current=false}} onPointerCancel={()=>{dragging.current=false}} onPointerLeave={e=>{if(e.pointerType==='mouse')dragging.current=false}}><h1 ref={headingRef} tabIndex={-1} className="sr-only">{theme.name} maze</h1>
    <MazeArt maze={maze} trail={trail} hint={hint} hero={here} label={`${theme.mission}. A ${maze.width} by ${maze.height} maze. Use the arrow buttons or arrow keys to move.`}/>
   </div>
   <aside className="mz-side">
    <div className="ws-words-head"><span className="eyebrow green">{theme.mission.toUpperCase()}</span></div>
    {!done&&<div className="mz-pad" role="group" aria-label="Move">{([['up',ArrowUp],['left',ArrowLeft],['right',ArrowRight],['down',ArrowDown]] as const).map(([d,Icon])=><button key={d} type="button" className={`mz-${d}`} aria-label={`Move ${d}`} onClick={()=>move(d)}><Icon size={26}/></button>)}</div>}
    {!done&&<div className="mz-tools"><AskBuddy animal={guide} onClick={showHint}/><button className="hint-button" onClick={restart} disabled={trail.length<2}><RotateCcw size={17}/><span>Start over</span></button></div>}
    <div className="ws-status" role="status"><Buddy animal={guide} mood={done?'happy':note.mood} title={done?'Maze master!':undefined} text={message||'Drag along the path, or use the arrows.'}/></div>
    {done&&<button className="primary full" onClick={()=>onFinish({hints,steps:total})}>See my stars <ArrowRight size={19}/></button>}
   </aside>
  </div>
 </section>;
}

/** Printable maze with an optional solution on its own page. */
export function MazeSheet({maze,answerKey}:{maze:Maze;answerKey:boolean}){
 const theme=mazeThemeOf(maze.theme);
 return <article className="worksheet-paper mz-sheet"><div className="print-brand">kidzMath<span>Little steps. Big discoveries.</span></div><h2>My maze: {theme.name} <span aria-hidden="true">{theme.hero}</span></h2><PaperBuddy animal="puppy">{theme.mission}! Draw a line from {theme.hero} to {theme.goal} without crossing any walls.</PaperBuddy><div className="name-line"><span>Name: ___________________</span><span>Date: ______________</span></div>
  <div className="mz-sheet-art"><MazeArt maze={maze} label={`${theme.mission}. A ${maze.width} by ${maze.height} maze.`}/></div>
  <p className="paper-footer">Every path you try helps your brain grow. — Milo & Luna ♡</p>
  {answerKey&&<section className="answer-key mz-sheet-key"><h2>Answer key · Grown-ups & helpers</h2><div className="mz-sheet-art"><MazeArt maze={maze} solution label="The maze with the way through drawn in"/></div></section>}
 </article>;
}
