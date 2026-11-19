const PUBLIC_BUCKET = 'tainails-public'
const PROOF_BUCKET = 'tainails-proofs'

function storageConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '')
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Supabase Storage não está configurado')
  return { url, serviceKey }
}

function encodeStoragePath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/')
}

export async function uploadSupabaseImage({
  isPrivate,
  path,
  bytes,
  contentType,
}: {
  isPrivate: boolean
  path: string
  bytes: Buffer
  contentType: string
}) {
  const { url, serviceKey } = storageConfig()
  const bucket = isPrivate ? PROOF_BUCKET : PUBLIC_BUCKET
  const response = await fetch(`${url}/storage/v1/object/${bucket}/${encodeStoragePath(path)}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': contentType,
      'x-upsert': 'false',
    },
    body: new Uint8Array(bytes),
    cache: 'no-store',
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    console.error('Falha ao enviar imagem ao Supabase Storage:', response.status, detail.slice(0, 300))
    throw new Error('Não foi possível salvar a imagem no armazenamento')
  }

  if (isPrivate) {
    return {
      path: `supabase-proof:${path}`,
      url: await createProofSignedUrl(path),
    }
  }

  return {
    path: `${url}/storage/v1/object/public/${PUBLIC_BUCKET}/${encodeStoragePath(path)}`,
    url: `${url}/storage/v1/object/public/${PUBLIC_BUCKET}/${encodeStoragePath(path)}`,
  }
}

export async function createProofSignedUrl(path: string) {
  const { url, serviceKey } = storageConfig()
  const response = await fetch(`${url}/storage/v1/object/sign/${PROOF_BUCKET}/${encodeStoragePath(path)}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expiresIn: 60 * 60 }),
    cache: 'no-store',
  })

  if (!response.ok) throw new Error('Não foi possível abrir o comprovante')
  const data = await response.json() as { signedURL?: string }
  if (!data.signedURL) throw new Error('Supabase não retornou o link do comprovante')
  if (/^https?:\/\//i.test(data.signedURL)) return data.signedURL
  if (data.signedURL.startsWith('/storage/v1/')) return `${url}${data.signedURL}`
  return `${url}/storage/v1${data.signedURL.startsWith('/') ? data.signedURL : `/${data.signedURL}`}`
}

export async function resolveProofUrl(reference: string) {
  if (reference.startsWith('supabase-proof:')) {
    return createProofSignedUrl(reference.slice('supabase-proof:'.length))
  }
  // Compatibilidade com comprovantes antigos do ambiente local.
  return reference.startsWith('/uploads/') ? reference : null
}

export const supabaseProofReferencePrefix = 'supabase-proof:'
