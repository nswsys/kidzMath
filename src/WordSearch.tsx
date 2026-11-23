import {useEffect,useRef,useState,type KeyboardEvent,type PointerEvent} from 'react';
import {ArrowLeft,ArrowRight,Check,Lightbulb,Search} from 'lucide-react';
import type {Difficulty} from './math';
import {Mascot} from './Mascot';
import type {Cue} from './sounds';
import {directionHelp,levels,lineBetween,matchWord,snapLine,themeOf,themes,type Cell,type Puzzle,type WordSettings} from './wordsearch';
const colors=['#ffd166','#a8e6cf','#c9b6ff','#ffb3c7','#9ad7ff','#ffc09f','#d4f08a','#f7b2ff','#8fe3e0','#ffe08a'];
const same=(a:Cell|null,b:Cell|null)=>!!a&&!!b&&a.r===b.r&&a.c===b.c;
const keyOf=(p:Cell)=>`${p.r}-${p.c}`;

export function WordSearchSetup({settings,onChange,onStart}:{settings:WordSettings;onChange:(next:WordSettings)=>void;onStart:()=>void}){
 return <section className="setup-card ws-setup" aria-label="Choose your word search">
  <div className="step-heading"><span className="step-number">1</span><h3>Pick a theme!</h3></div>
  <div className="ws-themes">{themes.map(t=><button key={t.id} aria-label={`${t.name}: ${t.blurb}`} aria-pressed={settings.theme===t.id} className={settings.theme===t.id?'chosen':''} onClick={()=>onChange({...settings,theme:t.id})}><span aria-hidden="true">{t.icon}</span><strong>{t.name}</strong>{settings.theme===t.id&&<span className="selected-tick"><Check size={13}/></span>}</button>)}</div>
  <fieldset className="ws-level"><legend><span className="step-number">2</span> Choose your power</legend><div className="segments levels">{(['Easy','Medium','Challenge'] as Difficulty[]).map((d,i)=><button key={d} onClick={()=>onChange({...settings,difficulty:d})} aria-pressed={settings.difficulty===d} className={settings.difficulty===d?'chosen':''}><span>{['🌱','🌿','🌳'][i]} {d}</span><small>{levels[d].words} words · {levels[d].size}×{levels[d].size}</small></button>)}</div></fieldset>
  <div className="start-row"><span><Search size={16}/> A fresh puzzle every time.</span><button className="primary start" onClick={onStart}>Find the words! <ArrowRight size={20}/></button></div>
 </section>;
}

