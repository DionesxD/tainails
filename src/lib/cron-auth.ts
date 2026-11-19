import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Comparação timing-safe entre dois segredos (tamanhos diferentes → false imediato)
function secretIgual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

export function validateCronSecret(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
    }
    return null
  }

  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ') && secretIgual(authHeader.slice(7), secret)) return null

  const customHeader = req.headers.get('x-cron-secret')
  if (customHeader && secretIgual(customHeader, secret)) return null

  if (process.env.NODE_ENV !== 'production') {
    const url = new URL(req.url)
    const qSecret = url.searchParams.get('secret')
    if (qSecret && secretIgual(qSecret, secret)) return null
  }

  return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
}
