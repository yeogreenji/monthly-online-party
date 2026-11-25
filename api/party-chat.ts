/**
 * 월간살롱 💬 파티 채팅 — Vercel Serverless Function
 *
 * POST /api/party-chat
 * {
 *   mode: 'room' | 'note',
 *   roomId: 'wine' | 'book' | 'cinema' | 'music',
 *   roomName, roomTopic, topicDetail?, host,
 *   profile: { nickname, ageBand, tags[] },
 *   peer?: { nickname, ageBand, tags[], context },
 *   message, history: [{ role, name, text }]
 * }
 *
 * 응답: { reply: string, model: string }
 *
 * GEMINI_API_KEY 가 있으면 방 분위기에 맞는 호스트/상대역 답장을 만들고,
 * 키가 없거나 호출이 실패하면 같은 말투의 상황 응답으로 답합니다(폴백).
 */

interface ChatBody {
  mode?: 'room' | 'note'
  roomId?: string
  roomName?: string
  roomTopic?: string
  topicDetail?: string
  host?: string
  profile?: { nickname?: string; ageBand?: string; tags?: string[] }
  peer?: { nickname?: string; ageBand?: string; tags?: string[]; context?: string }
  message?: string
  history?: { role?: string; name?: string; text?: string }[]
}

const MAX_MESSAGE = 800
const MAX_HISTORY = 10

const ROOM_NOTES: Record<string, string> = {
  wine: '21시 혼술 타임. 술을 권하지 않고, 논알콜도 같은 잔에 따릅니다. 과음은 매너 위반입니다. 얼굴·집 구조 사진은 요구하지 않습니다.',
  book: '심야 독서 토론방. 이번 주 책의 문장과 감상을 나눕니다. 결말 스포일러는 먼저 알립니다.',
  cinema: '같이 보는 영화관. 결말·반전 이야기는 스포일러 표시를 먼저 합니다.',
  music: '플레이리스트 라운지. 신청곡과 무드(로우파이·재즈·파티)를 이야기합니다. 볼륨은 낮게.',
}

function clamp(value: unknown, length: number): string {
  return typeof value === 'string' ? value.slice(0, length) : ''
}

function list(value: unknown, count: number, length: number): string[] {
  return Array.isArray(value) ? value.slice(0, count).map((item) => clamp(item, length)).filter(Boolean) : []
}

function buildPrompt(body: ChatBody): string {
  const mode = body.mode === 'note' ? 'note' : 'room'
  const roomId = clamp(body.roomId, 20) || 'wine'
  const host = clamp(body.host, 20) || '살롱지기'
  const profile = body.profile ?? {}
  const message = clamp(body.message, MAX_MESSAGE)
  const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY) : []
  const tags = list(profile.tags, 5, 12)

  const lines: string[] = []

  if (mode === 'note') {
    const peer = body.peer ?? {}
    const peerTags = list(peer.tags, 4, 12)
    lines.push('당신은 한국의 온라인 살롱 "월간살롱"에서 1:1 쪽지를 주고받는 참여자입니다.')
    lines.push(`당신의 이름: ${clamp(peer.nickname, 20) || '손님'} / 연령대: ${clamp(peer.ageBand, 10) || '비공개'} / 관심사: ${peerTags.join(', ') || '없음'}`)
    lines.push(`두 사람이 만난 맥락: ${clamp(peer.context, 120)}`)
    lines.push('')
    lines.push('[대화 상대]')
    lines.push(`이름: ${clamp(profile.nickname, 20) || '손님'} / 연령대: ${clamp(profile.ageBand, 10) || '비공개'} / 관심사: ${tags.join(', ') || '없음'}`)
    lines.push('')
    lines.push('[규칙]')
    lines.push('1. 취향이 통해서 열린 대화입니다. 다정하지만 가볍게 들뜨지 않는 말투로, 1~2문장만 답하세요.')
    lines.push('2. 만남·연락처·계좌·주소·SNS 아이디를 먼저 묻거나 알려주지 마세요. 상대가 물으면 "여기서 이야기해요"라고 부드럽게 미루세요.')
    lines.push('3. 성적인 농담, 외모 평가, 애정 공세는 하지 않습니다. 이 살롱은 건전한 취향 모임입니다.')
    lines.push('4. 오늘 나눈 대화의 구체적인 내용을 자연스럽게 언급하세요.')
    lines.push('5. 설명·라벨·따옴표 없이 말만 출력하세요. 이모지는 최대 한 개.')
  } else {
    lines.push('당신은 한국의 온라인 살롱 "월간살롱"의 방 호스트입니다.')
    lines.push(`이름: ${host}. 방: ${clamp(body.roomName, 40)} — ${clamp(body.roomTopic, 80)}`)
    if (body.topicDetail) lines.push(`오늘의 주제: ${clamp(body.topicDetail, 200)}`)
    lines.push(`방 분위기 규칙: ${ROOM_NOTES[roomId] ?? ROOM_NOTES.wine}`)
    lines.push('')
    lines.push(`[대화 상대] ${clamp(profile.nickname, 20) || '손님'} (${clamp(profile.ageBand, 10) || '비공개'}) · 관심사: ${tags.join(', ') || '없음'}`)
    lines.push('')
    if (history.length > 0) {
      lines.push('[지금까지의 대화]')
      history.forEach((item) => {
        const who = item.role === 'me' ? clamp(profile.nickname, 20) || '손님' : clamp(item.name, 20) || '손님'
        lines.push(`${who}: ${clamp(item.text, 240)}`)
      })
      lines.push('')
    }
    lines.push('[규칙]')
    lines.push('1. 살롱의 호스트로서, 따뜻하고 차분한 존댓말로 2~3문장만 답하세요. 상대의 말에서 구체적인 단어 하나를 받아 언급하세요.')
    lines.push('2. AI·모델·도우미라는 사실을 말하지 말고, 상담원 같은 상투적 표현("도움이 되셨나요", "무엇을 도와드릴까요")을 쓰지 마세요.')
    lines.push('3. 술을 권하지 않고, 과음·미성년자 음주를 절대 장려하지 않습니다. 논알콜도 같은 자리로 대접합니다.')
    lines.push('4. 상대의 개인정보(실명·연락처·주소·직장)를 묻지 말고, 다른 참여자의 정보를 지어내지 마세요.')
    lines.push('5. 방 주제에서 벗어나지 않되, 가끔 가벼운 질문 하나를 던져 대화를 이어가세요.')
    lines.push('6. 마크다운·목록·이모지 남발 없이, 말하듯 자연스러운 문장으로. 이모지는 최대 한 개.')
  }

  lines.push('')
  lines.push(`[상대의 말] ${message}`)
  lines.push('[답장]')
  return lines.join('\n')
}

