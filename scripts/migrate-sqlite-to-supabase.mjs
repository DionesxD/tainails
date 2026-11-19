import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvConfig } from '@next/env'
import { PrismaClient } from '@prisma/client'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
loadEnvConfig(root)

const databaseUrl = process.env.DATABASE_URL || ''
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '')
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!/^postgres(ql)?:\/\//i.test(databaseUrl) || !supabaseUrl || !serviceKey) {
  throw new Error('Configure DATABASE_URL, SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.')
}

const sourceDb = path.join(root, 'prisma', 'dev.db')
const pythonCode = String.raw`
import json, sqlite3, sys
db = sqlite3.connect(sys.argv[1])
db.row_factory = sqlite3.Row
tables = [
  'CorEsmalte', 'Usuario', 'NotaCliente', 'Servico', 'HorarioDisponivel',
  'GaleriaModelo', 'Agendamento', 'ComprovanteSinal',
  'ConfiguracoesNegocio', 'HistoricoAtendimento', 'TransacaoCaixa', 'Notificacao'
]
data = {table: [dict(row) for row in db.execute('SELECT * FROM "' + table + '"')] for table in tables}
print(json.dumps(data, ensure_ascii=False, separators=(',', ':')))
`

const python = process.platform === 'win32' ? 'py' : 'python3'
const pythonArgs = process.platform === 'win32'
  ? ['-3', '-c', pythonCode, sourceDb]
  : ['-c', pythonCode, sourceDb]
const exported = spawnSync(python, pythonArgs, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
if (exported.status !== 0 || !exported.stdout) {
  throw new Error('Não foi possível ler o banco SQLite local. Verifique se Python está instalado e se prisma/dev.db existe.')
}

const rows = JSON.parse(exported.stdout)
const appointmentById = new Map(rows.Agendamento.map((appointment) => [appointment.id, appointment]))
const migratedImages = []

function localUploadFilename(reference) {
  if (typeof reference !== 'string' || !reference.startsWith('/uploads/')) return null
  const filename = path.basename(decodeURIComponent(reference.slice('/uploads/'.length)))
  if (!filename || filename === '.' || filename === '..') throw new Error('Caminho de upload local inválido no banco.')
  return filename
}

async function uploadLegacyImage(reference, ownerId, isPrivate) {
  const filename = localUploadFilename(reference)
  if (!filename) return reference

  const bytes = await readFile(path.join(root, 'public', 'uploads', filename))
  const extension = path.extname(filename).toLowerCase()
  const digest = createHash('sha256').update(bytes).digest('hex').slice(0, 24)
  const objectPath = `${ownerId}/${digest}${extension}`
  const bucket = isPrivate ? 'tainails-proofs' : 'tainails-public'
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : `image/${extension.slice(1)}`,
      'x-upsert': 'true',
    },
    body: bytes,
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Falha ao copiar uma foto local para o bucket do Supabase (${response.status}).`)

  if (isPrivate) {
    const signed = await fetch(`${supabaseUrl}/storage/v1/object/sign/${bucket}/${objectPath.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn: 3600 }),
      cache: 'no-store',
    })
    if (!signed.ok) throw new Error('A foto privada foi copiada, mas não foi possível criar o link de verificação.')
    return `supabase-proof:${objectPath}`
  }

  migratedImages.push({ bucket, path: objectPath })
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath.split('/').map(encodeURIComponent).join('/')}`
}

for (const user of rows.Usuario) {
  if (user.fotoUrl?.startsWith('/uploads/')) {
    user.fotoUrl = await uploadLegacyImage(user.fotoUrl, user.id, false)
  }
}
for (const model of rows.GaleriaModelo) {
  if (model.urlImagem.startsWith('/uploads/')) {
    model.urlImagem = await uploadLegacyImage(model.urlImagem, model.manicureId, false)
  }
}
for (const receipt of rows.ComprovanteSinal) {
  if (receipt.urlComprovante.startsWith('/uploads/')) {
    const appointment = appointmentById.get(receipt.agendamentoId)
    if (!appointment) throw new Error('Comprovante local sem agendamento relacionado.')
    receipt.urlComprovante = await uploadLegacyImage(receipt.urlComprovante, appointment.clienteId, true)
  }
}

const dateFields = new Set(['criadoEm', 'atualizadoEm', 'sinalExpiraEm', 'enviadoEm', 'avaliadoEm'])
for (const tableRows of Object.values(rows)) {
  for (const row of tableRows) {
    for (const [key, value] of Object.entries(row)) {
      if (dateFields.has(key) && value !== null && value !== undefined) row[key] = new Date(value)
    }
  }
}
for (const config of rows.ConfiguracoesNegocio) {
  if (typeof config.regrasAdicionais === 'string' && config.regrasAdicionais) {
    config.regrasAdicionais = JSON.parse(config.regrasAdicionais)
  }
}

const tables = [
  ['corEsmalte', rows.CorEsmalte],
  ['usuario', rows.Usuario],
  ['notaCliente', rows.NotaCliente],
  ['servico', rows.Servico],
  ['horarioDisponivel', rows.HorarioDisponivel],
  ['galeriaModelo', rows.GaleriaModelo],
  ['agendamento', rows.Agendamento],
  ['comprovanteSinal', rows.ComprovanteSinal],
  ['configuracoesNegocio', rows.ConfiguracoesNegocio],
  ['historicoAtendimento', rows.HistoricoAtendimento],
  ['transacaoCaixa', rows.TransacaoCaixa],
  ['notificacao', rows.Notificacao],
]

const db = new PrismaClient()
try {
  for (const [delegate] of tables) {
    if (await db[delegate].count()) {
      throw new Error('O banco Supabase já contém registros. A migração só roda em um banco vazio e não apaga dados.')
    }
  }

  await db.$transaction(async (tx) => {
    for (const [delegate, data] of tables) {
      if (data.length) await tx[delegate].createMany({ data })
    }
  })

  const migrated = Object.fromEntries(tables.map(([delegate, data]) => [delegate, data.length]))
  console.log(`Migração concluída: ${JSON.stringify(migrated)}. Fotos copiadas: ${migratedImages.length}.`)
} finally {
  await db.$disconnect()
}
