import {useState} from 'react';
import {ArrowRight,Delete,Grid3x3,Lightbulb} from 'lucide-react';
import {Cheer,GameShell,useWindowKeys,type GameProps} from './GameShell';
import {clueThemeOf,type Crossword,type Entry} from './crossword';
const rows=['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'];
const label=(e:Entry)=>`${e.number} ${e.direction==='across'?'Across':'Down'}`;
function Clues({puzzle,active,onPick,solved}:{puzzle:Crossword;active?:number;onPick?:(i:number)=>void;solved?:(e:Entry)=>boolean}){
 return <div className="cw-clues">{(['across','down'] as const).map(direction=><div key={direction}><h3>{direction==='across'?'Across →':'Down ↓'}</h3><ol>{puzzle.entries.map((e,i)=>e.direction!==direction?null:<li key={i} className={`${active===i?'active':''} ${solved?.(e)?'done':''}`}>{onPick?<button type="button" aria-current={active===i} onClick={()=>onPick(i)}><b>{e.number}</b> {e.clue}</button>:<span><b>{e.number}</b> {e.clue} <i>({e.word.length} letters)</i></span>}</li>)}</ol></div>)}</div>;
}
export function CrosswordGame({puzzle,play,onLeave,onFinish}:GameProps<Crossword>){
 const theme=clueThemeOf(puzzle.theme),total=puzzle.entries.length;
 const [values,setValues]=useState<string[]>(()=>puzzle.letters.map(()=>'')),[sel,setSel]=useState(0),[pos,setPos]=useState(0),[hinted,setHinted]=useState<number[]>([]),[helped,setHelped]=useState<string[]>([]),[message,setMessage]=useState('');
 const right=(vals:string[],e:Entry)=>e.cells.every(c=>vals[c]===puzzle.letters[c]);
 const lockedIn=(vals:string[],hints:number[],c:number)=>hints.includes(c)||puzzle.entries.some(e=>e.cells.includes(c)&&right(vals,e));
 const entry=puzzle.entries[sel],cursor=entry.cells[pos],solvedCount=puzzle.entries.filter(e=>right(values,e)).length,done=solvedCount===total;
 const full=entry.cells.every(c=>values[c]),off=full&&!right(values,entry);
 /** After a change: celebrate a finished word and move on to the next unfinished one. */
 function settle(vals:string[],hints:number[],from:number){
  const e=puzzle.entries[sel];
  if(puzzle.entries.every(x=>right(vals,x))){play('correct');setMessage('Every word is in. You finished the crossword!');return}
  if(right(vals,e)){
   play('correct');setMessage(`${e.word} fits! Great reading.`);
   const order=[...puzzle.entries.keys()],next=[...order.slice(sel+1),...order.slice(0,sel)].find(i=>!right(vals,puzzle.entries[i]));
   if(next!==undefined){setSel(next);setPos(Math.max(0,puzzle.entries[next].cells.findIndex(c=>!lockedIn(vals,hints,c))))}
   return;
  }
  const open=[...e.cells.keys()].filter(i=>!lockedIn(vals,hints,e.cells[i])),ahead=open.find(i=>i>from&&!vals[e.cells[i]])??open.find(i=>!vals[e.cells[i]]);
  if(ahead!==undefined){setPos(ahead);setMessage('')}
  else setMessage(`Almost! One letter in ${label(e)} needs a change.`);
 }
 function type(letter:string){
  if(done)return;
  let at=pos;if(lockedIn(values,hinted,entry.cells[at])){const free=entry.cells.findIndex((c,i)=>i>at&&!lockedIn(values,hinted,c));if(free<0)return;at=free}
  play('tap');const vals=values.map((v,i)=>i===entry.cells[at]?letter:v);setValues(vals);setPos(at);settle(vals,hinted,at);
 }
 function erase(){
  if(done)return;
  const free=(i:number)=>!lockedIn(values,hinted,entry.cells[i]);
  // Rub out the letter under the cursor, or step back to the one before it.
  let at=pos;if(!free(at)||!values[entry.cells[at]]){const back=[...entry.cells.keys()].reverse().find(i=>i<pos&&free(i));if(back===undefined)return;at=back}
  play('tap');setValues(v=>v.map((x,i)=>i===entry.cells[at]?'':x));setPos(at);setMessage('');
 }
 function pickCell(cell:number){
  if(done)return;
  const here=puzzle.entries.flatMap((e,i)=>e.cells.includes(cell)?[i]:[]);if(!here.length)return;
  // Tapping the same square again flips between its across and down words.
  const next=here.includes(sel)&&cursor===cell&&here.length>1?here.find(i=>i!==sel)!:here.includes(sel)?sel:here.find(i=>!right(values,puzzle.entries[i]))??here[0];
  setSel(next);setPos(puzzle.entries[next].cells.indexOf(cell));setMessage('');
 }
 function pickEntry(i:number){if(done)return;setSel(i);setPos(Math.max(0,puzzle.entries[i].cells.findIndex(c=>!lockedIn(values,hinted,c)&&!values[c])));setMessage('')}
 function hint(){
  if(done)return;
  const wrong=(c:number)=>values[c]!==puzzle.letters[c],target=wrong(cursor)?cursor:entry.cells.find(wrong);if(target===undefined)return;
  play('tap');const vals=values.map((v,i)=>i===target?puzzle.letters[target]!:v),hints=[...hinted,target];
  setValues(vals);setHinted(hints);setHelped(h=>[...new Set([...h,...puzzle.entries.filter(e=>e.cells.includes(target)).map(e=>e.word)])]);setMessage(`That square is ${puzzle.letters[target]}.`);
  const at=entry.cells.indexOf(target);setPos(at);
  if(puzzle.entries.some(e=>right(vals,e)&&!right(values,e)))settle(vals,hints,at);else{const open=[...entry.cells.keys()].find(i=>i>at&&!lockedIn(vals,hints,entry.cells[i])&&!vals[entry.cells[i]]);if(open!==undefined)setPos(open)}
 }
 useWindowKeys(e=>{if(/^[a-z]$/i.test(e.key)){e.preventDefault();type(e.key.toUpperCase())}else if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();erase()}});
 return <GameShell className={`cw-game ${done?'cw-done':''}`} title={`${theme.icon} ${theme.name} crossword`} subtitle={`${puzzle.difficulty} · ${total} words`} pill={<><Grid3x3 size={17}/>{solvedCount} of {total}</>} value={solvedCount} max={total} barLabel="Words solved" onLeave={onLeave}>
  <div className="cw-layout">
   <div className="cw-board"><div className="cw-grid" role="group" aria-label={`Crossword grid, ${puzzle.rows} rows by ${puzzle.cols} columns`} style={{gridTemplateColumns:`repeat(${puzzle.cols},1fr)`,['--cw-cols' as string]:puzzle.cols}}>{puzzle.letters.map((letter,c)=>letter===null?<span key={c} className="cw-gap" aria-hidden="true"/>:<button key={c} type="button" data-cell={c} disabled={done} className={`cw-cell ${!done&&entry.cells.includes(c)?'in-word':''} ${!done&&cursor===c?'cursor':''} ${lockedIn(values,hinted,c)?'locked':''} ${hinted.includes(c)?'hinted':''} ${off&&entry.cells.includes(c)?'off':''}`} aria-pressed={!done&&cursor===c} aria-label={`Row ${Math.floor(c/puzzle.cols)+1}, column ${c%puzzle.cols+1}: ${values[c]||'empty'}${puzzle.numbers[c]?`, clue ${puzzle.numbers[c]}`:''}`} onClick={()=>pickCell(c)}>{puzzle.numbers[c]>0&&<i aria-hidden="true">{puzzle.numbers[c]}</i>}{values[c]}</button>)}</div></div>
   <aside className="cw-side">
    {!done&&<p className="cw-current"><b>{label(entry)}</b> {entry.clue}</p>}
    <div className="ws-status" role="status">{done?<Cheer title="Word wizard!" text="Every word is in. You finished the crossword!"/>:<span>{message||'Tap a square or a clue, then type the word.'}</span>}</div>
    {!done&&<div className="cw-keys" role="group" aria-label="Letter keyboard">{rows.map((row,r)=><div key={row}>{[...row].map(k=><button key={k} type="button" onClick={()=>type(k)}>{k}</button>)}{r===2&&<button type="button" className="wide" aria-label="Erase letter" onClick={erase}><Delete size={19}/></button>}</div>)}</div>}
    {!done&&<div className="sc-tools"><button className="hint-button" onClick={hint}><Lightbulb size={18}/><span>Hint</span></button></div>}
    {done&&<button className="primary full" onClick={()=>onFinish({total,solo:total-helped.length})}>See my stars <ArrowRight size={19}/></button>}
    <Clues puzzle={puzzle} active={done?undefined:sel} onPick={pickEntry} solved={e=>right(values,e)}/>
   </aside>
  </div>
 </GameShell>;
}
function PaperGrid({puzzle,answers=false}:{puzzle:Crossword;answers?:boolean}){
 return <div className="cw-paper-board"><div className={`cw-grid cw-paper ${answers?'answers':''}`} role="img" aria-label={answers?'Crossword grid with the answers filled in':`Empty crossword grid, ${puzzle.rows} rows by ${puzzle.cols} columns`} style={{gridTemplateColumns:`repeat(${puzzle.cols},1fr)`,['--cw-cols' as string]:puzzle.cols,maxWidth:`${Math.min(100,puzzle.cols*11)}%`}}>{puzzle.letters.map((letter,c)=>letter===null?<span key={c} className="cw-gap" aria-hidden="true"/>:<span key={c} className="cw-cell" aria-hidden="true">{puzzle.numbers[c]>0&&<i>{puzzle.numbers[c]}</i>}{answers?letter:''}</span>)}</div></div>;
}
export function CrosswordSheet({puzzle,answerKey}:{puzzle:Crossword;answerKey:boolean}){
 const theme=clueThemeOf(puzzle.theme);
 return <article className="worksheet-paper cw-sheet"><div className="print-brand">kidzMath<span>Little steps. Big discoveries.</span></div><h2>My crossword: {theme.name} <span aria-hidden="true">{theme.icon}</span></h2><p>Read each clue and write the word in the squares, one letter in each. Across words go → and down words go ↓.</p><div className="name-line"><span>Name: ___________________</span><span>Date: ______________</span></div>
  <PaperGrid puzzle={puzzle}/><Clues puzzle={puzzle}/>
  <p className="paper-footer">Every clue you crack helps your brain grow. — Milo & Luna ♡</p>
  {answerKey&&<section className="answer-key cw-sheet-key"><h2>Answer key · Grown-ups & helpers</h2><PaperGrid puzzle={puzzle} answers/></section>}
 </article>;
}
