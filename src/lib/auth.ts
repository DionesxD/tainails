import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import type { Prisma } from '@prisma/client'
export { hashPassword, verifyPassword } from '@/lib/password'

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('Configuração insegura: a variável SESSION_SECRET é obrigatória em todos os ambientes.')
  }
  return secret
}

export const SESSION_COOKIE = 'tn_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 dias

function sign(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', getSecret()).update(data).digest('base64url')
  return `${data}.${sig}`
}

function verify(token: string): { uid: string; tipo: string; iat: number } | null {
  try {
    const [data, sig] = token.split('.')
    if (!data || !sig) return null
    const expected = crypto.createHmac('sha256', getSecret()).update(data).digest('base64url')
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString())
    if (!payload || typeof payload.iat !== 'number') return null
    // Validação estrita de expiração
    if (Date.now() - payload.iat > SESSION_MAX_AGE * 1000) return null
    return payload
  } catch {
    return null
  }
}

export async function createSession(userId: string, tipo: string) {
  const token = sign({ uid: userId, tipo, iat: Date.now() })
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

export async function destroySession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<{ uid: string; tipo: string } | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verify(token)
}

export async function getCurrentUser() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = verify(token)
  if (!session) {
    store.delete(SESSION_COOKIE)
    return null
  }
  try {
    const user = await db.usuario.findUnique({
      where: { id: session.uid },
      select: {
        id: true,
        nome: true,
        telefone: true,
        email: true,
        tipo: true,
        fotoUrl: true,
        eClienteConfianca: true,
        ativo: true,
      },
    })
    if (!user || !user.ativo) {
      store.delete(SESSION_COOKIE)
      return null
    }
    return { ...user, tipo: user.tipo as 'cliente' | 'manicure' }
  } catch (e) {
    console.error('getCurrentUser DB error:', e)
    return null
  }
}

export async function requireUser(tipo?: 'cliente' | 'manicure') {
  const user = await getCurrentUser()
  if (!user) return { user: null, error: Response.json({ error: 'Não autenticado' }, { status: 401 }) }
  if (tipo && user.tipo !== tipo) {
    return { user: null, error: Response.json({ error: 'Acesso negado' }, { status: 403 }) }
  }
  return { user, error: null }
}

// Helper para obter configurações do negócio da manicure.
// Aceita um client de transação opcional para uso dentro de $transaction.
export async function getConfiguracoes(
  manicureId: string,
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? db
  let config = await client.configuracoesNegocio.findUnique({
    where: { manicureId },
  })
  if (!config) {
    // Cria config padrão se não existir
    config = await client.configuracoesNegocio.create({
      data: { manicureId },
    })
  }
  return config
}
