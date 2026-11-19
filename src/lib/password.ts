import crypto from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(crypto.scrypt)

export async function hashPassword(senha: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = (await scryptAsync(senha, salt, 64)) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

export async function verifyPassword(senha: string, hashStored: string): Promise<boolean> {
  try {
    const [salt, hash] = hashStored.split(':')
    if (!salt || !hash) return false
    const derivedKey = (await scryptAsync(senha, salt, 64)) as Buffer
    const expectedBuffer = Buffer.from(hash, 'hex')
    if (derivedKey.length !== expectedBuffer.length) return false
    return crypto.timingSafeEqual(derivedKey, expectedBuffer)
  } catch {
    return false
  }
}
