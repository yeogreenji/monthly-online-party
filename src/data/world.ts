import type { AvatarKey } from '../types'
import type { Look } from './avatarLook'
export type Resident={name:string;avatar:AvatarKey;role:string;greeting:string;coat:string;look?:Partial<Look>}
export const RESIDENTS:Record<string,Resident>={
 season:{name:'노엘',avatar:'deer',role:'시즌 파티 기획자',greeting:'올해의 첫 크리스마스 파티에 어서 와요. 빈 초대장에 오늘 나누고 싶은 이야기를 적어 보세요.',coat:'#974e52'},
 jazz:{name:'루이',avatar:'otter',role:'재즈바 DJ',greeting:'좋아하는 곡이 있나요? 술이 없어도 한 잔의 여유면 충분해요.',coat:'#495c73'},
 cafe:{name:'모카',avatar:'bear',role:'카페 주인',greeting:'오늘은 커피일까요, 차일까요? 창가 자리를 준비해 뒀어요.',coat:'#d1b895'},
 travel:{name:'로드',avatar:'fox',role:'엽서 수집가',greeting:'다음에 떠나고 싶은 곳을 지도에 표시해 봐요.',coat:'#718267'},
 women:{name:'로지',avatar:'rabbit',role:'모임지기',greeting:'오늘의 소소한 이야기부터 편하게 꺼내 봐요.',coat:'#b37f8a'},
 men:{name:'테오',avatar:'dog',role:'취미 모임지기',greeting:'편한 자리에 앉아요. 요즘 즐기는 것이 궁금해요.',coat:'#788e7a'},
 single:{name:'레터',avatar:'penguin',role:'살롱 안내인',greeting:'서로의 취향과 경계를 존중하며 천천히 알아가는 곳이에요.',coat:'#53657b'},
 games:{name:'픽셀',avatar:'raccoon',role:'게임 라운지 주인',greeting:'퀴즈 한 문제, 보드게임 한 판처럼 가볍게 시작해요.',coat:'#9484a0'},
 hobby:{name:'페이지',avatar:'owl',role:'취미 큐레이터',greeting:'책, 그림, 손작업. 좋아하는 것을 함께 이야기해요.',coat:'#947359'},
 cinema:{name:'필름',avatar:'panda',role:'영화관지기',greeting:'오늘 마음에 남은 장면은 무엇인가요?',coat:'#9b5c63'},
 home:{name:'단추',avatar:'hamster',role:'소품 디자이너',greeting:'작은 방을 원하는 색으로 꾸며 보세요.',coat:'#a99b72'},
 plaza:{name:'벨',avatar:'cat',role:'마을 안내인',greeting:'딩동! 초인종을 누른 순간부터 오늘의 파티 친구예요.',coat:'#627c69',look:{style:'vest',hat:'beret',accessory:'bow'}},
 'plaza-flora':{name:'플로라',avatar:'rabbit',role:'광장 꽃집지기',greeting:'오늘은 어떤 꽃을 선물하고 싶어요? 광장을 꽃으로 꾸미고 있어요.',coat:'#ef8fb5',look:{style:'dress',hat:'flower'}},
 'plaza-post':{name:'포포',avatar:'squirrel',role:'우편 안내원',greeting:'친구에게 전할 마음을 담는 우편함을 안내할게요. 실제 편지는 계정 연결 후 보낼 수 있어요.',coat:'#318bdc',look:{style:'vest',hat:'cap',accessory:'bag'}},
 'plaza-music':{name:'도레',avatar:'dog',role:'광장 음악지기',greeting:'좋아하는 음악을 이야기해 볼까요? 오늘도 즐거운 파티가 되길 바라요.',coat:'#8562d9',look:{style:'hoodie',accessory:'headphones'}}
}
export const WORLD_INTRO='딩동! 차 한 잔, 좋아하는 책, 음악과 수다까지 모두 파티예요. 작은 골목의 가게를 찾아 오늘의 이야기를 나눠요.'
export const SEASON_STORY='열두 번째 초대장 — 눈 내리는 저녁, 노엘이 마지막 초대장을 건넵니다. 빈칸에는 오늘 당신이 나누고 싶은 이야기를 적어요.'