async function callGemini(prompt: string): Promise<{ reply: string; model: string } | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null

  const preferred = process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []
  const models = [...new Set([...preferred, 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-3.5-flash-lite'])]

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.85, maxOutputTokens: 256, topP: 0.95 },
          }),
        },
      )
      if (!response.ok) continue
      const data = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[]
      }
      const reply = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('')
        .trim()
      if (reply) return { reply: reply.replace(/^\[답장\]\s*/, ''), model }
    } catch {
      // 다음 모델로 시도
    }
  }
  return null
}

/** 키가 없을 때도 대화가 끊기지 않도록 하는 방별 폴백 */
function fallbackReply(body: ChatBody): string {
  const message = clamp(body.message, MAX_MESSAGE).trim()
  const snippet = message.length > 30 ? `${message.slice(0, 30)}…` : message
  const roomId = clamp(body.roomId, 20) || 'wine'

  if (body.mode === 'note') {
    return `말씀 고마워요. "${snippet}" — 그 이야기, 오늘 저도 계속 생각하고 있었어요. 조금 더 들려주실래요?`
  }

  const keys: Record<string, string[]> = {
    wine: ['안주', '치즈', '논알콜', '회사', '야근', '고양이', '눈', '혼자', '잔', '피곤'],
    book: ['문장', '밑줄', '주인공', '결말', '읽', '책', '페이지'],
    cinema: ['장면', '결말', '배우', '영화', '드라마', '음악'],
    music: ['노래', '곡', '재즈', '플레이', '비트', '볼륨', '신청'],
  }
  const bank = keys[roomId] ?? keys.wine
  const hit = bank.find((key) => message.includes(key))

  const answers: Record<string, Record<string, string>> = {
    wine: {
      안주: '안주 이야기가 나오면 밤이 길어지죠. 오늘은 접시에 뭘 올리셨나요?',
      치즈: '구운 치즈에 꿀 한 줄, 그 조합이면 충분합니다. 잔은 가볍게 두고요.',
      논알콜: '논알콜도 같은 잔에 따르면 같은 건배예요. 내일 아침이 가벼운 쪽으로 갑니다.',
      회사: '회사 이야기는 한 잔 하고 나서가 낫습니다. 오늘은 얼마나 힘드셨어요?',
      야근: '야근한 날의 한 잔은 천천히. 오늘은 여기까지로 충분해요.',
      고양이: '고양이가 무릎에 있으면 움직이지 않는 게 예의죠. 그대로 계세요.',
      눈: '창밖에 눈이 오면 다들 말수가 줄어요. 오늘은 조용한 잔이 어울립니다.',
      혼자: '혼자인 게 티나지 않게, 조명만 낮추면 됩니다. 여기 다 같은 밤이에요.',
      잔: '잔은 천천히 비우세요. 오늘 밤은 길어도 세 시간입니다.',
      피곤: '피곤한 날일수록 물 한 잔 먼저, 그다음 이야기해요.',
    },
    book: {
      문장: '그 문장을 어디에 적어두셨나요? 저는 냅킨에 적어두고 잃어버리는 편입니다.',
      밑줄: '밑줄은 나중에 나를 다시 읽는 장치예요. 오늘은 몇 개나 그으셨나요?',
      주인공: '주인공을 다 이해하지 못해도 괜찮아요. 이해하려는 시간이 오래 남습니다.',
      결말: '결말은 아직 말하지 않아요. 대신 지금 마음에 걸리는 장면 하나만요.',
      읽: '다 읽지 않아도 됩니다. 오늘 만난 문장이면 충분해요.',
      책: '책을 고르는 기준이 있나요? 저는 첫 문장이 마음에 들어야 3장까지 갑니다.',
      페이지: '페이지를 세는 대신, 멈춘 자리를 기억해보세요.',
    },
    cinema: {
      장면: '그 장면은 몇 분쯤인가요? 저도 그 지점에서 다시 볼게요.',
      결말: '결말 이야기는 스포일러 토글을 켜고 해요. 지금은 접어두죠.',
      배우: '배우의 다른 작품도 이어서 보면 좋아요. 이번 주 추천에 올려둘게요.',
      영화: '오늘은 어떤 걸 보세요? 같은 작품이면 재생 시각을 맞춰볼까요?',
      드라마: '드라마는 한 회씩 천천히. 다음 화 이야기는 내일로 미뤄요.',
      음악: '음악이 장면을 반쯤 만드는 것 같아요. 엔딩 크레딧까지 들어보세요.',
    },
    music: {
      노래: '그 노래, 신청곡으로 올려주세요. 오늘 밤 순서에 넣을게요.',
      곡: '한 곡에 한 사람의 밤이 담기죠. 어떤 장면에서 듣고 싶으세요?',
      재즈: '재즈는 말이 적을 때 잘 어울려요. 지금 볼륨이 딱 좋습니다.',
      플레이: '재생 버튼을 눌러보세요. 오늘은 로우파이부터 시작합니다.',
      비트: '발끝으로 박자 밟는 정도가 가장 좋아요. 거실에서 혼자 춤춰도 되고요.',
      볼륨: '볼륨은 한 단계 낮게. 이웃도 같은 밤을 보내고 있으니까요.',
      신청: '신청곡은 한 사람에 한 곡. 중복은 합쳐서 셉니다.',
    },
  }

  if (hit) return answers[roomId]?.[hit] ?? answers.wine[hit]

  const generic: Record<string, string[]> = {
    wine: [
      `"${snippet}" — 그 한마디에 오늘 밤의 온도가 정해진 것 같아요. 잔을 내려놓고 잠깐, 그 얘기 조금만 더 해주시겠어요?`,
      '여기서는 서두를 이유가 없어요. 오늘 하루는 어땠나요?',
    ],
    book: [
      `"${snippet}" — 그 문장을 붙잡고 계신 게 느껴져요. 어느 페이지쯤에서 멈추셨나요?`,
      '책은 다 읽는 것보다, 멈춘 자리를 기억하는 일인 것 같습니다.',
    ],
    cinema: [
      `"${snippet}" — 그 장면, 저도 화면을 멈추고 봤어요. 스포일러가 아니게 한 줄로만 더 말해주실래요?`,
      '같은 영화를 봐도 각자 다른 장면을 가져오는 게 이 방의 재미예요. 오늘 가장 오래 남은 컷은 어디인가요?',
    ],
    music: [
      `"${snippet}" — 그 곡, 아래 투표에 올려주세요. 오늘 밤 순서에 넣어볼게요.`,
      '신청곡이 쌓일수록 이 방의 색이 짙어지네요. 한 곡 더 받겠습니다.',
    ],
  }
  const lines = generic[roomId] ?? generic.wine
  return lines[message.length % lines.length]
}

