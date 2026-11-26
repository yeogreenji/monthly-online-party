import type { AvatarKey } from '../types'
import type { Look } from './avatarLook'
export type Resident={name:string;avatar:AvatarKey;role:string;greeting:string;coat:string;look?:Partial<Look>}
export const RESIDENTS:Record<string,Resident>={
 season:{name:'노엘',avatar:'deer',role:'시즌 파티 기획자',greeting:'크리스마스 파티에 어서 와요. 빈 초대장에 오늘 나누고 싶은 이야기를 적어 보세요.',coat:'#974e52',look:{style:'coat',hat:'beret',accessory:'scarf'}},
 jazz:{name:'루이',avatar:'otter',role:'재즈바 DJ',greeting:'좋아하는 곡이 있나요? 술이 없어도 한 잔의 여유면 충분해요.',coat:'#495c73'},
 cafe:{name:'모카',avatar:'bear',role:'카페 주인',greeting:'오늘은 커피일까요, 차일까요? 창가 자리를 준비해 뒀어요.',coat:'#d1b895',look:{style:'overalls',hat:'none',accessory:'bow'}},
 travel:{name:'로드',avatar:'fox',role:'엽서 수집가',greeting:'다음에 떠나고 싶은 곳을 지도에 표시해 봐요.',coat:'#718267',look:{style:'vest',hat:'cap',accessory:'camera'}},
 women:{name:'로지',avatar:'rabbit',role:'모임지기',greeting:'오늘의 소소한 이야기부터 편하게 꺼내 봐요.',coat:'#b37f8a',look:{style:'dress',hat:'ribbon',accessory:'necklace'}},
 men:{name:'테오',avatar:'dog',role:'취미 모임지기',greeting:'편한 자리에 앉아요. 요즘 즐기는 것이 궁금해요.',coat:'#788e7a',look:{style:'hoodie',hat:'beanie'}},
 single:{name:'레터',avatar:'penguin',role:'딩동 안내인',greeting:'서로의 취향과 경계를 존중하며 천천히 알아가는 곳이에요.',coat:'#53657b'},
 games:{name:'픽셀',avatar:'raccoon',role:'게임 라운지 주인',greeting:'퀴즈 한 문제, 보드게임 한 판처럼 가볍게 시작해요.',coat:'#9484a0',look:{style:'hoodie',accessory:'headphones'}},
 fandom:{name:'리듬',avatar:'rabbit',role:'덕질 존 안내',greeting:'좋아하는 아티스트가 있나요? 컴백을 함께 기다릴 팬들과 모여 봐요.',coat:'#9872af',look:{style:'knit',hat:'beret',accessory:'glasses'}},
 hobby:{name:'페이지',avatar:'owl',role:'취미 큐레이터',greeting:'책, 그림, 손작업. 좋아하는 것을 함께 이야기해요.',coat:'#947359',look:{style:'knit',hat:'beret',accessory:'glasses'}},
 cinema:{name:'필름',avatar:'panda',role:'영화관지기',greeting:'오늘 마음에 남은 장면은 무엇인가요?',coat:'#9b5c63',look:{style:'tux',accessory:'bow'}},
 home:{name:'단추',avatar:'hamster',role:'소품 디자이너',greeting:'작은 방을 원하는 색으로 꾸며 보세요.',coat:'#a99b72'},
 plaza:{name:'벨',avatar:'cat',role:'마을 안내인',greeting:'딩동! 초인종을 누른 순간부터 오늘의 파티 친구예요.',coat:'#627c69',look:{style:'vest',hat:'beret',accessory:'bow'}},
 'plaza-flora':{name:'플로라',avatar:'rabbit',role:'광장 꽃집지기',greeting:'오늘은 어떤 꽃을 선물하고 싶어요? 광장을 꽃으로 꾸미고 있어요.',coat:'#ef8fb5',look:{style:'dress',hat:'flower'}},
 'plaza-post':{name:'포포',avatar:'squirrel',role:'우편 안내원',greeting:'친구에게 전할 마음을 담는 우편함을 안내할게요. 실제 편지는 계정 연결 후 보낼 수 있어요.',coat:'#318bdc',look:{style:'vest',hat:'cap',accessory:'bag'}},
 'plaza-music':{name:'도레',avatar:'dog',role:'광장 음악지기',greeting:'좋아하는 음악을 이야기해 볼까요? 오늘도 즐거운 파티가 되길 바라요.',coat:'#8562d9',look:{style:'hoodie',accessory:'headphones'}}
}
export const WORLD_INTRO='도시 한쪽에 초인종 소리가 들리는 동네가 있어요. 벨이 광장의 문을 열면 주민들이 각자의 가게에 불을 켭니다. 차 한 잔, 책 한 권, 음악과 수다도 모두 파티가 되는 곳. 오늘은 어떤 문을 열어볼까요?'
export const SEASON_STORY='열두 번째 초대장 — 눈 내리는 저녁, 노엘이 마지막 초대장을 건넵니다. 빈칸에는 오늘 당신이 나누고 싶은 이야기를 적어요.'