export function WordSearchGame({puzzle,play,onLeave,onFinish}:{puzzle:Puzzle;play:(cue:Cue)=>void;onLeave:()=>void;onFinish:(outcome:{total:number;solo:number})=>void}){
 const [found,setFound]=useState<{word:string;cells:Cell[]}[]>([]),[hinted,setHinted]=useState<string[]>([]),[hintCell,setHintCell]=useState<Cell|null>(null),[anchor,setAnchor]=useState<Cell|null>(null),[preview,setPreview]=useState<Cell[]>([]),[cursor,setCursor]=useState<Cell>({r:0,c:0}),[message,setMessage]=useState('');
 const drag=useRef<{start:Cell;moved:boolean;cells:Cell[]}|null>(null),skipClick=useRef(false),gridRef=useRef<HTMLDivElement>(null),headingRef=useRef<HTMLHeadingElement>(null);
 const total=puzzle.placements.length,foundWords=found.map(f=>f.word),done=found.length===total,theme=themeOf(puzzle.theme);
 const tint=new Map<string,string>();found.forEach((f,i)=>f.cells.forEach(p=>{if(!tint.has(keyOf(p)))tint.set(keyOf(p),colors[i%colors.length])}));
 const selected=new Set(preview.map(keyOf));
 useEffect(()=>{headingRef.current?.focus({preventScroll:true})},[]);
 function check(cells:Cell[]){
  const word=cells.length>1?matchWord(puzzle,cells,foundWords):null;
  if(!word){play('tap');setMessage('Not one of our words yet. Keep hunting!');return}
  const next=[...found,{word,cells}];setFound(next);if(same(hintCell,cells[0])||same(hintCell,cells[cells.length-1]))setHintCell(null);
  play('correct');setMessage(next.length===total?`You found ${word}. That’s every word!`:`You found ${word}! ${total-next.length} to go.`);
 }
 function tap(cell:Cell){
  if(done)return;
  if(!anchor){play('tap');setAnchor(cell);setMessage('Now tap the last letter of the word.');return}
  if(same(anchor,cell)){setAnchor(null);setMessage('');return}
  const line=lineBetween(anchor,cell);
  if(!line){play('tap');setAnchor(cell);setMessage('Words go in a straight line. Start again from this letter.');return}
  setAnchor(null);check(line);
 }
 function cellAt(e:{clientX:number;clientY:number}):Cell|null{const el=document.elementFromPoint?.(e.clientX,e.clientY)?.closest<HTMLElement>('[data-r]');return el?{r:Number(el.dataset.r),c:Number(el.dataset.c)}:null}
 function down(cell:Cell){skipClick.current=false;if(!done)drag.current={start:cell,moved:false,cells:[cell]}}
 function move(e:PointerEvent){const d=drag.current;if(!d)return;const cell=cellAt(e);if(!cell||(!d.moved&&same(cell,d.start)))return;d.moved=true;d.cells=snapLine(d.start,cell,puzzle.size);setPreview(d.cells)}
 // The pointer may be released outside the grid, so the drag ends on the window.
 useEffect(()=>{const up=()=>{const d=drag.current;drag.current=null;if(!d?.moved)return;skipClick.current=true;setPreview([]);setAnchor(null);check(d.cells)};window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);return()=>{window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up)}});
 function arrows(e:KeyboardEvent){const step:Record<string,[number,number]>={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};const s=step[e.key];if(!s)return;e.preventDefault();const next={r:Math.min(puzzle.size-1,Math.max(0,cursor.r+s[0])),c:Math.min(puzzle.size-1,Math.max(0,cursor.c+s[1]))};setCursor(next);gridRef.current?.querySelector<HTMLElement>(`[data-r="${next.r}"][data-c="${next.c}"]`)?.focus()}
 function hint(){const target=puzzle.placements.find(p=>!foundWords.includes(p.word)&&!hinted.includes(p.word))??puzzle.placements.find(p=>!foundWords.includes(p.word));if(!target)return;play('tap');setHinted(h=>h.includes(target.word)?h:[...h,target.word]);setHintCell(target.cells[0]);setMessage(`${target.word} starts at the glowing letter.`)}
 return <section className={`game-shell ws-game ${done?'ws-done':''}`}>
  <div className="game-top"><button className="text-link" onClick={onLeave}><ArrowLeft size={18}/> Leave game</button><span className="game-context"><strong>{theme.icon} {theme.name} word search</strong><small>{puzzle.difficulty} · {total} words</small></span><span className="streak"><Search size={17}/>{found.length} of {total}</span></div>
  <div className="progress-track" role="progressbar" aria-label="Words found" aria-valuenow={found.length} aria-valuemin={0} aria-valuemax={total}><div style={{width:`${found.length/total*100}%`}}/></div>
  <div className="ws-layout">
   <div className="ws-board"><h1 ref={headingRef} tabIndex={-1} className="sr-only">{theme.name} word search</h1>
    <div ref={gridRef} className="ws-grid" role="group" aria-label={`Letter grid, ${puzzle.size} by ${puzzle.size}. Choose the first and last letter of a word.`} style={{gridTemplateColumns:`repeat(${puzzle.size},1fr)`,['--ws-size' as string]:puzzle.size}} onPointerMove={move} onKeyDown={arrows}>
     {puzzle.grid.map((row,r)=>row.map((letter,c)=>{const cell={r,c},k=keyOf(cell);return <button key={k} type="button" data-r={r} data-c={c} tabIndex={same(cursor,cell)?0:-1} aria-label={`${letter}, row ${r+1}, column ${c+1}${tint.has(k)?', found':''}`} aria-pressed={same(anchor,cell)} className={`ws-cell ${tint.has(k)?'found':''} ${selected.has(k)?'selected':''} ${same(anchor,cell)?'anchor':''} ${same(hintCell,cell)?'hint-glow':''}`} style={tint.has(k)?{background:tint.get(k)}:undefined} onPointerDown={()=>down(cell)} onFocus={()=>setCursor(cell)} onClick={()=>{if(skipClick.current){skipClick.current=false;return}tap(cell)}}>{letter}</button>}))}
    </div>
   </div>
   <aside className="ws-side">
    <div className="ws-words-head"><span className="eyebrow green">WORDS TO FIND</span>{!done&&<button className="hint-button" onClick={hint}><Lightbulb size={18}/><span>Hint</span></button>}</div>
    <ul className="ws-words" aria-label="Words to find">{puzzle.placements.map(p=>{const i=foundWords.indexOf(p.word);return <li key={p.word} className={i>=0?'found':''} style={i>=0?{background:colors[i%colors.length]}:undefined}>{p.word}{i>=0&&<><Check size={14} aria-hidden="true"/><span className="sr-only"> found</span></>}</li>})}</ul>
    <div className="ws-status" role="status">{done?<div className="ws-cheer"><span className="cheer-buddy" aria-hidden="true"><Mascot happy/></span><div><strong className="cheer-title">Word wizard!</strong><span>{message}</span></div></div>:<span>{message||'Drag across a word, or tap its first and last letter.'}</span>}</div>
    {done&&<button className="primary full" onClick={()=>onFinish({total,solo:puzzle.placements.filter(p=>!hinted.includes(p.word)).length})}>See my stars <ArrowRight size={19}/></button>}
   </aside>
  </div>
 </section>;
}

