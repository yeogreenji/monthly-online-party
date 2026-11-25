import type {AvatarKey} from '../types'
export function createAvatarGallery(host:HTMLElement,avatars:AvatarKey[],onSelect:(id:AvatarKey)=>void):{select:(id:AvatarKey)=>void;dispose:()=>void}
