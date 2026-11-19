import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { uploadSupabaseImage } from '@/lib/supabase-storage'

// Extensões aceitas — whitelist fechada (sem .svg/.html, que permitem XSS)
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif'])

// Valida o conteúdo real do arquivo (magic bytes), não só o Content-Type
// declarado pelo cliente (que pode ser forjado)
function detectImageType(buf: Buffer): 'jpg' | 'png' | 'webp' | 'gif' | null {
  if (buf.length < 12) return null
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return 'png'
  // GIF: GIF87a / GIF89a
  if (buf.subarray(0, 3).toString('ascii') === 'GIF') return 'gif'
  // WEBP: RIFF....WEBP
  if (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) return 'webp'
  return null
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const ct = req.headers.get('content-type') || ''
  if (!ct.includes('multipart/form-data') && !ct.includes('application/x-www-form-urlencoded')) {
    return NextResponse.json({ error: 'Envie um arquivo multipart/form-data' }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Falha ao ler o formulário' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })

  const purpose = formData.get('purpose')
  if (purpose !== 'public' && purpose !== 'proof') {
    return NextResponse.json({ error: 'Informe se a imagem é pública ou um comprovante' }, { status: 400 })
  }
  if (purpose === 'proof' && user.tipo !== 'cliente') {
    return NextResponse.json({ error: 'Somente clientes podem enviar comprovantes' }, { status: 403 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Arquivo muito grande (máx. 5MB)' }, { status: 400 })
  }

  // Extensão do nome original precisa estar na whitelist
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: 'Formato não suportado. Use JPG, PNG, WEBP ou GIF.' }, { status: 400 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())

  // Conteúdo real precisa ser uma imagem válida do tipo declarado
  const detected = detectImageType(bytes)
  if (!detected) {
    return NextResponse.json({ error: 'Arquivo não é uma imagem válida' }, { status: 400 })
  }
  // jpg/jpeg são o mesmo formato
  const tipoReal = detected === 'jpg' ? 'jpeg' : detected
  const extReal = detected === 'jpg' ? 'jpg' : detected
  if (ext !== extReal && !(ext === 'jpeg' && tipoReal === 'jpeg')) {
    return NextResponse.json({ error: 'Conteúdo não corresponde à extensão do arquivo' }, { status: 400 })
  }

  const hash = crypto.randomBytes(12).toString('hex')
  const filename = `${hash}.${extReal}`
  const storagePath = `${user.id}/${filename}`
  const contentType = `image/${tipoReal === 'jpeg' ? 'jpeg' : tipoReal}`

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const stored = await uploadSupabaseImage({
        isPrivate: purpose === 'proof',
        path: storagePath,
        bytes,
        contentType,
      })
      return NextResponse.json({ url: stored.url, path: stored.path, filename })
    } catch (error) {
      console.error('Erro no armazenamento de imagem:', error)
      return NextResponse.json({ error: 'Não foi possível salvar a imagem' }, { status: 502 })
    }
  }

  // O disco local serve apenas para desenvolvimento. A Vercel não mantém
  // arquivos escritos por uma função depois que a requisição termina.
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Configure o armazenamento do Supabase antes de enviar imagens' }, { status: 503 })
  }

  const localFilename = `${user.id}-${filename}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, localFilename), bytes)
  const localUrl = `/uploads/${localFilename}`
  return NextResponse.json({ url: localUrl, path: localUrl, filename: localFilename })
}