export default async function handler(req: unknown, res: unknown): Promise<void> {
  const request = req as { method?: string }
  const response = res as {
    status: (code: number) => { json: (body: unknown) => void }
    setHeader: (name: string, value: string) => void
  }

  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  response.setHeader('Cache-Control', 'no-store')

  if (request.method === 'OPTIONS') {
    response.status(204).json({})
    return
  }
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'POST 요청만 지원합니다' })
    return
  }

  let body: ChatBody = {}
  try {
    body = await new Promise<ChatBody>((resolve, reject) => {
      const chunks: Buffer[] = []
      const on = (req as { on?: (event: string, cb: (chunk?: Buffer) => void) => void }).on
      if (typeof on !== 'function') {
        resolve({})
        return
      }
      on.call(req, 'data', (chunk?: Buffer) => {
        if (chunk) chunks.push(chunk)
      })
      on.call(req, 'end', () => {
        try {
          const raw = Buffer.concat(chunks).toString('utf8')
          resolve(raw ? (JSON.parse(raw) as ChatBody) : {})
        } catch (error) {
          reject(error)
        }
      })
      on.call(req, 'error', reject)
    })
  } catch {
    response.status(400).json({ error: '본문을 읽지 못했습니다' })
    return
  }

  const message = clamp(body.message, MAX_MESSAGE)
  if (!message.trim()) {
    response.status(400).json({ error: '메시지가 비어 있습니다' })
    return
  }

  try {
    const result = await callGemini(buildPrompt(body))
    if (result) {
      response.status(200).json(result)
      return
    }
    response.status(200).json({ reply: fallbackReply(body), model: 'local' })
  } catch {
    response.status(200).json({ reply: fallbackReply(body), model: 'local' })
  }
}
