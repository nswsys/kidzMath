import {useEffect,useRef,type ReactNode} from 'react';
import {ArrowLeft} from 'lucide-react';
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
export function Cheer({title,text,animal}:{title:string;text:string;animal?:'puppy'|'bunny'}){return <div className="ws-cheer"><span className="cheer-buddy" aria-hidden="true"><Mascot animal={animal} happy/></span><div><strong className="cheer-title">{title}</strong><span>{text}</span></div></div>}
/** Runs a key handler on the window so keys keep working when the focused control is disabled or removed. */
export function useWindowKeys(handler:(e:KeyboardEvent)=>void){useEffect(()=>{const listen=(e:KeyboardEvent)=>{if(e.ctrlKey||e.metaKey||e.altKey||document.querySelector('dialog[open]'))return;handler(e)};window.addEventListener('keydown',listen);return()=>window.removeEventListener('keydown',listen)})}
export type Outcome={total:number;solo:number;count?:number};
export type GameProps<P>={puzzle:P;play:(cue:import('./sounds').Cue)=>void;onLeave:()=>void;onFinish:(outcome:Outcome)=>void};
export const cheers=['Woo-hoo!','High five!','Brain power!'];
