import {useState} from 'react';
import {ArrowRight,TrendingUp} from 'lucide-react';
import {AskBuddy,Buddy,PaperBuddy,GameShell,cheers,useSay,useWindowKeys,type GameProps} from './GameShell';
import type {PatternPuzzle} from './patterns';
export function PatternsGame({puzzle,play,onLeave,onFinish}:GameProps<PatternPuzzle>){
 const total=puzzle.patterns.length;
 // A pattern counts as "solo" only when the first choice is right and no hint was shown.
 const [index,setIndex]=useState(0),[tried,setTried]=useState<number[]>([]),[solved,setSolved]=useState(false),[showRule,setShowRule]=useState(false),[missed,setMissed]=useState<number[]>([]);
 const [note,setMessage]=useSay(),message=note.text;
 const pattern=puzzle.patterns[index],miss=()=>setMissed(m=>m.includes(index)?m:[...m,index]);
 function choose(n:number){
  if(solved||tried.includes(n))return;
  if(n===pattern.answer){setSolved(true);play('correct');setMessage(pattern.rule,'happy')}
  else{play('tryAgain');setTried(t=>[...t,n]);miss();setMessage('Not that one. Look at the jump between the numbers.','oops')}
 }
 function hint(){if(solved)return;play('tap');setShowRule(true);miss()}
 function next(){if(!solved)return;if(index+1<total){setIndex(index+1);setTried([]);setSolved(false);setShowRule(false);setMessage('')}else onFinish({total,solo:total-missed.length})}
 useWindowKeys(e=>{if(e.key==='Enter'&&solved){e.preventDefault();next()}});
 return <GameShell className={`pt-game ${solved?'pt-solved':''}`} title="🔢 Number patterns" subtitle={`${puzzle.difficulty} · Pattern ${index+1} of ${total}`} pill={<><TrendingUp size={17}/>{index+(solved?1:0)} of {total}</>} value={index+(solved?1:0)} max={total} barLabel="Patterns finished" onLeave={onLeave}>
  <div className="pt-card">
   <span className="eyebrow green">WHICH NUMBER IS MISSING?</span>
   <ol className="pt-row" aria-label={`Pattern: ${pattern.terms.map((n,i)=>i===pattern.blank&&!solved?'blank':n).join(', ')}`}>{pattern.terms.map((n,i)=><li key={i} className={i===pattern.blank?`blank ${solved?'ok':''}`:''} aria-hidden="true">{i===pattern.blank&&!solved?'?':n}</li>)}</ol>
   {!solved&&<div className="pt-choices" role="group" aria-label="Choose the missing number">{pattern.choices.map(n=><button key={n} type="button" disabled={tried.includes(n)} className={tried.includes(n)?'tried':''} aria-label={tried.includes(n)?`${n}, not the answer`:String(n)} onClick={()=>choose(n)}>{n}</button>)}</div>}
   {!solved&&<div className="sc-tools"><AskBuddy animal="puppy" onClick={hint} expanded={showRule}/></div>}
   {!solved&&showRule&&<p className="hint">{pattern.rule}</p>}
   <div className="ws-status" role="status"><Buddy animal="puppy" mood={solved?'happy':note.mood} title={solved?cheers[index%3]:undefined} text={solved?`${pattern.answer} is right! ${message}`:message||'Spot the rule, then pick the number.'}/></div>
   {solved&&<button className="primary full" onClick={next}>{index+1===total?'See my stars':'Next pattern'} <ArrowRight size={19}/></button>}
  </div>
 </GameShell>;
}
export function PatternsSheet({puzzle,answerKey}:{puzzle:PatternPuzzle;answerKey:boolean}){
 return <article className="worksheet-paper pt-sheet"><div className="print-brand">kidzMath<span>Little steps. Big discoveries.</span></div><h2>My number patterns <span aria-hidden="true">🔢</span></h2><PaperBuddy animal="puppy">Find the rule in each row, then write the missing number in the box.</PaperBuddy><div className="name-line"><span>Name: ___________________</span><span>Date: ______________</span></div>
  <ol className="pt-sheet-rows">{puzzle.patterns.map((p,n)=><li key={n}>{p.terms.map((t,i)=><span key={i} className={i===p.blank?'blank':''}>{i===p.blank?'':t}</span>)}</li>)}</ol>
  <p className="paper-footer">Every pattern you spot helps your brain grow. — Milo & Luna ♡</p>
  {answerKey&&<section className="answer-key"><h2>Answer key · Grown-ups & helpers</h2><ol>{puzzle.patterns.map((p,n)=><li key={n}><strong>{p.answer}</strong> — {p.rule}</li>)}</ol></section>}
 </article>;
}