export const PLACE_STORIES:Record<string,{title:string;text:string;activity:string}>={
plaza:{title:'초인종이 울리는 광장',text:'벨은 이웃들이 처음 만나는 순간을 좋아합니다. 플로라의 꽃다발, 포포의 엽서, 도레의 음악이 광장을 채웁니다.',activity:'분수와 주민을 만나고 오늘의 모임을 찾아보세요.'},
season:{title:'열두 번째 초대장',text:'노엘은 계절마다 다른 초대장을 준비합니다. 겨울 파티에는 아직 이름이 적히지 않은 마지막 초대장이 남아 있어요.',activity:'크리스마스 티파티, 캐럴 이야기, 사진 촬영.'},
cafe:{title:'모카의 창가 자리',text:'모카는 아침에는 커피, 저녁에는 차를 준비합니다. 창가 자리는 이야기가 필요한 사람을 위해 비워 둡니다.',activity:'창가에 앉아 커피와 디저트 이야기.'},
travel:{title:'로드의 엽서 지도',text:'로드의 엽서는 여행의 시작점입니다. 가보지 않은 도시도 이야기를 나누면 조금 가까워져요.',activity:'지도 살펴보기, 추천 장소 공유.'},
fandom:{title:'덕질 존',text:'공연 무대를 닮은 팬들의 아지트입니다.',activity:'아티스트를 입력해 팬 모임을 만들고 컴백이나 공연 일정을 직접 정할 수 있어요.'},
hobby:{title:'페이지의 작은 작업실',text:'책과 그림, 반려동물 이야기가 모이는 작업실. 페이지는 취미에 정답이 없다고 생각합니다.',activity:'책장 둘러보기와 취미 모임.'},
cinema:{title:'필름의 마지막 장면',text:'필름은 엔딩 크레딧까지 보고 불을 켭니다. 같은 영화도 기억하는 장면은 다르니까요.',activity:'극장 좌석과 영화 감상 이야기.'},
games:{title:'픽셀의 한 판',text:'픽셀에게 게임은 이기는 것보다 함께 웃는 일이 중요합니다.',activity:'게임 테이블, 퀴즈 모임. 실제 게임 엔진은 후속.'},
women:{title:'로지의 티타임',text:'로지는 서로의 이야기를 존중하는 작은 티파티를 엽니다.',activity:'소파에서 일상과 취향 이야기.'},
men:{title:'테오의 아지트',text:'테오는 일상에서 좋아하는 것 하나를 발견하는 모임을 열어요.',activity:'소파와 취미 모임.'},
jazz:{title:'루이의 작은 무대',text:'루이는 한 곡의 음악이 저녁 분위기를 바꾼다고 믿습니다.',activity:'안전 검증 전 입장 잠금.'},
single:{title:'레터의 느린 편지',text:'레터는 서로의 경계와 취향을 존중하는 대화를 준비합니다.',activity:'안전 검증 전 입장 잠금.'},
home:{title:'나를 닮은 작은 집',text:'누구나 자신의 문과 우편함을 가진 동네에서 집은 편하게 쉬는 장소입니다.',activity:'옷장과 집 꾸미기. 실제 친구 방문은 계정 연결 후.'}}
