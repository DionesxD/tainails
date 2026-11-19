import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, getConfiguracoes } from '@/lib/auth'

// Campos relevantes para o fluxo de agendamento do cliente
const CAMPOS_PUBLICOS = {
  exigeSinal: true,
  percentualSinal: true,
  prazoEnvioSinalHoras: true,
  chavePix: true,
  politicaCancelamentoHoras: true,
} as const

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    if (user.tipo === 'manicure') {
      // Manicure vê a config completa dela
      const config = await getConfiguracoes(user.id)
      return NextResponse.json({ configuracoes: config })
    }

    // Cliente: vê a config DA MANICURE (nunca cria config própria).
    // Aceita ?manicureId= para plataformas multi-manicure; sem parâmetro,
    // usa a primeira manicure ativa (plataforma de manicure única).
    const { searchParams } = new URL(req.url)
    let manicureId = searchParams.get('manicureId')

    if (!manicureId) {
      const manicure = await db.usuario.findFirst({
        where: { tipo: 'manicure', ativo: true },
        select: { id: true },
      })
      if (!manicure) {
        return NextResponse.json({ error: 'Nenhuma manicure disponível' }, { status: 404 })
      }
      manicureId = manicure.id
    } else {
      const existe = await db.usuario.findFirst({
        where: { id: manicureId, tipo: 'manicure', ativo: true },
        select: { id: true },
      })
      if (!existe) {
        return NextResponse.json({ error: 'Manicure não encontrada' }, { status: 404 })
      }
    }

    const config = await db.configuracoesNegocio.findUnique({
      where: { manicureId },
      select: CAMPOS_PUBLICOS,
    })
    // Sem criar registro: cliente só precisa dos defaults se a manicure nunca configurou
    return NextResponse.json({
      configuracoes: config ?? {
        exigeSinal: true,
        percentualSinal: 50,
        prazoEnvioSinalHoras: 4,
        chavePix: null,
        politicaCancelamentoHoras: 4,
      },
    })
  } catch (e) {
    console.error('Erro ao buscar configurações:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  try {
    if (body.exigeSinal !== undefined && typeof body.exigeSinal !== 'boolean') {
      return NextResponse.json({ error: 'exigeSinal deve ser booleano' }, { status: 400 })
    }
    if (
      body.percentualSinal !== undefined &&
      (typeof body.percentualSinal !== 'number' || body.percentualSinal < 0 || body.percentualSinal > 100)
    ) {
      return NextResponse.json({ error: 'percentualSinal deve estar entre 0 e 100' }, { status: 400 })
    }
    if (
      body.prazoEnvioSinalHoras !== undefined &&
      (typeof body.prazoEnvioSinalHoras !== 'number' || !Number.isInteger(body.prazoEnvioSinalHoras) || body.prazoEnvioSinalHoras < 1)
    ) {
      return NextResponse.json({ error: 'prazoEnvioSinalHoras deve ser inteiro ≥ 1' }, { status: 400 })
    }
    if (
      body.politicaCancelamentoHoras !== undefined &&
      (typeof body.politicaCancelamentoHoras !== 'number' || !Number.isInteger(body.politicaCancelamentoHoras) || body.politicaCancelamentoHoras < 0)
    ) {
      return NextResponse.json({ error: 'politicaCancelamentoHoras deve ser inteiro ≥ 0' }, { status: 400 })
    }
    if (body.chavePix !== undefined && body.chavePix !== null && typeof body.chavePix !== 'string') {
      return NextResponse.json({ error: 'chavePix inválida' }, { status: 400 })
    }

    const config = await getConfiguracoes(user.id)

    const atualizado = await db.configuracoesNegocio.update({
      where: { id: config.id },
      data: {
        ...(body.exigeSinal !== undefined && { exigeSinal: body.exigeSinal }),
        ...(body.percentualSinal !== undefined && { percentualSinal: body.percentualSinal }),
        ...(body.prazoEnvioSinalHoras !== undefined && { prazoEnvioSinalHoras: body.prazoEnvioSinalHoras }),
        ...(body.chavePix !== undefined && { chavePix: body.chavePix }),
        ...(body.politicaCancelamentoHoras !== undefined && { politicaCancelamentoHoras: body.politicaCancelamentoHoras }),
      },
    })

    return NextResponse.json({ configuracoes: atualizado })
  } catch (e) {
    console.error('Erro ao salvar configurações:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
