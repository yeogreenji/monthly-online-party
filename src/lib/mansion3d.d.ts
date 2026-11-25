import type { Look } from '../data/avatarLook'
import type { AvatarKey } from '../types'
import type { Space } from '../data/dingdong'
import type { Resident } from '../data/world'
export type WorldController={visit:(id:string)=>void;exit:()=>void;returnHub:()=>void;capture:()=>string|null;interact:(id:string)=>void;stand:()=>void;move:(x:number,z:number)=>void;orbit:(amount:number)=>void;zoom:(amount:number)=>void;setOverview:(value:boolean)=>void;setRoofs:(open:boolean)=>void;dispose:()=>void;setAvatar:(avatar:AvatarKey,look?:Look)=>void;setNight:(night:boolean)=>void;setFestive:(visible:boolean)=>void}
export function createWorld(host:HTMLElement,options:{spaces:Space[];residents:Record<string,Resident>;avatar:AvatarKey;look?:Look;access?:(id:string)=>'open'|'locked'|'coming';onMenu?:(id:string)=>void;onEnter:(id:string)=>void;onLeave:()=>void;onStatus:(s:string)=>void}):WorldController
