export const LOOK_OPTIONS={
 fur:[['natural','기본 털색'],['#d5b18e','밀크티'],['#a49b9e','회색'],['#e8d8bd','크림'],['#805f4f','초콜릿']],
 coat:[['#718675','세이지'],['#a45e68','버건디'],['#617991','네이비'],['#c29c68','머스터드'],['#b28a9f','로즈'],['#ff5b91','딸기우유'],['#46c9b2','민트'],['#8562d9','라벤더'],['#e33150','체리'],['#318bdc','소다'],['#ffca55','레몬'],['#f7e5f3','솜사탕'],['#f47e44','귤'],['#245d9c','딥블루'],['#a1cd54','라임'],['#9d537e','베리'],['#fff4dc','바닐라'],['#39354e','밤하늘'],['#bd754c','캐러멜'],['#ff236f','네온 핑크'],['#6d28d9','전기 보라'],['#0059f8','코발트'],['#00bce1','아쿠아'],['#008756','에메랄드'],['#d6ed00','형광 라임'],['#ff6819','탠저린'],['#c91636','루비'],['#171928','잉크'],['#fffdfa','스노우'],['#f3c0a4','살구'],['#d8c7a8','오트밀'],['#bcd6e8','스카이'],['#e7c7e6','라일락 핑크'],['#8e6a4f','모카'],['#4a5d52','딥 그린'],['#f6b8c8','피오니'],['#cfe0b0','애플'],['#f9dfa0','버터 크림']],
 style:[['coat','코트'],['knit','니트'],['dress','원피스'],['overalls','멜빵'],['hoodie','후드티'],['vest','조끼'],['tux','정장'],['skirt','플리츠 스커트'],['denim','데님 재킷'],['sailor','세일러룩'],['puffer','패딩'],['cape','케이프'],['cardigan','가디건'],['blouse','블라우스'],['jumpsuit','점프수트'],['hanbok','한복'],['trench','트렌치코트']],
 shoes:[['#6c574b','브라운'],['#42566d','네이비'],['#9c5d66','레드'],['#e2cfad','크림'],['#ef8fb5','핑크'],['#63b5c3','소다'],['#8b75bb','보라'],['#e7af46','골드']],
 accessory:[['none','없음'],['scarf','목도리'],['bow','리본'],['glasses','안경'],['bag','가방'],['headphones','헤드폰'],['camera','카메라'],['necklace','목걸이'],['tote','캔버스 토트백'],['flowerbag','꽃 가방'],['bowtie','나비 넥타이'],['sunnies','선글라스'],['earmuffs','귀마개'],['backpack','백팩'],['shoulderbag','숄더백']],
 pattern:[['plain','기본 털'],['stripe','이마 줄무늬'],['blaze','이마 하얀 무늬'],['spot','이마 작은 얼룩']],
 hat:[['none','모자 없음'],['beret','베레모'],['ribbon','머리 리본'],['beanie','니트 모자'],['flower','꽃 장식'],['cap','캡 모자'],['crown','왕관'],['sunhat','밀짚모자'],['bucket','버킷햇'],['hairband','헤어밴드']],
 fabric:[['plain','단색'],['dots','작은 도트'],['check','체크'],['stitch','스티치'],['stars','별무늬'],['gingham','깅엄'],['flower','꽃무늬']],
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

export const OUTFIT_COLLECTIONS=[{name:'딸기 피크닉',look:{style:'dress',coat:'#ff5b91',hat:'ribbon',accessory:'flowerbag',shoes:'#e2cfad',fabric:'dots'}},{name:'시티 데님',look:{style:'denim',coat:'#245d9c',hat:'cap',accessory:'tote',shoes:'#e2cfad',fabric:'stitch'}},{name:'레몬 마린',look:{style:'sailor',coat:'#318bdc',hat:'beret',accessory:'bow',shoes:'#e7af46',fabric:'plain'}},{name:'라벤더 스트리트',look:{style:'hoodie',coat:'#8562d9',hat:'beanie',accessory:'headphones',shoes:'#63b5c3',fabric:'stars'}},{name:'민트 아틀리에',look:{style:'overalls',coat:'#46c9b2',hat:'beret',accessory:'glasses',shoes:'#6c574b',fabric:'check'}},{name:'체리 갈라',look:{style:'cape',coat:'#e33150',hat:'crown',accessory:'necklace',shoes:'#e7af46',fabric:'plain'}},{name:'코지 윈터',look:{style:'puffer',coat:'#f47e44',hat:'beanie',accessory:'scarf',shoes:'#8b75bb',fabric:'plain'}},{name:'선데이 북클럽',look:{style:'knit',coat:'#ffca55',hat:'beret',accessory:'tote',shoes:'#9c5d66',fabric:'check'}},{name:'네온 팝',look:{style:'hoodie',coat:'#ff236f',hat:'cap',accessory:'headphones',shoes:'#63b5c3',fabric:'stars'}},{name:'아쿠아 마린',look:{style:'sailor',coat:'#00bce1',hat:'beret',accessory:'bow',shoes:'#e2cfad',fabric:'stitch'}},{name:'에메랄드 산책',look:{style:'coat',coat:'#008756',hat:'flower',accessory:'flowerbag',shoes:'#e7af46',fabric:'check'}}] as const
