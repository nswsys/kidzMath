import {createContext} from 'react';
export type Animal='puppy'|'bunny';
export type ItemId='hat'|'bow'|'glasses'|'flower'|'cape'|'crown';
/** Items in the same slot replace each other: a buddy wears one thing on its head at a time. */
export type Item={id:ItemId;name:string;icon:string;stars:number;slot:'head'|'face'|'neck'|'back'};
/** Accessories unlock as the child's total stars grow; nothing is ever spent. */
export const items:Item[]=[
 {id:'hat',name:'Party hat',icon:'🥳',stars:3,slot:'head'},
 {id:'bow',name:'Bow tie',icon:'🎀',stars:8,slot:'neck'},
 {id:'glasses',name:'Sunglasses',icon:'🕶️',stars:15,slot:'face'},
 {id:'flower',name:'Flower',icon:'🌼',stars:25,slot:'head'},
 {id:'cape',name:'Hero cape',icon:'🦸',stars:40,slot:'back'},
 {id:'crown',name:'Crown',icon:'👑',stars:60,slot:'head'}
];
export type Outfits=Record<Animal,ItemId[]>;
export const OUTFIT_KEY='kidzmath.outfit.v1';
export const noOutfits:Outfits={puppy:[],bunny:[]};
export interface Store{getItem(key:string):string|null;setItem(key:string,value:string):void}
const known=(list:unknown):ItemId[]=>Array.isArray(list)?items.map(i=>i.id).filter(id=>list.includes(id)):[];
export function loadOutfits(storage:Store):Outfits{try{const o=JSON.parse(storage.getItem(OUTFIT_KEY)||'null');if(o&&typeof o==='object')return {puppy:known(o.puppy),bunny:known(o.bunny)}}catch{/* Unavailable or corrupt storage starts with no accessories. */}return noOutfits}
export function saveOutfits(storage:Store,outfits:Outfits){storage.setItem(OUTFIT_KEY,JSON.stringify(outfits))}
/** Puts an item on (taking off whatever shared its slot) or takes it off if it was already on. */
export function toggleItem(outfits:Outfits,animal:Animal,id:ItemId):Outfits{
 const item=items.find(i=>i.id===id)!,wearing=outfits[animal];
 return {...outfits,[animal]:wearing.includes(id)?wearing.filter(x=>x!==id):[...wearing.filter(x=>items.find(i=>i.id===x)!.slot!==item.slot),id]};
}
export const unlockedItems=(stars:number)=>items.filter(i=>stars>=i.stars);
/** What each buddy is actually seen wearing: only items the current star total has unlocked. */
export function visibleOutfits(outfits:Outfits,stars:number):Outfits{const ok=unlockedItems(stars).map(i=>i.id);return {puppy:outfits.puppy.filter(id=>ok.includes(id)),bunny:outfits.bunny.filter(id=>ok.includes(id))}}
export const OutfitContext=createContext<Outfits>(noOutfits);
