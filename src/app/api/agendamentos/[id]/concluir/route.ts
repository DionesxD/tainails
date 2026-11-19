import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { STATUS_AGENDAMENTO, FORMA_PAGAMENTO } from '@/lib/constants'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params

  let body: { valorPago?: unknown; formaPagamento?: unknown; corUsada?: unknown; observacoes?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  try {
    const agendamento = await db.agendamento.findUnique({
      where: { id },
      include: { horario: true, cliente: true, servico: true },
    })
    if (!agendamento) return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })

    if (agendamento.manicureId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Só agendamento confirmado (ou aguardando sinal pago na hora) pode ser concluído
    if (
      agendamento.status !== STATUS_AGENDAMENTO.confirmado &&
      agendamento.status !== STATUS_AGENDAMENTO.aguardando_sinal
    ) {
      return NextResponse.json(
        { error: `Não é possível concluir um agendamento com status "${agendamento.status}"` },
        { status: 400 }
      )
    }

    // Validações do pagamento
    if (body.valorPago !== undefined && body.valorPago !== null) {
      if (typeof body.valorPago !== 'number' || !Number.isFinite(body.valorPago) || body.valorPago < 0) {
        return NextResponse.json({ error: 'valorPago deve ser um número ≥ 0' }, { status: 400 })
      }
    }
    const formaPagamento = body.formaPagamento
    if (typeof formaPagamento !== 'string' || !(formaPagamento in FORMA_PAGAMENTO)) {
      return NextResponse.json({ error: 'Forma de pagamento inválida' }, { status: 400 })
    }

    const valorFinal =
      typeof body.valorPago === 'number' && body.valorPago >= 0 ? body.valorPago : agendamento.servico.preco
    const corUsada = typeof body.corUsada === 'string' && body.corUsada.trim() ? body.corUsada.trim() : null
    const observacoes =
      typeof body.observacoes === 'string' && body.observacoes.trim() ? body.observacoes.trim() : null

    const atualizado = await db.$transaction(async (tx) => {
      const ag = await tx.agendamento.update({
        where: { id },
        data: { status: STATUS_AGENDAMENTO.concluido },
      })

      // Registra no histórico
      await tx.historicoAtendimento.create({
        data: {
          clienteId: agendamento.clienteId,
          manicureId: user.id,
          agendamentoId: id,
          dataAtendimento: agendamento.horario.data,
          servicoNome: agendamento.servico.nome,
          corUsada,
          valorPago: valorFinal,
          observacoes,
        },
      })

      // Registra no caixa
      await tx.transacaoCaixa.create({
        data: {
          manicureId: user.id,
          agendamentoId: id,
          valor: valorFinal,
          formaPagamento,
          data: new Date().toISOString().split('T')[0],
        },
      })

      return ag
    })

    return NextResponse.json({ agendamento: atualizado })
  } catch (e) {
    console.error('Erro ao concluir agendamento:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
