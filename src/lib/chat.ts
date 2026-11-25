import type { RoomId } from '../types'
import { hash } from './dates'

export interface HostRequest {
  mode: 'room' | 'note'
  roomId: RoomId
  roomName: string
  roomTopic: string
  topicDetail?: string
  host: string
  profile: { nickname: string; ageBand: string; tags: string[] }
  peer?: { nickname: string; ageBand: string; tags: string[]; context: string }
  message: string
  history: { role: 'me' | 'host' | 'guest'; name: string; text: string }[]
}

export interface HostReply {
  reply: string
  model: string
}

/** 서버(/api/party-chat)가 없거나 응답하지 않아도 대화가 끊기지 않도록 하는 로컬 호스트 응답. */
export function localHostReply(req: HostRequest): string {
  const text = req.message.trim()
  const snippet = text.length > 34 ? `${text.slice(0, 34)}…` : text
  const pick = hash(text + req.roomId)

  if (req.mode === 'note') {
    const peerLines = [
      `말씀해주셔서 고마워요. ${snippet} — 그 부분이 오늘 저한테도 오래 남았어요.`,
      `네, 그렇게 생각해주시니 저도 편해졌어요. ${snippet} 이야기, 조금 더 들려주실래요?`,
      `${snippet} … 읽고 한참 생각했어요. 저는 다음 파티에도 같은 자리에 있을 것 같아요.`,
      `좋아요. 그럼 다음에 그 이야기로 다시 만나요. 오늘은 여기까지, 좋은 밤 되세요.`,
    ]
    return peerLines[pick % peerLines.length]
  }

  const banks: Record<RoomId, { keys: string[]; lines: string[] }> = {
    wine: {
      keys: ['안주', '치즈', '논알콜', '회사', '야근', '피곤', '고양이', '눈', '비', '혼자', '잔'],
      lines: [
        `"${snippet}" — 그 한마디에 오늘 밤의 온도가 정해진 것 같아요. 잔을 내려놓고 잠깐, 그 얘기 조금만 더 해주시겠어요?`,
        `좋아요. 여기서는 서두를 이유가 없어요. ${snippet} 이야기를 들으니 제 잔도 조금 천천히 움직이네요. 오늘 하루는 어땠어요?`,
        `그 말, 오늘 이 방에 온 이유 같아요. 한 잔 더 따르기 전에 — 지금 옆에 있는 안주는 뭔가요?`,
        `고맙습니다. ${snippet}. 혼자 마시는 밤에도 이렇게 말을 걸어주는 사람이 있다는 게 좋네요. 내일 아침을 위해 오늘은 여기서 한 번 쉬어가요.`,
      ],
    },
    book: {
      keys: ['문장', '밑줄', '주인공', '결말', '읽', '책', '페이지', '작가'],
      lines: [
        `"${snippet}" — 그 문장을 붙잡고 계신 게 느껴져요. 어느 페이지쯤에서 멈추셨나요?`,
        `저도 그 대목에서 오래 머물렀어요. 책은 다 읽는 것보다, 멈춘 자리를 기억하는 일인 것 같습니다.`,
        `그렇게 읽으시는 방식이 좋네요. 오늘의 질문 하나 더 — 그 문장을 한 단어로 줄인다면 무엇일까요?`,
        `좋은 이야기예요. 여기 계신 분들도 각자 다른 속도로 읽고 있으니, 조금 더 천천히 가도 괜찮습니다.`,
      ],
    },
    cinema: {
      keys: ['장면', '결말', '배우', '영화', '드라마', 'ost', '음악', '눈물'],
      lines: [
        `"${snippet}" — 그 장면, 저도 화면을 멈추고 봤어요. 스포일러가 아니게 한 줄로만 더 말해주실래요?`,
        `좋아요. 같은 영화를 봐도 각자 다른 장면을 가져오는 게 이 방의 재미예요. 오늘 가장 오래 남은 컷은 어디인가요?`,
        `그 대사 좋죠. 결말 이야기는 토글을 켜고 이어가요 — 지금은 장면 이야기만.`,
        `그렇게 보셨다니 저도 다시 보고 싶네요. 다음 회차엔 그 작품으로 같이 볼까요?`,
      ],
    },
    music: {
      keys: ['노래', '곡', '재즈', '플레이', '비트', '볼륨', '신청', '캐럴'],
      lines: [
        `"${snippet}" — 그 곡, 아래 투표에 올려주세요. 오늘 밤 순서에 넣어볼게요.`,
        `좋은 선택이에요. 지금 흐르는 세션과 잘 어울립니다. 볼륨은 한 단계만 낮춰주세요, 이웃도 같이 듣고 있으니까요.`,
        `그 노래를 고르는 사람의 밤이 궁금해지네요. 어떤 장면에 어울리는 곡인가요?`,
        `고맙습니다. 신청곡이 쌓일수록 이 방의 색이 짙어지네요. 한 곡 더 받겠습니다.`,
      ],
    },
  }

  const bank = banks[req.roomId]
  const matched = bank.keys.find((key) => text.includes(key))
  if (matched) {
    const byKey: Record<RoomId, Record<string, string>> = {
      wine: {
        안주: '안주 이야기가 나오면 시간이 잘 가요. 오늘은 어떤 걸 접시에 올리셨나요?',
        치즈: '구운 치즈에 꿀 한 줄, 저도 그 조합을 좋아합니다. 잔은 가볍게 두고요.',
        논알콜: '논알콜도 같은 잔에 따르면 같은 건배가 됩니다. 내일 아침이 가벼운 쪽으로 가요.',
        회사: '회사 이야기는 한 잔 하고 나서가 낫습니다. 오늘은 얼마나 힘드셨어요?',
        야근: '야근한 날의 한 잔은 천천히. 오늘은 여기까지로 충분합니다.',
        피곤: '피곤한 날일수록 잔을 오래 들고 있지 마세요. 물 한 잔 먼저, 그다음 이야기해요.',
        고양이: '고양이가 무릎에 있으면 움직이지 않는 게 예의죠. 그대로 계세요.',
        눈: '창밖에 눈이 오면 다들 말수가 줄어요. 오늘은 조용한 잔이 어울립니다.',
        비: '비 오는 밤엔 잔 소리가 유난히 크게 들려요. 좋은 밤입니다.',
        혼자: '혼자인 게 티나지 않게, 조명만 낮추면 됩니다. 여기 다 같은 밤이에요.',
        잔: '잔은 천천히 비우세요. 오늘 밤은 길어도 세 시간입니다.',
      },
      book: {
        문장: '그 문장을 어디에 적어두셨나요? 저는 냅킨에 적어두고 잃어버리는 편입니다.',
        밑줄: '밑줄은 나중에 나를 다시 읽는 장치예요. 오늘은 몇 개나 그으셨나요?',
        주인공: '주인공을 이해하지 못해도 괜찮아요. 이해하려는 시간이 오래 남습니다.',
        결말: '결말은 아직 말하지 않아요. 대신 지금 마음에 걸리는 장면 하나만요.',
        읽: '다 읽지 않아도 됩니다. 오늘 만난 문장이면 충분해요.',
        책: '책을 고르는 기준이 있나요? 저는 첫 문장이 마음에 들어야 3장까지 갑니다.',
        페이지: '페이지를 세는 대신, 멈춘 자리를 기억해보세요.',
        작가: '작가의 다른 책도 이어서 읽으시나요? 이번 달에는 짧은 산문이 좋더라고요.',
      },
      cinema: {
        장면: '그 장면은 몇 분쯤인가요? 저도 그 지점에서 다시 볼게요.',
        결말: '결말 이야기는 스포일러 토글을 켜고 해요. 지금은 접어두죠.',
        배우: '배우의 다른 작품도 이어서 보면 좋아요. 이번 주 추천 목록에 올려둘게요.',
        영화: '오늘은 어떤 걸 보세요? 같은 작품이면 재생 시각 맞춰볼까요?',
        드라마: '드라마는 한 회씩 천천히. 다음 화 이야기는 내일로 미뤄요.',
        ost: '음악이 장면을 반쯤 만드는 것 같아요. 엔딩 크레딧까지 들어보세요.',
        음악: '지금 흐르는 소리와 영화의 온도가 비슷하네요.',
        눈물: '울었으면 좋은 영화였네요. 휴지 한 장 가져오세요.',
      },
      music: {
        노래: '그 노래, 신청곡으로 올려주세요. 오늘 밤 순서에 넣을게요.',
        곡: '한 곡에 한 사람의 밤이 담기죠. 어떤 장면에서 듣고 싶으세요?',
        재즈: '재즈는 말이 적을 때 잘 어울려요. 지금 볼륨이 딱 좋습니다.',
        플레이: '재생 버튼을 눌러보세요. 세 가지 무드 중 오늘은 로우파이부터.',
        비트: '발끝으로 박자 밟는 정도가 가장 좋습니다. 거실에서 혼자 춤춰도 되고요.',
        볼륨: '볼륨은 한 단계 낮게. 이웃도 같은 밤을 보내고 있으니까요.',
        신청: '신청곡은 아래 투표에 한 곡씩. 중복은 합쳐서 셉니다.',
        캐럴: '캐럴 대신 캐럴 같은 재즈, 좋은 선택입니다. 빈스 과랄디부터 들어보세요.',
      },
    }
    return byKey[req.roomId][matched]
  }

  return bank.lines[pick % bank.lines.length]
}

export async function requestHostReply(req: HostRequest): Promise<HostReply> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 14_000)
  try {
    const response = await fetch('/api/party-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = (await response.json()) as { reply?: string; model?: string }
    if (!data.reply) throw new Error('empty reply')
    return { reply: data.reply, model: data.model ?? 'gemini' }
  } catch {
    return { reply: localHostReply(req), model: 'local' }
  } finally {
    window.clearTimeout(timer)
  }
}
