import {useEffect,useRef,useState,type ReactNode} from 'react';
import {ArrowLeft,Lightbulb} from 'lucide-react';
import {Mascot} from './Mascot';
/** The frame every newer game shares: leave link, title, a counter pill, and a progress bar. */
export function GameShell({className,title,subtitle,pill,value,max,barLabel,onLeave,children}:{className:string;title:string;subtitle:string;pill:ReactNode;value:number;max:number;barLabel:string;onLeave:()=>void;children:ReactNode}){
 const headingRef=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{headingRef.current?.focus({preventScroll:true})},[]);
 return <section className={`game-shell ${className}`}>
  <div className="game-top"><button className="text-link" onClick={onLeave}><ArrowLeft size={18}/> Leave game</button><span className="game-context"><strong>{title}</strong><small>{subtitle}</small></span><span className="streak">{pill}</span></div>
  <div className="progress-track" role="progressbar" aria-label={barLabel} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}><div style={{width:`${max?value/max*100:0}%`}}/></div>
  <h1 ref={headingRef} tabIndex={-1} className="sr-only">{title}</h1>
  {children}
 </section>;
}
export type Animal='puppy'|'bunny';
export type Mood='idle'|'happy'|'oops';
/** Milo the puppy helps with number activities; Luna the bunny helps with word activities. */
export const buddyName:Record<Animal,string>={puppy:'Milo',bunny:'Luna'};
/** What the buddy is saying and how they feel about it. */
export function useSay(){const [note,setNote]=useState<{text:string;mood:Mood}>({text:'',mood:'idle'});return [note,(text:string,mood:Mood='idle')=>setNote({text,mood})] as const}
/** The game buddy: a mascot with a speech bubble that reacts to how the child is doing. */
export function Buddy({animal='puppy',mood='idle',title,text}:{animal?:Animal;mood?:Mood;title?:string;text:string}){return <div className={`buddy ${mood}`}><span className="buddy-art" aria-hidden="true"><Mascot animal={animal} happy={mood==='happy'}/></span><div className="buddy-bubble">{title&&<strong className="cheer-title">{title}</strong>}<span>{text}</span></div></div>}
/** The buddy on a printed page, giving the instructions in a speech bubble. */
export function PaperBuddy({animal='puppy',children}:{animal?:Animal;children:ReactNode}){return <div className="paper-buddy"><span className="paper-buddy-art" aria-hidden="true"><Mascot animal={animal}/></span><p>{children}</p></div>}
/** Hints are something you ask your buddy for. */
export function AskBuddy({animal='puppy',onClick,expanded}:{animal?:Animal;onClick:()=>void;expanded?:boolean}){return <button className="hint-button ask-buddy" onClick={onClick} aria-expanded={expanded}><Lightbulb size={18}/><span>Ask {buddyName[animal]}</span></button>}
/** Runs a key handler on the window so keys keep working when the focused control is disabled or removed. */
export function useWindowKeys(handler:(e:KeyboardEvent)=>void){useEffect(()=>{const listen=(e:KeyboardEvent)=>{if(e.ctrlKey||e.metaKey||e.altKey||document.querySelector('dialog[open]'))return;handler(e)};window.addEventListener('keydown',listen);return()=>window.removeEventListener('keydown',listen)})}
export type Outcome={total:number;solo:number;count?:number};
export type GameProps<P>={puzzle:P;play:(cue:import('./sounds').Cue)=>void;onLeave:()=>void;onFinish:(outcome:Outcome)=>void};
export const cheers=['Woo-hoo!','High five!','Brain power!'];
