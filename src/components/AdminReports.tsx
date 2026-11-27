import { useCallback, useEffect, useState } from 'react'
import { checkAdmin, listReports, removeMessage, setReportStatus, type AdminReport } from '../lib/supabaseTransport'

const REASON: Record<string, string> = { contact: '연락처 교환', abuse: '비방·괴롭힘', ad: '광고', privacy: '개인정보', other: '기타' }
const STATUS: Record<AdminReport['status'], string> = { open: '대기', actioned: '조치함', dismissed: '기각' }

/** 운영자(admins 테이블에 등록된 계정)에게만 보이는 신고 확인 패널. 일반 사용자에게는 아무것도 그리지 않는다. */
export function AdminReports({ signedIn }: { signedIn: boolean }) {
  const [admin, setAdmin] = useState(false)
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<AdminReport['status']>('open')
  const [rows, setRows] = useState<AdminReport[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let live = true
    if (!signedIn) {
      setAdmin(false)
      return
    }
    void checkAdmin().then((v) => live && setAdmin(v))
    return () => {
      live = false
    }
  }, [signedIn])

  const load = useCallback(async () => {
    setBusy(true)
    setRows(await listReports(filter))
    setBusy(false)
  }, [filter])

  useEffect(() => {
    if (admin && open) void load()
  }, [admin, open, load])

  if (!signedIn || !admin) return null

  async function mark(r: AdminReport, status: AdminReport['status']) {
    const ok = await setReportStatus(r.id, status)
    setMsg(ok ? `신고를 ‘${STATUS[status]}’로 바꿨어요.` : '처리하지 못했어요. 권한을 확인해 주세요.')
    if (ok) void load()
  }

  async function removeAndMark(r: AdminReport) {
    if (!r.messageId) return
    const ok = await removeMessage(r.messageId)
    if (!ok) {
      setMsg('메시지를 삭제하지 못했어요.')
      return
    }
    await mark(r, 'actioned')
  }

  return (
    <section className="dd-admin" aria-label="운영자 신고 확인">
      <button type="button" className="btn btn-outline" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? '신고 확인 닫기' : '운영자 · 신고 확인'}
      </button>
      {open && (
        <div className="dd-admin-body">
          <div role="group" aria-label="신고 상태" className="dd-admin-filters">
            {(['open', 'actioned', 'dismissed'] as const).map((s) => (
              <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)}>
                {STATUS[s]}
              </button>
            ))}
            <button type="button" onClick={() => void load()} disabled={busy}>새로고침</button>
          </div>
          {msg && <p role="status" className="text-xs">{msg}</p>}
          {rows === null || busy ? <p className="text-xs">불러오는 중…</p> : rows.length === 0 ? <p className="text-xs">해당 상태의 신고가 없어요.</p> : (
            <ul>
              {rows.map((r) => (
                <li key={r.id}>
                  <header>
                    <strong>{REASON[r.reason] ?? r.reason}</strong>
                    <small>{new Date(r.createdAt).toLocaleString('ko-KR')}</small>
                  </header>
                  <blockquote>{r.snapshot ?? '(본문 기록 없음)'}</blockquote>
                  <small>작성자 {r.snapshotNickname ?? '알 수 없음'}{r.note ? ` · 신고 메모: ${r.note}` : ''}</small>
                  {r.status === 'open' && (
                    <footer>
                      {r.messageId && <button type="button" onClick={() => void removeAndMark(r)}>메시지 삭제·조치</button>}
                      <button type="button" onClick={() => void mark(r, 'actioned')}>조치함</button>
                      <button type="button" onClick={() => void mark(r, 'dismissed')}>기각</button>
                    </footer>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
