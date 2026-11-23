import {useEffect,useRef,useState,type ReactNode} from 'react';
import {ArrowLeft,ArrowRight,Check,Delete,Puzzle} from 'lucide-react';
import type {Difficulty} from './math';
import {AskBuddy,Buddy,PaperBuddy,useSay} from './GameShell';
import type {Cue} from './sounds';
import {boxLevels,lineValue,lines,operationName,type Box,type BoxSettings,type Line} from './numberbox';
const spoken=(l:Line)=>`${l.ops[0]==='+'?'plus':'minus'}, ${l.ops[1]==='+'?'plus':'minus'}, equals ${l.target}`;
type Mark=''|'ok'|'off';

/** The 3×3 box with its signs between squares and the answers outside. Squares are drawn by the caller. */
function BoxGrid({box,square,mark,label}:{box:Box;square:(index:number)=>ReactNode;mark?:(kind:'row'|'col',n:number)=>Mark;label:string}){
 const parts:ReactNode[]=[];
 for(let i=0;i<7;i++)for(let j=0;j<7;j++){
  const key=`${i}-${j}`,row=i%2===0&&i<5,col=j%2===0&&j<5;
  if(row&&col)parts.push(<span className="nb-slot" key={key}>{square(i/2*3+j/2)}</span>);
  else if(row&&j<5)parts.push(<span className="nb-sign" key={key} aria-hidden="true">{box.rows[i/2].ops[(j-1)/2]}</span>);
  else if(row&&j===5)parts.push(<span className="nb-sign nb-equals" key={key} aria-hidden="true">=</span>);
  else if(row)parts.push(<span className={`nb-target ${mark?.('row',i/2)??''}`} key={key} aria-label={`Row ${i/2+1}: ${spoken(box.rows[i/2])}`}>{box.rows[i/2].target}</span>);
  else if(col&&i<5)parts.push(<span className="nb-sign" key={key} aria-hidden="true">{box.cols[j/2].ops[(i-1)/2]}</span>);
  else if(col&&i===5)parts.push(<span className="nb-sign nb-equals" key={key} aria-hidden="true">=</span>);
  else if(col)parts.push(<span className={`nb-target ${mark?.('col',j/2)??''}`} key={key} aria-label={`Column ${j/2+1}: ${spoken(box.cols[j/2])}`}>{box.cols[j/2].target}</span>);
  else parts.push(<span key={key} aria-hidden="true"/>);
 }
 return <div className="nb-grid" role="group" aria-label={label}>{parts}</div>;
}

export function NumberBoxSetup({settings,onChange,onStart}:{settings:BoxSettings;onChange:(next:BoxSettings)=>void;onStart:()=>void}){
 return <section className="setup-card nb-setup" aria-label="Choose your number box">
  <div className="step-heading"><span className="step-number">1</span><h3>Pick a puzzle!</h3></div>
  <div className="operation-options nb-options">{([{value:'Addition',symbol:'+',description:'Every line adds up',color:'peach'},{value:'Mixed',symbol:'±',description:'Plus and minus together',color:'mint'}] as const).map(o=><button key={o.value} aria-label={`${operationName(o.value)}: ${o.description}`} aria-pressed={settings.operation===o.value} className={`operation ${o.color} ${settings.operation===o.value?'chosen':''}`} onClick={()=>onChange({...settings,operation:o.value})}><span className="operation-symbol">{o.symbol}</span><strong>{operationName(o.value)}</strong><small>{o.description}</small>{settings.operation===o.value&&<span className="selected-tick"><Check size={13}/></span>}</button>)}</div>
  <fieldset className="nb-level"><legend><span className="step-number">2</span> Choose your power</legend><div className="segments levels">{(['Easy','Medium','Challenge'] as Difficulty[]).map((d,i)=><button key={d} onClick={()=>onChange({...settings,difficulty:d})} aria-pressed={settings.difficulty===d} className={settings.difficulty===d?'chosen':''}><span>{['🌱','🌿','🌳'][i]} {d}</span><small>{boxLevels[d].blanks} empty squares</small></button>)}</div></fieldset>
  <p className="nb-rule">Use each number from 1 to 9 just once. Make every row and column match its answer.</p>
  <div className="start-row"><span><Puzzle size={16}/> A fresh puzzle every time.</span><button className="primary start" onClick={onStart}>Solve the puzzle! <ArrowRight size={20}/></button></div>
 </section>;
}

