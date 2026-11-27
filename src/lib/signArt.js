/* eslint-disable */
/** 캔버스 이름표/간판 렌더러 — 나무 팻말·놋쇠 명판·종이 라벨. 3D 마을의 가구 톤과 맞춘다. */
export function drawWoodSign(text, kind = 'shop') {
  const W = 512, H = 128
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')
  if (!ctx) return null
  const name = kind === 'name', bubble = kind === 'bubble', prop = kind === 'prop'
  const round = (a, b, w, h, r) => { ctx.beginPath(); ctx.roundRect(a, b, w, h, r) }

  const plank = (a, b, w, h, r) => {
    const g = ctx.createLinearGradient(0, b, 0, b + h)
    g.addColorStop(0, '#d9a56c'); g.addColorStop(.42, '#b87f49'); g.addColorStop(1, '#8a5731')
    round(a, b, w, h, r); ctx.fillStyle = g; ctx.fill()
    ctx.save(); ctx.clip(); ctx.globalAlpha = .18; ctx.strokeStyle = '#5b381c'; ctx.lineWidth = 1.3
    for (let i = 1; i < 8; i++) {
      const yy = b + i * h / 8
      ctx.beginPath(); ctx.moveTo(a - 4, yy)
      ctx.bezierCurveTo(a + w * .3, yy - 2.5, a + w * .68, yy + 3, a + w + 4, yy - 1.5); ctx.stroke()
    }
    ctx.globalAlpha = .1; ctx.fillStyle = '#fff3d6'
    ctx.fillRect(a, b, w, h * .16); ctx.restore(); ctx.globalAlpha = 1
  }
  const brassFrame = (a, b, w, h, r, lw) => {
    const g = ctx.createLinearGradient(0, b, 0, b + h)
    g.addColorStop(0, '#ffeeb4'); g.addColorStop(.45, '#dcae55'); g.addColorStop(1, '#a87a33')
    round(a, b, w, h, r); ctx.strokeStyle = g; ctx.lineWidth = lw; ctx.stroke()
    for (const [sx, sy] of [[a + 11, b + 11], [a + w - 11, b + 11], [a + 11, b + h - 11], [a + w - 11, b + h - 11]]) {
      ctx.beginPath(); ctx.arc(sx, sy, 3.6, 0, 7); ctx.fillStyle = '#8a6224'; ctx.fill()
      ctx.beginPath(); ctx.arc(sx - .9, sy - .9, 2.1, 0, 7); ctx.fillStyle = '#ffeeb6'; ctx.fill()
    }
  }

  ctx.save()
  ctx.shadowColor = 'rgba(52,28,12,.42)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 6
  let maxW = 440, ink = '#fff7e4', shadowInk = '#43260f'
  if (prop) {
    const a = 14, b = 20, w = 484, h = 90
    round(a, b, w, h, 15); ctx.fillStyle = '#8a5731'; ctx.fill()
    ctx.shadowColor = 'transparent'
    round(a + 6, b + 6, w - 12, h - 12, 10); ctx.fillStyle = '#fff8e7'; ctx.fill()
    ctx.strokeStyle = '#e0c193'; ctx.lineWidth = 2
    round(a + 12, b + 12, w - 24, h - 24, 8); ctx.stroke()
    maxW = w - 52; ink = '#5f3d1c'; shadowInk = '#fffaf0'
  } else if (name) {
    const a = 78, b = 22, w = 356, h = 84
    round(a, b, w, h, 40); const g = ctx.createLinearGradient(0, b, 0, b + h)
    g.addColorStop(0, '#fff0bd'); g.addColorStop(.45, '#e2b862'); g.addColorStop(1, '#ab7c34')
    ctx.fillStyle = g; ctx.fill(); ctx.shadowColor = 'transparent'
    round(a + 8, b + 8, w - 16, h - 16, 32); ctx.fillStyle = '#5d3a1b'; ctx.fill()
    round(a + 11, b + 11, w - 22, h - 22, 29); ctx.fillStyle = '#3f2810'; ctx.fill()
    maxW = w - 56; ink = '#ffe6a8'; shadowInk = '#7a4b16'
  } else {
    const a = 12, b = 16, w = 488, h = 96
    plank(a, b, w, h, 20); ctx.shadowColor = 'transparent'
    brassFrame(a + 4, b + 4, w - 8, h - 8, 16, 6)
    round(a + 13, b + 13, w - 26, h - 26, 12)
    ctx.strokeStyle = 'rgba(255,238,190,.45)'; ctx.lineWidth = 1.6; ctx.stroke()
    if (bubble) {
      round(a + 8, b + 6, w - 16, h - 22, 16); ctx.fillStyle = '#fff6e2'; ctx.fill()
      ctx.beginPath(); ctx.moveTo(228, b + h - 18); ctx.lineTo(249, b + h + 12); ctx.lineTo(268, b + h - 18)
      ctx.closePath(); ctx.fillStyle = '#fff6e2'; ctx.fill()
      maxW = w - 62; ink = '#5b3a1c'; shadowInk = '#fffdf4'
    } else { maxW = w - 54 }
  }

  let size = name ? 40 : prop ? 32 : 42
  const setFont = () => { ctx.font = `900 ${size}px system-ui,'Noto Sans KR','Apple SD Gothic Neo',sans-serif` }
  setFont()
  while (ctx.measureText(text).width > maxW && size > 15) { size -= 2; setFont() }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'
  const cx = W / 2, cy = bubble ? 52 : 64
  ctx.shadowColor = shadowInk; ctx.shadowBlur = name ? 2 : 3; ctx.shadowOffsetY = name ? 1.4 : 2
  ctx.fillStyle = ink
  ctx.fillText(text, cx, cy, maxW)
  ctx.restore()
  return c
}
