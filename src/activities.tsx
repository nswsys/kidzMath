import type {FC} from 'react';
import {ArrowRight,Check,Sparkles} from 'lucide-react';
import type {Difficulty} from './math';
import type {GameProps} from './GameShell';
import type {ExtraActivity,ExtraResult} from './progress';
import {themes} from './wordsearch';
import {generateScramble,scrambleDefaults,scrambleLevels} from './scramble';
import {ScrambleGame,ScrambleSheet} from './Scramble';
import {generatePatterns,patternDefaults,patternLevels} from './patterns';
import {PatternsGame,PatternsSheet} from './Patterns';
import {crosswordDefaults,crosswordLevels,crosswordThemes,generateCrossword} from './crossword';
import {CrosswordGame,CrosswordSheet} from './Crossword';
import {colorDefaults,colorLevels,generateColoring} from './colorbynumber';
import {ColorGame,ColorSheet} from './ColorByNumber';
export type ExtraSettings={difficulty:Difficulty;theme?:string};
type Choice={id:string;name:string;icon:string;blurb:string};
/** Everything the app needs to offer an activity: setup choices, a generator, the game, the printable page, and how to describe a saved result. */
export type ExtraDef={
 id:ExtraActivity;icon:string;name:string;description:string;
 themes?:Choice[];themeHeading?:string;levelNote:(d:Difficulty)=>string;startLabel:string;tip:string;
 defaults:ExtraSettings;generate:(settings:ExtraSettings)=>unknown;puzzleKey:(puzzle:unknown)=>string;
 Game:FC<GameProps<any>>;Sheet:FC<{puzzle:any;answerKey:boolean}>;sheetNote:string;
 badge:{name:string;description:string;icon:string};
 detail:(r:ExtraResult)=>string;solo:(r:ExtraResult)=>string;stats:(r:ExtraResult)=>[string|number,string][];done:string;
};
const themeName=(list:Choice[],id?:string)=>list.find(t=>t.id===id)?.name??list[0].name;
const hints=(r:ExtraResult)=>r.total-r.correct;
export const extras:ExtraDef[]=[
 {id:'patterns',icon:'🔢',name:'Number patterns',description:'Find the missing number',
  levelNote:d=>`${patternLevels[d].count} patterns · ${d==='Easy'?'count by 1, 2, 5, 10':d==='Medium'?'up and down':'tricky rules'}`,startLabel:'Spot the patterns!',tip:'Skip-counting makes patterns easy.',
  defaults:patternDefaults,generate:s=>generatePatterns({difficulty:s.difficulty}),puzzleKey:p=>JSON.stringify(p),
  Game:PatternsGame,Sheet:PatternsSheet,sheetNote:'Every page has brand-new patterns.',
  badge:{name:'Pattern spotter',description:'Finish number patterns',icon:'📈'},
  detail:r=>`${r.total} patterns`,solo:r=>`${r.correct} of ${r.total} on the first try`,stats:r=>[[r.correct,'right on the first try'],[r.total,'patterns'],[r.points,'points']],done:'You cracked every pattern.'},
 {id:'colors',icon:'🎨',name:'Color by number',description:'Paint a mystery picture',
  levelNote:d=>colorLevels[d].note,startLabel:'Start painting!',tip:'Each color has its own answer.',
  defaults:colorDefaults,generate:s=>generateColoring({difficulty:s.difficulty}),puzzleKey:p=>JSON.stringify(p),
  Game:ColorGame,Sheet:ColorSheet,sheetNote:'Each page hides a surprise picture. You will need crayons or pencils.',
  badge:{name:'Super artist',description:'Finish a color by number',icon:'🖍️'},
  detail:r=>`${r.settings.count} squares`,solo:r=>`${r.percentage}% painted on the first try`,stats:r=>[[r.settings.count,'squares painted'],[`${r.percentage}%`,'on the first try'],[r.points,'points']],done:'You painted the whole picture.'},
 {id:'scramble',icon:'🔀',name:'Word scramble',description:'Unmix the letters',
  themes:themes.map(({id,name,icon,blurb})=>({id,name,icon,blurb})),themeHeading:'Pick a theme!',levelNote:d=>`${scrambleLevels[d].count} words · up to ${scrambleLevels[d].max} letters`,startLabel:'Unscramble!',tip:'Look for letters that go together.',
  defaults:scrambleDefaults,generate:s=>generateScramble(s as Parameters<typeof generateScramble>[0]),puzzleKey:p=>JSON.stringify(p),
  Game:ScrambleGame,Sheet:ScrambleSheet,sheetNote:'Every page mixes up new words.',
  badge:{name:'Letter untangler',description:'Finish a word scramble',icon:'🔤'},
  detail:r=>`${themeName(themes,r.settings.theme)} · ${r.total} words`,solo:r=>`${r.correct} of ${r.total} without hints`,stats:r=>[[r.total,'words unscrambled'],[hints(r),hints(r)===1?'word with a hint':'words with a hint'],[r.points,'points']],done:'You unscrambled every word.'},
 {id:'crossword',icon:'✏️',name:'Crossword',description:'Solve the clues',
  themes:crosswordThemes.map(({id,name,icon,blurb})=>({id,name,icon,blurb})),themeHeading:'Pick your clues!',levelNote:d=>`${crosswordLevels[d].words} words`,startLabel:'Solve the clues!',tip:'Crossing words share a letter.',
  defaults:crosswordDefaults,generate:s=>generateCrossword(s as Parameters<typeof generateCrossword>[0]),puzzleKey:p=>JSON.stringify(p),
  Game:CrosswordGame,Sheet:CrosswordSheet,sheetNote:'Every crossword is brand new.',
  badge:{name:'Clue cracker',description:'Finish a crossword',icon:'🧠'},
  detail:r=>`${themeName(crosswordThemes,r.settings.theme)} · ${r.total} words`,solo:r=>`${r.correct} of ${r.total} without hints`,stats:r=>[[r.total,'words solved'],[hints(r),hints(r)===1?'word with a hint':'words with a hint'],[r.points,'points']],done:'You filled in the whole crossword.'}
];
export const extraOf=(id:string)=>extras.find(e=>e.id===id);
/** The setup card shared by these activities: an optional theme step, a level step, and a start button. */
export function ExtraSetup({def,settings,onChange,onStart}:{def:ExtraDef;settings:ExtraSettings;onChange:(next:ExtraSettings)=>void;onStart:()=>void}){
 const levelStep=def.themes?2:1;
 return <section className="setup-card ws-setup ex-setup" aria-label={`Choose your ${def.name.toLowerCase()}`}>
  {def.themes&&<><div className="step-heading"><span className="step-number">1</span><h3>{def.themeHeading}</h3></div><div className={`ws-themes ${def.themes.length<4?'few':''}`}>{def.themes.map(t=><button key={t.id} aria-label={`${t.name}: ${t.blurb}`} aria-pressed={settings.theme===t.id} className={settings.theme===t.id?'chosen':''} onClick={()=>onChange({...settings,theme:t.id})}><span aria-hidden="true">{t.icon}</span><strong>{t.name}</strong>{settings.theme===t.id&&<span className="selected-tick"><Check size={13}/></span>}</button>)}</div></>}
  <fieldset className="ws-level"><legend><span className="step-number">{levelStep}</span> Choose your power</legend><div className="segments levels">{(['Easy','Medium','Challenge'] as Difficulty[]).map((d,i)=><button key={d} onClick={()=>onChange({...settings,difficulty:d})} aria-pressed={settings.difficulty===d} className={settings.difficulty===d?'chosen':''}><span>{['🌱','🌿','🌳'][i]} {d}</span><small>{def.levelNote(d)}</small></button>)}</div></fieldset>
  <div className="start-row"><span><Sparkles size={16}/> {def.tip}</span><button className="primary start" onClick={onStart}>{def.startLabel} <ArrowRight size={20}/></button></div>
 </section>;
}
