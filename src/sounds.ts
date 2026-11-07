export type Cue = 'tap' | 'welcome' | 'correct' | 'tryAgain' | 'party';
/** Original, short synthesized cues. Nothing plays before a user gesture. */
export class SoundKit {
 private ctx:AudioContext|null=null;
 stop(){if(this.ctx){void this.ctx.close().catch(()=>{});this.ctx=null}}
 play(cue:Cue){
  try{
   this.ctx??=new AudioContext();const ctx=this.ctx;void ctx.resume();
   const note=(frequency:number,offset:number,duration=.2,type:OscillatorType='triangle',volume=.08,end?:number)=>{
    const oscillator=ctx.createOscillator(),gain=ctx.createGain(),time=ctx.currentTime+offset;
    oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,time);
    if(end)oscillator.frequency.exponentialRampToValueAtTime(end,time+duration);
    oscillator.connect(gain);gain.connect(ctx.destination);
    gain.gain.setValueAtTime(.001,time);gain.gain.exponentialRampToValueAtTime(volume,time+.012);
    gain.gain.exponentialRampToValueAtTime(.001,time+duration);
    oscillator.start(time);oscillator.stop(time+duration+.02);
   };
   if(cue==='tap'){note(350,0,.11,'sine',.07,560);return true}
   if(cue==='tryAgain'){note(430,0,.18,'sine',.07,290);note(330,.14,.22,'triangle',.06,440);return true}
   if(cue==='correct'){
    [523.25,659.25,783.99,1046.5].forEach((f,i)=>{note(f,i*.075,.22);note(f*2,i*.075,.12,'sine',.025)});
    note(1568,.34,.34,'sine',.04);return true;
   }
   if(cue==='welcome'){
    [392,523.25,659.25,783.99,659.25,1046.5].forEach((f,i)=>note(f,i*.12,.24,'triangle',.075));
    note(190,0,.18,'sine',.07,380);note(1568,.69,.33,'sine',.03);return true;
   }
   [523.25,659.25,783.99,1046.5,987.77,783.99,880,1046.5,1174.66,1318.51].forEach((f,i)=>{
    note(f,i*.13,.3,'triangle',.075);if(i%3===0)note(f/2,i*.13,.27,'sine',.04);
   });
   [1046.5,1318.51,1568].forEach(f=>note(f,1.35,.6,'sine',.032));
   return true;
  }catch{return false}
 }
}
