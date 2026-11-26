// 입력 단계 안전 필터. 서버가 없는 지금도 ‘연락처 교환 금지’ 규칙을 실제로 적용한다.
// 서버 도입 후에는 같은 규칙을 서버에서도 한 번 더 검사해야 한다(클라이언트 검사는 우회 가능).

export type SafetyResult = { ok: true } | { ok: false; reason: string }

const PHONE = /(?:\+?82[-.\s]?)?0?1[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const ID_REQUEST = /(카톡|카카오톡|카카오\s*아이디|오픈\s*채팅|오카방|텔레그램|라인\s*아이디|인스타\s*(?:dm|디엠)|디엠\s*줘|연락처\s*(?:줘|알려|교환)|번호\s*(?:줘|알려|교환))/i
const SPAM_REPEAT = /(.)\1{11,}/u

/** 한글·영문·숫자 사이의 공백·기호를 지워 숫자 쪼개기 우회(“공 일 공…”)를 일부 막는다. */
function squash(text: string) {
  return text.replace(/[\s.\-_·,~]/g, '')
}

export function checkChatText(text: string): SafetyResult {
  const t = text.trim()
  if (!t) return { ok: true }
  if (PHONE.test(t) || PHONE.test(squash(t))) return { ok: false, reason: '전화번호는 보낼 수 없어요. 연락처 교환은 딩동 규칙상 금지예요.' }
  if (EMAIL.test(t)) return { ok: false, reason: '이메일 주소는 보낼 수 없어요. 연락처 교환은 딩동 규칙상 금지예요.' }
  if (ID_REQUEST.test(t)) return { ok: false, reason: '다른 앱으로 이어지는 연락처 요청은 보낼 수 없어요. 대화는 딩동 안에서 이어 가요.' }
  if (SPAM_REPEAT.test(t)) return { ok: false, reason: '같은 글자를 너무 많이 반복했어요. 조금 줄여 주세요.' }
  return { ok: true }
}

export function checkNickname(name: string): SafetyResult {
  const n = name.trim()
  if (n.length < 2) return { ok: false, reason: '닉네임은 두 글자 이상으로 지어주세요.' }
  if (n.length > 12) return { ok: false, reason: '닉네임은 열두 글자까지 쓸 수 있어요.' }
  if (PHONE.test(squash(n)) || EMAIL.test(n)) return { ok: false, reason: '닉네임에는 연락처를 넣을 수 없어요.' }
  if (/^(?:운영자|관리자|딩동\s*운영|admin)/i.test(n)) return { ok: false, reason: '운영진으로 오해할 수 있는 닉네임은 쓸 수 없어요.' }
  return { ok: true }
}
