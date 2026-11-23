import {useEffect,useRef,useState,type PointerEvent} from 'react';
import {ArrowRight,Palette} from 'lucide-react';
import {Cheer,GameShell,type GameProps} from './GameShell';
import {colorLevels,type ColorPuzzle} from './colorbynumber';
/** Stars use a score out of ten: the share of squares painted without a wrong tap. */
const SCORE=10;
const article=(name:string)=>/^[aeiou]/.test(name)?'an':'a';
export function ColorGame({puzzle,play,onLeave,onFinish}:GameProps<ColorPuzzle>){
 const squares=puzzle.cells.flatMap((c,i)=>c?[i]:[]);
 const [brush,setBrush]=useState(puzzle.colors[0].key),[painted,setPainted]=useState<number[]>([]),[missed,setMissed]=useState<number[]>([]),[message,setMessage]=useState('');
 const dragging=useRef(false),moved=useRef(false),latest=useRef(painted);latest.current=painted;
 const done=painted.length===squares.length,paint=puzzle.colors.find(c=>c.key===brush)!,left=(key:string)=>squares.filter(i=>puzzle.cells[i]!.key===key&&!painted.includes(i)).length;
 /** A tap on the wrong square is a mistake; a drag simply skips squares that do not match the brush. */
 function attempt(i:number,tapped:boolean){
  const cell=puzzle.cells[i];if(!cell||latest.current.includes(i)||latest.current.length===squares.length)return;
  if(cell.key===brush){
   const next=[...latest.current,i];latest.current=next;setPainted(next);
   if(next.length===squares.length){play('correct');setMessage(`It’s ${article(puzzle.name)} ${puzzle.name}!`)}else{if(tapped)play('tap');setMessage('')}
  }else if(tapped){play('tryAgain');setMissed(m=>m.includes(i)?m:[...m,i]);setMessage(`That square is not ${paint.number}. Work it out again!`)}
 }
 function drag(e:PointerEvent){if(!dragging.current)return;const el=document.elementFromPoint?.(e.clientX,e.clientY)?.closest<HTMLElement>('[data-i]');if(!el)return;moved.current=true;attempt(Number(el.dataset.i),false)}
 useEffect(()=>{const up=()=>{dragging.current=false};window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);return()=>{window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up)}},[]);
 return <GameShell className={`cb-game ${done?'cb-done':''}`} title="🎨 Color by number" subtitle={`${puzzle.difficulty} · ${colorLevels[puzzle.difficulty].note}`} pill={<><Palette size={17}/>{painted.length} of {squares.length}</>} value={painted.length} max={squares.length} barLabel="Squares painted" onLeave={onLeave}>
  <div className="cb-layout">
   <div className="cb-board"><div className="cb-grid" role="group" aria-label={done?`Finished picture: ${puzzle.name}`:'Mystery picture. Paint each square with the color for its answer.'} onPointerDown={()=>{dragging.current=true;moved.current=false}} onPointerMove={drag}>{puzzle.cells.map((cell,i)=>{if(!cell)return <span key={i} className="cb-blank" aria-hidden="true"/>;const on=painted.includes(i),ink=puzzle.colors.find(c=>c.key===cell.key)!;return <button key={i} type="button" data-i={i} disabled={done} className={`cb-cell ${on?'on':''} ${missed.includes(i)&&!on?'missed':''}`} style={on?{background:ink.hex,color:ink.ink}:undefined} aria-label={`Row ${Math.floor(i/puzzle.size)+1}, column ${i%puzzle.size+1}: ${cell.text.replace('+',' plus ').replace('−',' minus ')}${on?`, painted ${ink.name}`:''}`} onClick={()=>{if(moved.current){moved.current=false;return}attempt(i,true)}}>{done?'':cell.text}</button>})}</div></div>
   <aside className="cb-side">
    <span className="eyebrow green">{done?'ALL PAINTED':'PICK A COLOR, THEN PAINT ITS ANSWER'}</span>
    {!done&&<div className="cb-palette" role="group" aria-label="Colors">{puzzle.colors.map(c=><button key={c.key} type="button" aria-pressed={brush===c.key} aria-label={`${c.number}: ${c.name}${left(c.key)?'':', finished'}`} className={`${brush===c.key?'chosen':''} ${left(c.key)?'':'finished'}`} onClick={()=>{play('tap');setBrush(c.key);setMessage('')}}><span className="cb-swatch" style={{background:c.hex,color:c.ink}}>{c.number}</span><span>{c.name}</span></button>)}</div>}
    <div className="ws-status" role="status">{done?<Cheer title="Super artist!" text={message} animal="bunny"/>:<span>{message||`Paint every square that equals ${paint.number} with ${paint.name}.`}</span>}</div>
    {done&&<button className="primary full" onClick={()=>onFinish({total:SCORE,solo:Math.round(SCORE*(squares.length-missed.length)/squares.length),count:squares.length})}>See my stars <ArrowRight size={19}/></button>}
   </aside>
  </div>
 </GameShell>;
}
export function ColorSheet({puzzle,answerKey}:{puzzle:ColorPuzzle;answerKey:boolean}){
 return <article className="worksheet-paper cb-sheet"><div className="print-brand">kidzMath<span>Little steps. Big discoveries.</span></div><h2>My color by number <span aria-hidden="true">🎨</span></h2><p>{puzzle.difficulty==='Easy'?'Color each square to match its number.':'Work out each square, then color it to match the answer.'} Leave the empty squares white. What picture will you find?</p><div className="name-line"><span>Name: ___________________</span><span>Date: ______________</span></div>
  <ul className="cb-key" aria-label="Color key">{puzzle.colors.map(c=><li key={c.key}><b>{c.number}</b> = <span className="cb-dot" style={{background:c.hex}} aria-hidden="true"/> {c.name}</li>)}</ul>
  <div className="cb-paper-board"><div className="cb-grid cb-paper" role="img" aria-label="Grid of squares to color in">{puzzle.cells.map((cell,i)=><span key={i} className={cell?'cb-cell':'cb-blank'} aria-hidden="true">{cell?.text}</span>)}</div></div>
  <p className="paper-footer">Every square you color helps your brain grow. — Milo & Luna ♡</p>
  {answerKey&&<section className="answer-key cb-sheet-key"><h2>Answer key · It’s {article(puzzle.name)} {puzzle.name}!</h2><div className="cb-paper-board"><div className="cb-grid cb-paper answers" role="img" aria-label={`The finished picture: ${puzzle.name}`}>{puzzle.cells.map((cell,i)=><span key={i} className={cell?'cb-cell':'cb-blank'} style={cell?{background:puzzle.colors.find(c=>c.key===cell.key)!.hex}:undefined} aria-hidden="true"/>)}</div></div></section>}
 </article>;
}
