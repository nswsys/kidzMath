import {useState} from 'react';
import {ArrowRight,Lightbulb,RotateCcw,Shuffle} from 'lucide-react';
import {Cheer,GameShell,cheers,useWindowKeys,type GameProps} from './GameShell';
import {isUnscrambled,type ScramblePuzzle} from './scramble';
import {themeOf} from './wordsearch';
export function ScrambleGame({puzzle,play,onLeave,onFinish}:GameProps<ScramblePuzzle>){
 const theme=themeOf(puzzle.theme),total=puzzle.words.length;
 // `picked` holds tile positions in the order chosen; the first `fixed` of them were placed by hints and stay put.
 const [index,setIndex]=useState(0),[picked,setPicked]=useState<number[]>([]),[fixed,setFixed]=useState(0),[solved,setSolved]=useState(false),[helped,setHelped]=useState<number[]>([]),[message,setMessage]=useState('');
 const round=puzzle.words[index],spelled=picked.map(i=>round.letters[i]).join(''),full=picked.length===round.letters.length,off=full&&!solved;
 function settle(next:number[]){
  setPicked(next);
  if(next.length<round.letters.length){setMessage('');return}
  const attempt=next.map(i=>round.letters[i]).join('');
  if(isUnscrambled(puzzle,index,attempt)){setSolved(true);play('correct');setMessage(`${attempt}! You unscrambled it.`)}
  else{play('tryAgain');setMessage('Not a word yet. Tap a letter to take it back.')}
 }
 function pick(tile:number){if(solved||picked.includes(tile)||full)return;play('tap');settle([...picked,tile])}
 function unpick(slot:number){if(solved||slot<fixed||slot>=picked.length)return;play('tap');setPicked(picked.filter((_,i)=>i!==slot));setMessage('')}
 function clear(){if(solved||picked.length<=fixed)return;play('tap');setPicked(picked.slice(0,fixed));setMessage('')}
 function hint(){
  if(solved)return;
  // Keep the letters that are already right, then place the next one.
  let keep=0;while(keep<picked.length&&round.letters[picked[keep]]===round.word[keep])keep++;
  const kept=picked.slice(0,keep),tile=round.letters.findIndex((l,i)=>l===round.word[keep]&&!kept.includes(i));
  if(tile<0)return;
  play('tap');setHelped(h=>h.includes(index)?h:[...h,index]);setFixed(keep+1);
  const next=[...kept,tile];
  if(next.length===round.letters.length)settle(next);else{setPicked(next);setMessage(`Letter ${keep+1} is ${round.word[keep]}.`)}
 }
 function next(){if(!solved)return;if(index+1<total){setIndex(index+1);setPicked([]);setFixed(0);setSolved(false);setMessage('')}else onFinish({total,solo:total-helped.length})}
 useWindowKeys(e=>{
  if(e.key==='Enter'&&solved){e.preventDefault();next()}
  else if(e.key==='Backspace'){e.preventDefault();if(picked.length>fixed)unpick(picked.length-1)}
  else if(/^[a-z]$/i.test(e.key)){const tile=round.letters.findIndex((l,i)=>l===e.key.toUpperCase()&&!picked.includes(i));if(tile>=0){e.preventDefault();pick(tile)}}
 });
 return <GameShell className={`sc-game ${solved?'sc-solved':''}`} title={`${theme.icon} ${theme.name} word scramble`} subtitle={`${puzzle.difficulty} · Word ${index+1} of ${total}`} pill={<><Shuffle size={17}/>{index+(solved?1:0)} of {total}</>} value={index+(solved?1:0)} max={total} barLabel="Words unscrambled" onLeave={onLeave}>
  <div className="sc-card">
   <span className="eyebrow green">UNSCRAMBLE THE {theme.name.toUpperCase()} WORD</span>
   <div className={`sc-slots ${off?'off':''} ${solved?'ok':''}`} role="group" aria-label="Your word">{round.letters.map((_,slot)=>{const letter=slot<picked.length?round.letters[picked[slot]]:'';return <button key={slot} type="button" data-slot={slot} disabled={solved||slot<fixed||!letter} className={`sc-slot ${letter?'filled':''} ${slot<fixed?'fixed':''}`} aria-label={`Letter ${slot+1}: ${letter||'empty'}`} onClick={()=>unpick(slot)}>{letter}</button>})}</div>
   {!solved&&<div className="sc-tiles" role="group" aria-label="Letter tiles">{round.letters.map((letter,tile)=><button key={tile} type="button" data-tile={tile} disabled={picked.includes(tile)} className="sc-tile" aria-label={picked.includes(tile)?`${letter}, used`:letter} onClick={()=>pick(tile)}>{letter}</button>)}</div>}
   {!solved&&<div className="sc-tools"><button className="hint-button" onClick={hint}><Lightbulb size={18}/><span>Hint</span></button><button className="hint-button" onClick={clear} disabled={picked.length<=fixed}><RotateCcw size={17}/><span>Clear</span></button></div>}
   <div className="ws-status" role="status">{solved?<Cheer title={cheers[index%3]} text={message} animal={index%2?'bunny':'puppy'}/>:<span>{message||'Tap the letters in the right order.'}</span>}</div>
   {solved&&<button className="primary full" onClick={next}>{index+1===total?'See my stars':'Next word'} <ArrowRight size={19}/></button>}
  </div>
  <span className="sr-only" aria-live="polite">{spelled}</span>
 </GameShell>;
}
export function ScrambleSheet({puzzle,answerKey}:{puzzle:ScramblePuzzle;answerKey:boolean}){
 const theme=themeOf(puzzle.theme);
 return <article className="worksheet-paper sc-sheet"><div className="print-brand">kidzMath<span>Little steps. Big discoveries.</span></div><h2>My word scramble: {theme.name} <span aria-hidden="true">{theme.icon}</span></h2><p>The letters are mixed up! Write each {theme.name.toLowerCase()} word the right way.</p><div className="name-line"><span>Name: ___________________</span><span>Date: ______________</span></div>
  <ol className="sc-sheet-words">{puzzle.words.map(w=><li key={w.word}><span className="sc-sheet-mix">{w.letters.join(' ')}</span><span className="sc-sheet-line" aria-hidden="true"/></li>)}</ol>
  <p className="paper-footer">Every word you untangle helps your brain grow. — Milo & Luna ♡</p>
  {answerKey&&<section className="answer-key"><h2>Answer key · Grown-ups & helpers</h2><ol>{puzzle.words.map(w=><li key={w.word}>{w.letters.join('')} → <strong>{w.word}</strong></li>)}</ol></section>}
 </article>;
}
