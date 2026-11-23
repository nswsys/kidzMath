import type {Difficulty} from './math';
import {themeOf,type ThemeId} from './wordsearch';
export type ScrambleSettings={theme:ThemeId;difficulty:Difficulty};
export type ScrambleWord={word:string;letters:string[]};
export type ScramblePuzzle={theme:ThemeId;difficulty:Difficulty;words:ScrambleWord[]};
export const scrambleDefaults:ScrambleSettings={theme:'animals',difficulty:'Easy'};
/** How many words a game has and how long they may be. */
export const scrambleLevels:Record<Difficulty,{count:number;min:number;max:number}>={Easy:{count:5,min:3,max:5},Medium:{count:6,min:4,max:7},Challenge:{count:8,min:5,max:10}};
function shuffle<T>(items:T[],random:()=>number){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
/** Mixed-up letters that never spell the word itself. */
export function scrambleLetters(word:string,random:()=>number=Math.random){
 let letters=shuffle([...word],random);
 // An unlucky shuffle can hand the word straight back; sliding the letters along always changes it unless every letter is the same.
 for(let turn=0;turn<word.length&&letters.join('')===word;turn++)letters=[...letters.slice(1),letters[0]];
 return letters;
}
export function generateScramble(settings:ScrambleSettings,random:()=>number=Math.random):ScramblePuzzle{
 const level=scrambleLevels[settings.difficulty],pool=themeOf(settings.theme).words.filter(w=>w.length>=level.min&&w.length<=level.max);
 return {theme:settings.theme,difficulty:settings.difficulty,words:shuffle(pool,random).slice(0,level.count).map(word=>({word,letters:scrambleLetters(word,random)}))};
}
/** The tiles can sometimes spell another word from the same theme (LEMON and MELON); that counts too. */
export function isUnscrambled(puzzle:ScramblePuzzle,index:number,attempt:string){
 const word=puzzle.words[index].word;
 return attempt===word||(attempt.length===word.length&&[...attempt].sort().join('')===[...word].sort().join('')&&themeOf(puzzle.theme).words.includes(attempt));
}
