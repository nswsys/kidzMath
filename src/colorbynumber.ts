import type {Difficulty} from './math';
export type Paint={key:string;name:string;hex:string;ink:string};
export type ColorCell={key:string;text:string}|null;
export type ColorSettings={difficulty:Difficulty};
/** `cells[i]` is null for the plain background, otherwise the sum printed in the square and the paint that solves it. */
export type ColorPuzzle={name:string;reveal?:string;size:number;cells:ColorCell[];colors:(Paint&{number:number})[];difficulty:Difficulty};
export const colorDefaults:ColorSettings={difficulty:'Easy'};
/** `ink` is the text colour that stays readable on top of the paint. */
export const paints:Record<string,Paint>={
 r:{key:'r',name:'red',hex:'#e5484d',ink:'#fff'},p:{key:'p',name:'pink',hex:'#f6a5c8',ink:'#3a2030'},o:{key:'o',name:'orange',hex:'#f59e42',ink:'#3a2408'},y:{key:'y',name:'yellow',hex:'#f7d038',ink:'#3a3008'},
 g:{key:'g',name:'green',hex:'#4caf6a',ink:'#fff'},v:{key:'v',name:'purple',hex:'#c3aef2',ink:'#2f2350'},b:{key:'b',name:'blue',hex:'#4aa3e0',ink:'#fff'},n:{key:'n',name:'brown',hex:'#9a6a3c',ink:'#fff'},s:{key:'s',name:'gray',hex:'#b9c2d0',ink:'#2a3040'},k:{key:'k',name:'black',hex:'#3a3340',ink:'#fff'}
};
/** Each picture is ten rows of ten squares; a dot is background and a letter is a paint key. */
export const pictures:{name:string;reveal?:string;rows:string[]}[]=[
 // The app's own buddies, drawn small: Milo the puppy and Luna the bunny.
 {name:'Milo',reveal:'It’s Milo the puppy!',rows:['.nn....nn.','nnnoooonnn','nnoooooonn','nnokookonn','.oooooooo.','.ooyyyyoo.','.oyykkyyo.','..oyrryo..','...oooo...','..........']},
 {name:'Luna',reveal:'It’s Luna the bunny!',rows:['.vv....vv.','.vpv..vpv.','.vpv..vpv.','.vpv..vpv.','.vvvvvvvv.','vvvvvvvvvv','vvkvvvvkvv','vpvvppvvpv','.vvvvvvvv.','..vvvvvv..']},
 {name:'heart',rows:['..........','..rr..rr..','.rprrrrrr.','.rprrrrrr.','.rrrrrrrr.','..rrrrrr..','...rrrr...','....rr....','..........','..........']},
 {name:'fish',rows:['..........','..........','o..ooyoo..','oo.ooyooo.','oooooyooko','oo.ooyooo.','o..ooyoo..','..........','..........','..........']},
 {name:'rocket',rows:['....rr....','...rrrr...','...ssss...','...sbbs...','...sbbs...','...ssss...','..rssssr..','.rrssssrr.','.r..yy..r.','....yy....']},
 {name:'flower',rows:['....pp....','..pppppp..','..ppyypp..','..ppyypp..','..pppppp..','....pp....','....gg....','..g.gg.g..','...gggg...','....gg....']},
 {name:'house',rows:['....rr....','...rrrr...','..rrrrrr..','.rrrrrrrr.','.yyyyyyyy.','.ybbyyyyy.','.ybbyynny.','.yyyyynny.','.yyyyynny.','..........']},
 {name:'tree',rows:['...gggg...','..ggrggg..','.gggggggg.','.ggggrggg.','.grgggggg.','..gggggg..','....nn....','....nn....','....nn....','...nnnn...']},
 {name:'sunny face',rows:['...yyyy...','..yyyyyy..','.yyyyyyyy.','.yykyykyy.','.yyyyyyyy.','.yyyyyyyy.','.yryyyyry.','..yrrrry..','...yyyy...','..........']}
];
/** The answers each level may use for its paints. */
export const colorLevels:Record<Difficulty,{low:number;high:number;note:string}>={Easy:{low:1,high:9,note:'Match the numbers'},Medium:{low:3,high:10,note:'Add up to 10'},Challenge:{low:6,high:18,note:'Add & subtract to 20'}};
function shuffle<T>(items:T[],random:()=>number){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
/** What the buddy announces when the picture is finished. */
export const revealText=(p:{name:string;reveal?:string})=>p.reveal??`It’s ${/^[aeiou]/.test(p.name)?'an':'a'} ${p.name}!`;
/** A sum for one square whose answer is `n`. Easy squares simply show the number. */
export function expression(n:number,difficulty:Difficulty,random:()=>number=Math.random){
 if(difficulty==='Easy')return String(n);
 if(difficulty==='Challenge'&&random()<.5){const take=1+Math.floor(random()*(20-n));return `${n+take}−${take}`}
 const a=1+Math.floor(random()*(n-1));return `${a}+${n-a}`;
}
/** Works out a printed sum, so tests and the game agree with the page. */
export function valueOf(text:string){const m=text.match(/^(\d+)(?:([+−])(\d+))?$/);if(!m)return NaN;return m[2]?(m[2]==='+'?Number(m[1])+Number(m[3]):Number(m[1])-Number(m[3])):Number(m[1])}
export function generateColoring(settings:ColorSettings,random:()=>number=Math.random):ColorPuzzle{
 const picture=pictures[Math.floor(random()*pictures.length)],level=colorLevels[settings.difficulty],keys=[...new Set(picture.rows.join('').replace(/\./g,''))];
 // Every paint gets its own answer, so no two colours share a number.
 const numbers=shuffle(Array.from({length:level.high-level.low+1},(_,i)=>level.low+i),random).slice(0,keys.length);
 const colors=keys.map((k,i)=>({...paints[k],number:numbers[i]})).sort((a,b)=>a.number-b.number);
 return {name:picture.name,reveal:picture.reveal,size:picture.rows.length,difficulty:settings.difficulty,colors,cells:[...picture.rows.join('')].map(k=>k==='.'?null:{key:k,text:expression(colors.find(c=>c.key===k)!.number,settings.difficulty,random)})};
}