/** The printable puzzle: a letter grid, a word list to tick off, and an optional answer key on its own page. */
function SheetGrid({puzzle,answers=false}:{puzzle:Puzzle;answers?:boolean}){
 const key=new Set(answers?puzzle.placements.flatMap(p=>p.cells.map(keyOf)):[]);
 return <div className="ws-sheet-board"><div className={`ws-sheet-grid ${answers?'answers':''}`} role="img" aria-label={answers?`Answer grid with the ${puzzle.placements.length} hidden words shaded`:`Letter grid, ${puzzle.size} by ${puzzle.size}`} style={{gridTemplateColumns:`repeat(${puzzle.size},1fr)`,['--ws-size' as string]:puzzle.size}}>{puzzle.grid.map((row,r)=>row.map((letter,c)=><span key={`${r}-${c}`} aria-hidden="true" className={key.has(`${r}-${c}`)?'answer':''}>{letter}</span>))}</div></div>;
}
export function WordSearchSheet({puzzle,answerKey}:{puzzle:Puzzle;answerKey:boolean}){
 const theme=themeOf(puzzle.theme);
 return <article className="worksheet-paper ws-sheet"><div className="print-brand">kidzMath<span>Little steps. Big discoveries.</span></div><h2>My word search: {theme.name} <span aria-hidden="true">{theme.icon}</span></h2><p>Find and circle the {puzzle.placements.length} hidden words. {directionHelp[puzzle.difficulty]}</p><div className="name-line"><span>Name: ___________________</span><span>Date: ______________</span></div>
  <SheetGrid puzzle={puzzle}/>
  <ul className="ws-sheet-words" aria-label="Words to find">{puzzle.placements.map(p=><li key={p.word}><span className="ws-sheet-box" aria-hidden="true"/>{p.word}</li>)}</ul>
  <p className="paper-footer">Every word you find helps your brain grow. — Milo & Luna ♡</p>
  {answerKey&&<section className="answer-key ws-sheet-key"><h2>Answer key · Grown-ups & helpers</h2><SheetGrid puzzle={puzzle} answers/></section>}
 </article>;
}
