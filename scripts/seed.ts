import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'

async function main() {
  console.log('🌱 Seeding Tainails database...')

  // Cria manicure
  const manicure = await db.usuario.upsert({
    where: { email: 'tainails@naildesigner.app' },
    update: {},
    create: {
      nome: 'Tainails',
      email: 'tainails@naildesigner.app',
      telefone: '(55) 21 959416542',
      senhaHash: await hashPassword('123456'),
      tipo: 'manicure',
    },
  })

  // Cria cliente demo
  const cliente = await db.usuario.upsert({
    where: { email: 'ana@exemplo.com' },
    update: {},
    create: {
      nome: 'Ana Lima',
      email: 'ana@exemplo.com',
      telefone: '(11) 99999-9999',
      senhaHash: await hashPassword('123456'),
      tipo: 'cliente',
    },
  })

  // Cliente de confiança
  const clienteConfianca = await db.usuario.upsert({
    where: { email: 'bruna@exemplo.com' },
    update: {},
    create: {
      nome: 'Bruna Costa',
      email: 'bruna@exemplo.com',
      telefone: '(11) 98888-8888',
      senhaHash: await hashPassword('123456'),
      tipo: 'cliente',
      eClienteConfianca: true,
    },
  })

  // Configurações do negócio
  await db.configuracoesNegocio.upsert({
    where: { manicureId: manicure.id },
    update: {},
    create: {
      manicureId: manicure.id,
      exigeSinal: true,
      percentualSinal: 50.0,
      prazoEnvioSinalHoras: 4,
      chavePix: '(55) 21 959416542',
      politicaCancelamentoHoras: 4,
    },
  })

  // Serviços
  const servicos = [
    { nome: 'Esmaltação em Gel', descricao: 'Esmaltação duradoura em gel', preco: 80, duracaoMinutos: 90 },
    { nome: 'Alongamento em Gel', descricao: 'Alongamento completo com gel', preco: 150, duracaoMinutos: 150 },
    { nome: 'Manicure Simples', descricao: 'Manicure tradicional', preco: 40, duracaoMinutos: 45 },
    { nome: 'Francesinha', descricao: 'Francesinha clássica', preco: 100, duracaoMinutos: 120 },
  ]
  for (const s of servicos) {
    await db.servico.create({
      data: { ...s, manicureId: manicure.id },
    })
  }

  // Cores — alinhadas à paleta Tainails + cores populares
  const cores = [
    { nome: 'Dusty Rose', hex: '#F7A6B7', categoria: 'rosa' },
    { nome: 'Light Pink', hex: '#FAD1DA', categoria: 'rosa' },
    { nome: 'Blush', hex: '#FFF1F4', categoria: 'rosa' },
    { nome: 'Warm Beige', hex: '#F2D9B8', categoria: 'nude' },
    { nome: 'Nude', hex: '#E8C49A', categoria: 'nude' },
    { nome: 'Bordô', hex: '#722F37', categoria: 'vermelho' },
    { nome: 'Vinho', hex: '#5A1A2A', categoria: 'vermelho' },
    { nome: 'Preto', hex: '#333333', categoria: 'escuro' },
    { nome: 'Branco', hex: '#FFFFFF', categoria: 'claro' },
    { nome: 'Azul Pavão', hex: '#1A5276', categoria: 'azul' },
    { nome: 'Verde Esmeralda', hex: '#0E6655', categoria: 'verde' },
    { nome: 'Roxo Real', hex: '#6C3483', categoria: 'roxo' },
    { nome: 'Dourado', hex: '#D4AC0D', categoria: 'metalico' },
    { nome: 'Coral', hex: '#FF6F61', categoria: 'laranja' },
  ]
  for (const c of cores) {
    await db.corEsmalte.create({ data: c })
  }

  // Horários disponíveis (próximos 7 dias)
  const hoje = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  for (let i = 0; i < 7; i++) {
    const d = new Date(hoje)
    d.setDate(d.getDate() + i)
    const data = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    const slots = [
      { data, horaInicio: '09:00', horaFim: '10:30' },
      { data, horaInicio: '10:30', horaFim: '12:00' },
      { data, horaInicio: '14:00', horaFim: '15:30' },
      { data, horaInicio: '15:30', horaFim: '17:00' },
      { data, horaInicio: '17:00', horaFim: '18:30' },
      { data, horaInicio: '19:00', horaFim: '20:30' },
    ]

    for (const slot of slots) {
      await db.horarioDisponivel.upsert({
        where: {
          manicureId_data_horaInicio: {
            manicureId: manicure.id,
            data: slot.data,
            horaInicio: slot.horaInicio,
          },
        },
        update: {},
        create: { manicureId: manicure.id, ...slot },
      })
    }
  }

  // Cria um agendamento de demonstração para que a cliente apareça
  // na carteira da manicure desde o primeiro seed.
  await seedAgendamentos(manicure.id, cliente.id)

  console.log('✅ Seed completo!')
  console.log('   Manicure:', manicure.email)
  console.log('   Cliente:', cliente.email)
  console.log('   Cliente confiança:', clienteConfianca.email)
  console.log('   Senha: 123456')
}


async function seedAgendamentos(manicureId: string, clienteId: string) {
  const existente = await db.agendamento.findFirst({
    where: { clienteId, manicureId },
    select: { id: true },
  })
  if (existente) return

  const servico = await db.servico.findFirst({ where: { manicureId } })
  if (!servico) return

  const hoje = new Date()
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)
  const pad = (n: number) => n.toString().padStart(2, '0')
  const data = `${amanha.getFullYear()}-${pad(amanha.getMonth() + 1)}-${pad(amanha.getDate())}`

  const horario = await db.horarioDisponivel.findFirst({
    where: { manicureId, data, status: 'livre' },
  })
  if (!horario) return

  await db.$transaction([
    db.agendamento.create({
      data: {
        clienteId,
        manicureId,
        horarioId: horario.id,
        servicoId: servico.id,
        status: 'confirmado',
      },
    }),
    db.horarioDisponivel.update({
      where: { id: horario.id },
      data: { status: 'reservado' },
    }),
  ])
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
