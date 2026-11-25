import type { Look } from '../data/avatarLook'
import type { AvatarKey } from '../types'
import type { Space } from '../data/dingdong'
import type { Resident } from '../data/world'
export type WorldController={visit:(id:string)=>void;exit:()=>void;move:(x:number,z:number)=>void;orbit:(amount:number)=>void;zoom:(amount:number)=>void;dispose:()=>void;setAvatar:(avatar:AvatarKey,look?:Look)=>void;setNight:(night:boolean)=>void}
export function createWorld(host:HTMLElement,options:{spaces:Space[];residents:Record<string,Resident>;avatar:AvatarKey;look?:Look;access?:(id:string)=>'open'|'locked'|'coming';onEnter:(id:string)=>void;onLeave:()=>void;onStatus:(s:string)=>void}):WorldController
