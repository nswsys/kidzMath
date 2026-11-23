import type {Difficulty} from './math';
export type ClueThemeId='animals'|'foods'|'world';
export type ClueTheme={id:ClueThemeId;name:string;icon:string;blurb:string;clues:[string,string][]};
export type CrosswordSettings={theme:ClueThemeId;difficulty:Difficulty};
export type Entry={number:number;direction:'across'|'down';word:string;clue:string;cells:number[]};
/** `letters[i]` is the answer for cell i (row-major), or null for a black square. `numbers[i]` is the little clue number, or 0. */
export type Crossword={rows:number;cols:number;letters:(string|null)[];numbers:number[];entries:Entry[];theme:ClueThemeId;difficulty:Difficulty};
export const crosswordThemes:ClueTheme[]=[
 {id:'animals',name:'Animals',icon:'🦊',blurb:'Clues about creatures',clues:[['CAT','It purrs and says meow'],['DOG','It barks and wags its tail'],['LION','A big cat called the king of the jungle'],['TIGER','A big cat with orange and black stripes'],['ZEBRA','It looks like a horse with stripes'],['MONKEY','It swings in trees and loves bananas'],['PANDA','A black and white bear that eats bamboo'],['HORSE','You can ride it, and it says neigh'],['RABBIT','It hops and has long ears'],['FROG','A green jumper that says ribbit'],['BEAR','A big furry animal that sleeps all winter'],['FOX','A clever orange animal with a bushy tail'],['OWL','A bird that hoots at night'],['SHARK','A big fish with sharp teeth'],['TURTLE','It carries its shell on its back'],['DUCK','A bird that says quack'],['COW','It gives us milk and says moo'],['BEE','It buzzes and makes honey'],['SNAKE','A long animal with no legs'],['MOUSE','A tiny animal that loves cheese']]},
 {id:'foods',name:'Yummy foods',icon:'🍎',blurb:'Clues about things to eat',clues:[['APPLE','A red or green fruit that grows on trees'],['BANANA','A long yellow fruit'],['PIZZA','A round food with cheese and sauce'],['BREAD','You use it to make a sandwich'],['MILK','A white drink that comes from cows'],['EGG','A hen lays it'],['CHEESE','A yellow food made from milk'],['RICE','Tiny white grains you cook in water'],['SOUP','A warm food you eat with a spoon'],['CARROT','An orange vegetable that rabbits love'],['GRAPE','A small round fruit that grows in bunches'],['LEMON','A sour yellow fruit'],['HONEY','A sweet food made by bees'],['CAKE','You eat it at a birthday party'],['CORN','A yellow vegetable that grows on a cob'],['TACO','A folded shell filled with tasty food'],['PEAR','A green fruit shaped like a bell'],['COOKIE','A sweet round treat, often with chocolate chips'],['SALAD','A bowl of mixed vegetables'],['JUICE','A drink squeezed from fruit']]},
 {id:'world',name:'Sky & nature',icon:'🌤️',blurb:'Clues about our world',clues:[['SUN','The star that gives us daylight'],['MOON','It shines in the sky at night'],['STAR','A tiny twinkling light in the night sky'],['EARTH','The planet we live on'],['MARS','The red planet'],['RAIN','Water that falls from clouds'],['CLOUD','A white puff floating in the sky'],['TREE','A tall plant with a trunk and leaves'],['FLOWER','A pretty part of a plant, with petals'],['OCEAN','A huge body of salty water'],['RIVER','Water that flows to the sea'],['SNOW','White flakes that fall in winter'],['WIND','Moving air you can feel'],['ROCKET','It blasts off into space'],['PLANET','A big round world that circles a star'],['LEAF','A flat green part of a plant'],['BEACH','Sandy land beside the sea'],['STORM','Wild weather with thunder'],['HILL','A small mountain'],['SEED','You plant it to grow a new plant']]}
];
export const crosswordDefaults:CrosswordSettings={theme:'animals',difficulty:'Easy'};
export const crosswordLevels:Record<Difficulty,{words:number;span:number}>={Easy:{words:4,span:8},Medium:{words:6,span:10},Challenge:{words:8,span:11}};
export const clueThemeOf=(id:string)=>crosswordThemes.find(t=>t.id===id)??crosswordThemes[0];
type Placed={word:string;clue:string;row:number;col:number;down:boolean};
type Cell={letter:string;across:boolean;down:boolean};
function shuffle<T>(items:T[],random:()=>number){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const key=(r:number,c:number)=>`${r},${c}`;
/** Whether a word may go here: it must cross a word going the other way and never touch another word side by side or end to end. */
function fits(grid:Map<string,Cell>,word:string,row:number,col:number,down:boolean){
 const dr=down?1:0,dc=down?0:1;
 if(grid.has(key(row-dr,col-dc))||grid.has(key(row+dr*word.length,col+dc*word.length)))return false;
 let crossings=0;
 for(let i=0;i<word.length;i++){
  const r=row+dr*i,c=col+dc*i,cell=grid.get(key(r,c));
  if(cell){if(cell.letter!==word[i]||(down?cell.down:cell.across))return false;crossings++}
  else if(grid.has(key(r+dc,c+dr))||grid.has(key(r-dc,c-dr)))return false;
 }
 return crossings>0;
}
function put(grid:Map<string,Cell>,p:Placed){for(let i=0;i<p.word.length;i++){const k=key(p.row+(p.down?i:0),p.col+(p.down?0:i)),cell=grid.get(k)??{letter:p.word[i],across:false,down:false};if(p.down)cell.down=true;else cell.across=true;grid.set(k,cell)}}
function bounds(placed:Placed[]){const rows=placed.flatMap(p=>[p.row,p.row+(p.down?p.word.length-1:0)]),cols=placed.flatMap(p=>[p.col,p.col+(p.down?0:p.word.length-1)]);return {top:Math.min(...rows),left:Math.min(...cols),height:Math.max(...rows)-Math.min(...rows)+1,width:Math.max(...cols)-Math.min(...cols)+1}}
function layout(clues:[string,string][],target:number,span:number,random:()=>number){
 const grid=new Map<string,Cell>(),placed:Placed[]=[{word:clues[0][0],clue:clues[0][1],row:0,col:0,down:false}];put(grid,placed[0]);
 let waiting=clues.slice(1);
 // Keep adding any word that can cross what is already on the grid until the puzzle is big enough or nothing else fits.
 for(let grew=true;grew&&placed.length<target;){
  grew=false;
  for(const [word,clue] of waiting){
   const spots:Placed[]=[];
   for(const p of placed)for(let i=0;i<p.word.length;i++)for(let j=0;j<word.length;j++){
    if(p.word[i]!==word[j])continue;
    const down=!p.down,row=down?p.row-j:p.row+i,col=down?p.col+i:p.col-j,next={word,clue,row,col,down};
    if(!fits(grid,word,row,col,down))continue;
    const b=bounds([...placed,next]);if(b.width<=span&&b.height<=span)spots.push(next);
   }
   if(!spots.length)continue;
   const chosen=spots[Math.floor(random()*spots.length)];put(grid,chosen);placed.push(chosen);waiting=waiting.filter(w=>w[0]!==word);grew=true;
   if(placed.length===target)break;
  }
 }
 return placed;
}
export function generateCrossword(settings:CrosswordSettings,random:()=>number=Math.random):Crossword{
 const {words:target,span}=crosswordLevels[settings.difficulty],bank=clueThemeOf(settings.theme).clues.filter(c=>c[0].length<=span);
 let best:Placed[]=[];
 // Some starting words lead to a dead end, so try a few shuffles and, failing those, every starting word in turn.
 for(let attempt=0;attempt<12+bank.length&&best.length<target;attempt++){const order=attempt<12?shuffle(bank,random):[...bank.slice(attempt-12),...bank.slice(0,attempt-12)],found=layout(order,target,span,random);if(found.length>best.length)best=found}
 const b=bounds(best),letters=Array<string|null>(b.width*b.height).fill(null),index=(p:Placed,i:number)=>(p.row-b.top+(p.down?i:0))*b.width+(p.col-b.left+(p.down?0:i));
 for(const p of best)for(let i=0;i<p.word.length;i++)letters[index(p,i)]=p.word[i];
 // Clue numbers run in reading order; an across and a down word starting on the same square share a number.
 const numbers=Array<number>(letters.length).fill(0);let n=0;
 for(const start of [...new Set(best.map(p=>index(p,0)))].sort((x,y)=>x-y))numbers[start]=++n;
 const entries=best.map(p=>({number:numbers[index(p,0)],direction:p.down?'down' as const:'across' as const,word:p.word,clue:p.clue,cells:Array.from(p.word,(_,i)=>index(p,i))})).sort((x,y)=>x.direction===y.direction?x.number-y.number:x.direction==='across'?-1:1);
 return {rows:b.height,cols:b.width,letters,numbers,entries,theme:settings.theme,difficulty:settings.difficulty};
}