export function NumberBoxGame({box,play,onLeave,onFinish}:{box:Box;play:(cue:Cue)=>void;onLeave:()=>void;onFinish:(outcome:{total:number;solo:number})=>void}){
 const blanks=box.given.flatMap((g,i)=>g?[]:[i]);
 const [values,setValues]=useState<(number|null)[]>(()=>box.solution.map((v,i)=>box.given[i]?v:null)),[selected,setSelected]=useState<number|null>(blanks[0]??null),[hinted,setHinted]=useState<number[]>([]);
 const [note,setMessage]=useSay(),message=note.text;
 const headingRef=useRef<HTMLHeadingElement>(null),cheered=useRef(false);
 const all=lines(box),filled=blanks.filter(i=>values[i]!==null).length,done=all.every(l=>lineValue(l,values)===l.target),locked=(i:number)=>box.given[i]||hinted.includes(i);
 const mark=(kind:'row'|'col',n:number):Mark=>{const l=(kind==='row'?box.rows:box.cols)[n],v=lineValue(l,values);return v===null?'':v===l.target?'ok':'off'};
 useEffect(()=>{headingRef.current?.focus({preventScroll:true})},[]);
 useEffect(()=>{if(done&&!cheered.current){cheered.current=true;play('correct')}},[done,play]);
 const nextEmpty=(vals:(number|null)[],after:number)=>[...blanks.filter(i=>i>after),...blanks.filter(i=>i<after)].find(i=>vals[i]===null)??null;
 function put(digit:number){
  if(done)return;
  if(selected===null||locked(selected)){setMessage('Tap an empty square first.');return}
  if(values.some((v,i)=>v===digit&&locked(i))){setMessage(`${digit} is already in the box. Each number is used once.`,'oops');return}
  play('tap');
  // A number can only live in one square, so placing it again moves it.
  const next=values.map((v,i)=>i===selected?digit:v===digit?null:v);setValues(next);
  const solved=all.every(l=>lineValue(l,next)===l.target),wrong=all.filter(l=>l.cells.includes(selected)).some(l=>{const v=lineValue(l,next);return v!==null&&v!==l.target});
  setMessage(solved?'Every row and column matches. You solved it!':wrong?'One line doesn’t match yet. Try moving a number.':'',solved?'happy':wrong?'oops':'idle');
  if(!solved)setSelected(nextEmpty(next,selected)??selected);
 }
 function erase(){if(done||selected===null||locked(selected)||values[selected]===null)return;play('tap');setValues(v=>v.map((x,i)=>i===selected?null:x));setMessage('')}
 function hint(){
  const target=selected!==null&&!locked(selected)&&values[selected]!==box.solution[selected]?selected:blanks.find(i=>!locked(i)&&values[i]!==box.solution[i]);
  if(target===undefined)return;
  play('tap');const digit=box.solution[target],next=values.map((v,i)=>i===target?digit:v===digit?null:v);
  setValues(next);setHinted(h=>[...h,target]);setSelected(nextEmpty(next,target));setMessage(all.every(l=>lineValue(l,next)===l.target)?'Every row and column matches. You solved it!':`A ${digit} belongs in that glowing square.`);
 }
 // Number keys are heard on the window so they keep working when the focused square is locked by a hint.
 useEffect(()=>{const keys=(e:globalThis.KeyboardEvent)=>{if(e.ctrlKey||e.metaKey||e.altKey||document.querySelector('dialog[open]'))return;if(/^[1-9]$/.test(e.key)){e.preventDefault();put(Number(e.key))}else if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();erase()}};window.addEventListener('keydown',keys);return()=>window.removeEventListener('keydown',keys)});
 return <section className={`game-shell nb-game ${done?'nb-done':''}`}>
  <div className="game-top"><button className="text-link" onClick={onLeave}><ArrowLeft size={18}/> Leave game</button><span className="game-context"><strong>🧩 Number box</strong><small>{box.difficulty} · {operationName(box.operation)}</small></span><span className="streak"><Puzzle size={17}/>{filled} of {blanks.length}</span></div>
  <div className="progress-track" role="progressbar" aria-label="Squares filled" aria-valuenow={filled} aria-valuemin={0} aria-valuemax={blanks.length}><div style={{width:`${filled/blanks.length*100}%`}}/></div>
  <div className="nb-layout">
   <div className="nb-board"><h1 ref={headingRef} tabIndex={-1} className="sr-only">Number box</h1>
    <BoxGrid box={box} mark={mark} label="Number box. Fill the empty squares so each row and column matches its answer." square={i=>box.given[i]?<span className="nb-cell given" aria-label={`Row ${Math.floor(i/3)+1}, column ${i%3+1}: ${values[i]}`}>{values[i]}</span>:<button type="button" data-cell={i} disabled={done||hinted.includes(i)} aria-pressed={selected===i} aria-label={`Row ${Math.floor(i/3)+1}, column ${i%3+1}: ${values[i]??'empty'}`} className={`nb-cell blank ${selected===i&&!done?'selected':''} ${values[i]!==null?'filled':''} ${hinted.includes(i)?'hinted':''}`} onClick={()=>setSelected(i)}>{values[i]??''}</button>}/>
   </div>
   <aside className="nb-side">
    <div className="ws-words-head"><span className="eyebrow green">NUMBERS 1 TO 9, ONCE EACH</span>{!done&&<AskBuddy animal="puppy" onClick={hint}/>}</div>
    {!done&&<div className="nb-pad" role="group" aria-label="Number pad">{[1,2,3,4,5,6,7,8,9].map(d=>{const fixed=values.some((v,i)=>v===d&&locked(i)),placed=!fixed&&values.includes(d);return <button key={d} type="button" disabled={fixed} aria-label={fixed?`${d}, already in the box`:placed?`${d}, placed`:String(d)} className={placed?'placed':''} onClick={()=>put(d)}>{d}</button>})}<button type="button" className="nb-erase" aria-label="Erase square" onClick={erase}><Delete size={20}/> Erase</button></div>}
    <div className="ws-status" role="status"><Buddy animal="puppy" mood={done?'happy':note.mood} title={done?'Puzzle pro!':undefined} text={done?'Every row and column matches. You solved it!':message||'Tap an empty square, then pick its number.'}/></div>
    {done&&<button className="primary full" onClick={()=>onFinish({total:blanks.length,solo:blanks.length-hinted.length})}>See my stars <ArrowRight size={19}/></button>}
   </aside>
  </div>
 </section>;
}

