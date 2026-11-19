import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { TIPO_TRANSACAO, FORMA_PAGAMENTO, CATEGORIA_GASTO } from '@/lib/constants'
import { hojeStr } from '@/lib/format'

const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/

// Lançamento manual no caixa: ganho extra (cliente fez 2 serviços, venda de
// produto etc.) ou gasto/retirada (equipamento, locomoção, aluguel...).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  let body: {
    tipo?: unknown
    valor?: unknown
    formaPagamento?: unknown
    data?: unknown
    categoria?: unknown
    observacao?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const tipo = body.tipo
  if (typeof tipo !== 'string' || !(tipo in TIPO_TRANSACAO)) {
    return NextResponse.json({ error: 'tipo deve ser "ganho" ou "gasto"' }, { status: 400 })
  }

  const valor = body.valor
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
    return NextResponse.json({ error: 'valor deve ser um número > 0' }, { status: 400 })
  }

  const formaPagamento = body.formaPagamento
  if (typeof formaPagamento !== 'string' || !(formaPagamento in FORMA_PAGAMENTO)) {
    return NextResponse.json({ error: 'Forma de pagamento inválida' }, { status: 400 })
  }

  const data = typeof body.data === 'string' && REGEX_DATA.test(body.data) ? body.data : hojeStr()

  const categoria =
    tipo === 'gasto' && typeof body.categoria === 'string' && body.categoria in CATEGORIA_GASTO
      ? body.categoria
      : null

  const observacao =
    typeof body.observacao === 'string' && body.observacao.trim() ? body.observacao.trim() : null

  try {
    const transacao = await db.transacaoCaixa.create({
      data: {
        manicureId: user.id,
        valor,
        tipo,
        categoria,
        formaPagamento,
        data,
        observacao,
      },
    })
    return NextResponse.json({ transacao })
  } catch (e) {
    console.error('Erro ao lançar transação manual:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
