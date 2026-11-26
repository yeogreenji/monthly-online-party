export function access(id:string):'open'|'locked'|'coming'{
 if(id==='jazz'||id==='single')return 'locked'
 return 'open'
}
export function accessLabel(id:string){return access(id)==='locked'?'연령·안전 확인 전 잠금':access(id)==='coming'?'개발 준비중':'로컬 체험 가능'}
