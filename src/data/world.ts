import type { AvatarKey } from '../types'
import { CURRENT_SEASON } from './dingdong'
export type Resident={name:string;avatar:AvatarKey;role:string;greeting:string;coat:string}
export const RESIDENTS:Record<string,Resident>={
 season:{name:'노엘',avatar:'deer',role:'시즌 파티 기획자',greeting:CURRENT_SEASON.title+'에 어서 와요. 빈 초대장에 오늘 나누고 싶은 이야기를 적어 보세요.',coat:'#974e52'},
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
 plaza:{name:'벨',avatar:'cat',role:'맨션 안내인',greeting:'딩동! 초인종을 누른 순간부터 오늘의 파티 친구예요.',coat:'#627c69'},
 book:{"name":"잉크","avatar":"owl","role":"서재 큐레이터","greeting":"책을 다 읽지 않았어도 괜찮아요. 오늘 마음에 남은 한 문장을 나눠요.","coat":"#777b55"},
 pets:{"name":"포포","avatar":"dog","role":"반려동물 모임지기","greeting":"우리 집 친구의 사진이나 이야기를 편하게 나눠요.","coat":"#b69370"},
 music:{"name":"멜로","avatar":"cat","role":"음악 감상실지기","greeting":"한 곡으로 시작해 볼까요? 공식 재생 링크를 함께 나눠요.","coat":"#65798c"},
 drama:{"name":"씬","avatar":"rabbit","role":"드라마 거실지기","greeting":"스포일러는 먼저 표시하고, 마음에 남은 장면을 이야기해요.","coat":"#9c7987"},
 craft:{"name":"스티치","avatar":"squirrel","role":"공방 주인","greeting":"완성하지 않아도 좋아요. 지금 만들고 있는 것을 보여 주세요.","coat":"#947f5d"},
 kitchen:{"name":"버터","avatar":"hamster","role":"부엌 모임지기","greeting":"오늘 먹은 것부터 언젠가 만들고 싶은 디저트까지 환영해요.","coat":"#bd935f"},
 garden:{"name":"아이비","avatar":"deer","role":"온실 정원지기","greeting":"계절에 따라 달라지는 초록과 꽃 이야기를 나눠요.","coat":"#718d72"},
 photo:{"name":"포커스","avatar":"raccoon","role":"사진관 주인","greeting":"사진은 직접 공개할 것을 골라요. 오늘의 작은 장면도 충분해요.","coat":"#88768e"}
}
export const WORLD_INTRO='오래된 황동 초인종을 단 저택에 서로 다른 취향을 가진 동물들이 모였습니다. 문 하나마다 새로운 이야기가 기다립니다.'
export const SEASON_STORY=CURRENT_SEASON.month===12?'열두 번째 초대장 — 눈 내리는 저녁, 노엘이 마지막 초대장을 건넵니다. 빈칸에는 오늘 당신이 나누고 싶은 이야기를 적어요.':CURRENT_SEASON.title+' — 노엘이 이번 달의 새로운 초대장을 건넵니다. 상설 가게는 계절과 관계없이 열려 있습니다.'
