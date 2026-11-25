export const LOOK_OPTIONS={
 fur:[['natural','기본 털색'],['#d5b18e','밀크티'],['#a49b9e','회색'],['#e8d8bd','크림'],['#805f4f','초콜릿']],
 coat:[['#718675','세이지'],['#a45e68','버건디'],['#617991','네이비'],['#c29c68','머스터드'],['#b28a9f','로즈'],['#ff5b91','딸기우유'],['#46c9b2','민트'],['#8562d9','라벤더'],['#e33150','체리'],['#318bdc','소다'],['#ffca55','레몬'],['#f7e5f3','솜사탕'],['#f47e44','귤'],['#245d9c','딥블루'],['#a1cd54','라임'],['#9d537e','베리'],['#fff4dc','바닐라'],['#39354e','밤하늘'],['#bd754c','캐러멜']],
 style:[['coat','코트'],['knit','니트'],['dress','원피스'],['overalls','멜빵'],['hoodie','후드티'],['vest','조끼'],['tux','정장'],['skirt','플리츠 스커트']],
 shoes:[['#6c574b','브라운'],['#42566d','네이비'],['#9c5d66','레드'],['#e2cfad','크림'],['#ef8fb5','핑크'],['#63b5c3','소다'],['#8b75bb','보라'],['#e7af46','골드']],
 accessory:[['none','없음'],['scarf','목도리'],['bow','리본'],['glasses','안경'],['bag','가방'],['headphones','헤드폰'],['camera','카메라'],['necklace','목걸이']],
 pattern:[['plain','기본 털'],['stripe','이마 줄무늬'],['blaze','이마 하얀 무늬'],['spot','이마 작은 얼룩']],
 hat:[['none','모자 없음'],['beret','베레모'],['ribbon','머리 리본'],['beanie','니트 모자'],['flower','꽃 장식'],['cap','캡 모자'],['crown','왕관']],
 fabric:[['plain','단색'],['dots','작은 도트'],['check','체크'],['stitch','스티치'],['stars','별무늬']],
 eyes:[['round','동그란 눈'],['sleepy','나른한 눈'],['smile','웃는 눈']]
} as const
export type Look={ [K in keyof typeof LOOK_OPTIONS]:string }
export const DEFAULT_LOOK:Look={fur:'natural',coat:'#718675',style:'coat',shoes:'#6c574b',accessory:'none',pattern:'plain',hat:'none',fabric:'plain',eyes:'round'}
export function normalizeLook(value:unknown):Look{
 const v=value&&typeof value==='object'?value as Record<string,unknown>:{}
 const result={...DEFAULT_LOOK}
 for(const key of Object.keys(LOOK_OPTIONS) as (keyof Look)[])if(LOOK_OPTIONS[key].some(([id])=>id===v[key]))result[key]=String(v[key])
 return result
}
