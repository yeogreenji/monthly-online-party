export function randomCode(length = 4, alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'): string {
  let code = ''
  for (let i = 0; i < length; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

export function couponCode(label: string): string {
  return `MS-${label}-${randomCode(4)}`
}

export function inquiryId(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `MS-${y}${m}${d}-${randomCode(4)}`
}
