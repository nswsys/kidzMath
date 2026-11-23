import type {Difficulty} from './math';
export type ThemeId='animals'|'space'|'science'|'fruits'|'foods'|'sports'|'cartoons'|'shows';
export type Theme={id:ThemeId;name:string;icon:string;blurb:string;words:string[]};
export type WordSettings={theme:ThemeId;difficulty:Difficulty};
export type Cell={r:number;c:number};
export type Placement={word:string;cells:Cell[]};
export type Puzzle={size:number;grid:string[][];placements:Placement[];theme:ThemeId;difficulty:Difficulty};
/** Words are uppercase A–Z, 3–10 letters. Each theme has plenty of words of 8 letters or fewer for the Easy grid. */
export const themes:Theme[]=[
 {id:'animals',name:'Animals',icon:'🦁',blurb:'Furry, feathery, and finned friends',words:['CAT','DOG','LION','TIGER','ZEBRA','MONKEY','PANDA','KOALA','HORSE','RABBIT','GIRAFFE','ELEPHANT','DOLPHIN','PENGUIN','TURTLE','FROG','BEAR','FOX','OWL','SHARK']},
 {id:'space',name:'Solar system',icon:'🪐',blurb:'Planets, moons, and rockets',words:['SUN','MOON','EARTH','MARS','VENUS','JUPITER','SATURN','URANUS','NEPTUNE','MERCURY','PLANET','COMET','ORBIT','STAR','ROCKET','GALAXY','ASTEROID','METEOR','SPACE','PLUTO']},
 {id:'science',name:'Science',icon:'🔬',blurb:'Big ideas for curious minds',words:['ATOM','ENERGY','MAGNET','PLANT','ROBOT','LIGHT','SOUND','WATER','FOSSIL','GRAVITY','CELL','LAB','HEAT','FORCE','CLOUD','VOLCANO','CRYSTAL','OXYGEN','BATTERY','MICROSCOPE']},
 {id:'fruits',name:'Fruits',icon:'🍓',blurb:'Sweet and juicy words',words:['APPLE','BANANA','GRAPE','MANGO','ORANGE','PEACH','LEMON','CHERRY','MELON','PEAR','KIWI','PLUM','BERRY','COCONUT','PAPAYA','LIME','FIG','APRICOT','PINEAPPLE','AVOCADO']},
 {id:'foods',name:'Foods',icon:'🍕',blurb:'Yummy things to eat',words:['PIZZA','PASTA','BREAD','RICE','CHEESE','SOUP','SALAD','TACO','BURGER','COOKIE','PANCAKE','NOODLES','SANDWICH','CARROT','TOMATO','POTATO','EGG','MILK','HONEY','CEREAL']},
 {id:'sports',name:'Sports',icon:'⚽',blurb:'Run, jump, and score',words:['SOCCER','TENNIS','HOCKEY','GOLF','SWIM','RUN','JUMP','BALL','GOAL','TEAM','BASEBALL','SKATE','SURF','KARATE','CYCLING','RUGBY','BOXING','JUDO','DANCE','RACE']},
 {id:'cartoons',name:'Cartoon stars',icon:'📺',blurb:'Famous cartoon characters',words:['BLUEY','BINGO','PEPPA','DORA','ELMO','SNOOPY','GARFIELD','SCOOBY','PIKACHU','SPONGEBOB','PATRICK','MICKEY','MINNIE','DONALD','GOOFY','SIMBA','NEMO','DORY','ELSA','OLAF']},
 {id:'shows',name:'Shows & movies',icon:'🎬',blurb:'Favorite things to watch',words:['BLUEY','POKEMON','PAWPATROL','COCOMELON','MINIONS','SHREK','FROZEN','MOANA','ENCANTO','CARS','COCO','SMURFS','TROLLS','LEGO','SONIC','MARIO','BARNEY','ARTHUR','SESAME','RUGRATS']}
];
export const wordDefaults:WordSettings={theme:'animals',difficulty:'Easy'};
type Direction=[number,number];
/** Easy reads left-to-right and top-to-bottom; Medium adds diagonals; Challenge adds backwards words. */
export const levels:Record<Difficulty,{size:number;words:number;directions:Direction[]}>={
 Easy:{size:8,words:6,directions:[[0,1],[1,0]]},
 Medium:{size:10,words:8,directions:[[0,1],[1,0],[1,1],[-1,1]]},
 Challenge:{size:12,words:10,directions:[[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]]}
};
/** Where words may hide at each level, in words a child can read on a printed page. */
export const directionHelp:Record<Difficulty,string>={Easy:'Words go across and down.',Medium:'Words go across, down, and diagonally.',Challenge:'Words go in every direction, even backwards!'};
export const themeOf=(id:ThemeId)=>themes.find(t=>t.id===id)??themes[0];
// Random filler letters must never spell something unkind in a children's puzzle.
const unkind=['ASS','BUM','BUTT','CRAP','DAMN','DIE','DUMB','FAT','HATE','HELL','KILL','POO','SEX','UGLY','FUCK','SHIT','PISS','DICK','COCK','CUNT','SLUT','FAG','NIG','TIT','BOOB','ANUS','POOP','FART','SUCK','GUN','DRUG','DEAD','JERK'];
function shuffle<T>(items:T[],random:()=>number){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function cellsFor(word:string,r:number,c:number,[dr,dc]:Direction){return Array.from(word,(_,i)=>({r:r+dr*i,c:c+dc*i}))}
function fits(grid:string[][],word:string,cells:Cell[]){const n=grid.length;return cells.every((p,i)=>p.r>=0&&p.c>=0&&p.r<n&&p.c<n&&(grid[p.r][p.c]===''||grid[p.r][p.c]===word[i]))}
/** Every straight line of the grid, read in both directions. */
export function lines(grid:string[][]){
 const n=grid.length,out:string[]=[];
 for(let i=0;i<n;i++){out.push(grid[i].join(''));out.push(grid.map(row=>row[i]).join(''))}
 for(let d=-(n-1);d<n;d++){let down='',up='';for(let r=0;r<n;r++){const c=r+d;if(c>=0&&c<n){down+=grid[r][c];up+=grid[n-1-r][c]}}out.push(down,up)}
 return out.flatMap(l=>[l,[...l].reverse().join('')]);
}
const flip=(w:string)=>[...w].reverse().join('');
/** The cells of every row, column, and diagonal. */
const trackCache=new Map<number,Cell[][]>();
function tracks(n:number){
 const cached=trackCache.get(n);if(cached)return cached;
 const out:Cell[][]=[];
 for(let i=0;i<n;i++){out.push(Array.from({length:n},(_,c)=>({r:i,c})));out.push(Array.from({length:n},(_,r)=>({r,c:i})))}
 for(let d=-(n-1);d<n;d++){const down:Cell[]=[],up:Cell[]=[];for(let r=0;r<n;r++){const c=r+d;if(c>=0&&c<n){down.push({r,c});up.push({r:n-1-r,c})}}out.push(down,up)}
 trackCache.set(n,out);return out;
}
/** Every place the words can be read in the grid, in either direction. Empty cells never match. */
function occurrences(grid:string[][],...words:string[]){
 const out:Cell[][]=[],all=tracks(grid.length),texts=all.map(track=>track.map(p=>grid[p.r][p.c]||'.').join(''));
 for(const word of words){const spellings=flip(word)===word?[word]:[word,flip(word)];texts.forEach((text,t)=>{for(const w of spellings)for(let at=text.indexOf(w);at>=0;at=text.indexOf(w,at+1))out.push(all[t].slice(at,at+w.length))})}
 return out;
}
export function generatePuzzle(settings:WordSettings,random:()=>number=Math.random):Puzzle{
 const {size,words:count,directions}=levels[settings.difficulty];
 const grid:string[][]=Array.from({length:size},()=>Array<string>(size).fill(''));
 const placements:Placement[]=[];
 const pool=shuffle(themeOf(settings.theme).words.filter(w=>w.length<=size),random);
 for(const word of pool){
  if(placements.length===count)break;
  // Skip words hidden inside other words, forwards or backwards (SUN in VENUS), so each answer is unambiguous.
  if(placements.some(p=>[word,flip(word)].some(w=>p.word.includes(w)||w.includes(p.word))))continue;
  const words=[...placements.map(p=>p.word),word];
  // An answer may innocently contain a blocked string (URANUS); crossings must not create a new one.
  const banned=unkind.filter(w=>!words.some(a=>a.includes(w)||flip(a).includes(w)));
  // Crossing words must not spell a second copy of any answer, or anything unkind.
  const ok=(candidate:Cell[])=>{if(!fits(grid,word,candidate))return false;const trial=grid.map(row=>[...row]);candidate.forEach((p,i)=>{trial[p.r][p.c]=word[i]});return occurrences(trial,...words).length===words.length&&occurrences(trial,...banned).length===0};
  let cells:Cell[]|null=null;
  for(let attempt=0;attempt<60&&!cells;attempt++){const candidate=cellsFor(word,Math.floor(random()*size),Math.floor(random()*size),directions[Math.floor(random()*directions.length)]);if(ok(candidate))cells=candidate}
  // A crowded grid (or an unlucky run) falls back to the first spot that fits.
  for(let r=0;r<size&&!cells;r++)for(let c=0;c<size&&!cells;c++)for(const d of directions){const candidate=cellsFor(word,r,c,d);if(ok(candidate)){cells=candidate;break}}
  if(!cells)continue;
  cells.forEach((p,i)=>{grid[p.r][p.c]=word[i]});placements.push({word,cells});
 }
 const letter=()=>String.fromCharCode(65+Math.floor(random()*26));
 const answer=new Set(placements.flatMap(p=>p.cells.map(c=>`${c.r}-${c.c}`)));
 const result=grid.map(row=>row.map(ch=>ch||letter()));
 // Replace filler letters that spell something unkind or accidentally repeat an answer.
 for(let pass=0;pass<300;pass++){
  const trouble=occurrences(result,...unkind,...placements.map(p=>p.word)).map(o=>o.filter(c=>!answer.has(`${c.r}-${c.c}`))).filter(o=>o.length>0);
  if(!trouble.length)break;
  for(const filler of trouble){const c=filler[Math.floor(random()*filler.length)];result[c.r][c.c]=letter()}
 }
 return {size,grid:result,placements:placements.sort((a,b)=>a.word.localeCompare(b.word)),theme:settings.theme,difficulty:settings.difficulty};
}
/** Cells on the straight line between two cells, or null when they are not aligned. */
export function lineBetween(a:Cell,b:Cell):Cell[]|null{
 const dr=b.r-a.r,dc=b.c-a.c,len=Math.max(Math.abs(dr),Math.abs(dc));
 if(dr!==0&&dc!==0&&Math.abs(dr)!==Math.abs(dc))return null;
 return Array.from({length:len+1},(_,i)=>({r:a.r+Math.sign(dr)*i,c:a.c+Math.sign(dc)*i}));
}
/** Snap a free drag to the nearest row, column, or diagonal so little fingers do not need to be exact. */
export function snapLine(a:Cell,b:Cell,size:number):Cell[]{
 const dr=b.r-a.r,dc=b.c-a.c,ar=Math.abs(dr),ac=Math.abs(dc);
 let sr=Math.sign(dr),sc=Math.sign(dc),len=Math.max(ar,ac);
 if(ar>2*ac)sc=0;else if(ac>2*ar)sr=0;
 const out:Cell[]=[];
 for(let i=0;i<=len;i++){const r=a.r+sr*i,c=a.c+sc*i;if(r<0||c<0||r>=size||c>=size)break;out.push({r,c})}
 return out;
}
/** The unfound word spelled by the selected cells, forwards or backwards. */
export function matchWord(puzzle:Puzzle,cells:Cell[],found:string[]):string|null{
 const text=cells.map(p=>puzzle.grid[p.r][p.c]).join(''),reversed=[...text].reverse().join('');
 return puzzle.placements.find(p=>!found.includes(p.word)&&(p.word===text||p.word===reversed))?.word??null;
}