/** Printable page of number boxes with an optional answer key on its own page. */
export function NumberBoxSheet({boxes,answerKey}:{boxes:Box[];answerKey:boolean}){
 const first=boxes[0];
 return <article className="worksheet-paper nb-sheet"><div className="print-brand">kidzMath<span>Little steps. Big discoveries.</span></div><h2>My number boxes <span aria-hidden="true">🧩</span></h2><PaperBuddy animal="puppy">Fill the empty squares with the numbers 1 to 9. Use each number only once in a box. Every row and column must match the answer outside the box.{first?.operation==='Mixed'?' Work the signs from left to right and top to bottom.':''}</PaperBuddy><div className="name-line"><span>Name: ___________________</span><span>Date: ______________</span></div>
  <ol className="nb-sheet-boxes">{boxes.map((box,n)=><li key={n}><BoxGrid box={box} label={`Number box ${n+1}`} square={i=><span className={`nb-cell ${box.given[i]?'given':'blank'}`}>{box.given[i]?box.solution[i]:''}</span>}/></li>)}</ol>
  <p className="paper-footer">Every puzzle you solve helps your brain grow. — Milo & Luna ♡</p>
  {answerKey&&<section className="answer-key nb-sheet-key"><h2>Answer key · Grown-ups & helpers</h2><ol className="nb-sheet-boxes">{boxes.map((box,n)=><li key={n}><BoxGrid box={box} label={`Answers for number box ${n+1}`} square={i=><span className={`nb-cell ${box.given[i]?'given':'answer'}`}>{box.solution[i]}</span>}/></li>)}</ol></section>}
 </article>;
}
