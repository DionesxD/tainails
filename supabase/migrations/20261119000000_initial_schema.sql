-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "senhaHash" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'cliente',
    "fotoUrl" TEXT,
    "eClienteConfianca" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaCliente" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "manicureId" TEXT NOT NULL,
    "observacao" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotaCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servico" (
    "id" TEXT NOT NULL,
    "manicureId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DOUBLE PRECISION NOT NULL,
    "duracaoMinutos" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HorarioDisponivel" (
    "id" TEXT NOT NULL,
    "manicureId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'livre',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HorarioDisponivel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GaleriaModelo" (
    "id" TEXT NOT NULL,
    "manicureId" TEXT NOT NULL,
    "urlImagem" TEXT NOT NULL,
    "descricao" TEXT,
    "tags" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GaleriaModelo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorEsmalte" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "categoria" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CorEsmalte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "manicureId" TEXT NOT NULL,
    "horarioId" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,
    "corEsmalteId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'aguardando_sinal',
    "confirmadoAutomaticamente" BOOLEAN NOT NULL DEFAULT false,
    "motivoRecusa" TEXT,
    "observacoesCliente" TEXT,
    "valorSinal" DOUBLE PRECISION,
    "sinalExpiraEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComprovanteSinal" (
    "id" TEXT NOT NULL,
    "agendamentoId" TEXT NOT NULL,
    "urlComprovante" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "motivoRejeicao" TEXT,
    "enviadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avaliadoEm" TIMESTAMP(3),

    CONSTRAINT "ComprovanteSinal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracoesNegocio" (
    "id" TEXT NOT NULL,
    "manicureId" TEXT NOT NULL,
    "exigeSinal" BOOLEAN NOT NULL DEFAULT true,
    "percentualSinal" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "prazoEnvioSinalHoras" INTEGER NOT NULL DEFAULT 4,
    "chavePix" TEXT,
    "politicaCancelamentoHoras" INTEGER NOT NULL DEFAULT 4,
    "regrasAdicionais" JSONB,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracoesNegocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoAtendimento" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "manicureId" TEXT NOT NULL,
    "agendamentoId" TEXT,
    "dataAtendimento" TEXT NOT NULL,
    "servicoNome" TEXT NOT NULL,
    "corUsada" TEXT,
    "valorPago" DOUBLE PRECISION,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoAtendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransacaoCaixa" (
    "id" TEXT NOT NULL,
    "manicureId" TEXT NOT NULL,
    "agendamentoId" TEXT,
    "valor" DOUBLE PRECISION NOT NULL,
    "formaPagamento" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransacaoCaixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "agendamentoId" TEXT,
    "tipo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "enviadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_telefone_key" ON "Usuario"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_tipo_idx" ON "Usuario"("tipo");

-- CreateIndex
CREATE INDEX "Usuario_eClienteConfianca_idx" ON "Usuario"("eClienteConfianca");

-- CreateIndex
CREATE INDEX "NotaCliente_clienteId_idx" ON "NotaCliente"("clienteId");

-- CreateIndex
CREATE INDEX "Servico_manicureId_idx" ON "Servico"("manicureId");

-- CreateIndex
CREATE INDEX "HorarioDisponivel_manicureId_data_idx" ON "HorarioDisponivel"("manicureId", "data");

-- CreateIndex
CREATE INDEX "HorarioDisponivel_status_idx" ON "HorarioDisponivel"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HorarioDisponivel_manicureId_data_horaInicio_key" ON "HorarioDisponivel"("manicureId", "data", "horaInicio");

-- CreateIndex
CREATE INDEX "GaleriaModelo_manicureId_idx" ON "GaleriaModelo"("manicureId");

-- CreateIndex
CREATE INDEX "Agendamento_clienteId_idx" ON "Agendamento"("clienteId");

-- CreateIndex
CREATE INDEX "Agendamento_horarioId_idx" ON "Agendamento"("horarioId");

-- CreateIndex
CREATE INDEX "Agendamento_manicureId_status_idx" ON "Agendamento"("manicureId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ComprovanteSinal_agendamentoId_key" ON "ComprovanteSinal"("agendamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracoesNegocio_manicureId_key" ON "ConfiguracoesNegocio"("manicureId");

-- CreateIndex
CREATE INDEX "HistoricoAtendimento_clienteId_dataAtendimento_idx" ON "HistoricoAtendimento"("clienteId", "dataAtendimento");

-- CreateIndex
CREATE INDEX "HistoricoAtendimento_manicureId_dataAtendimento_idx" ON "HistoricoAtendimento"("manicureId", "dataAtendimento");

-- CreateIndex
CREATE INDEX "TransacaoCaixa_manicureId_data_idx" ON "TransacaoCaixa"("manicureId", "data");

-- CreateIndex
CREATE INDEX "Notificacao_usuarioId_lida_idx" ON "Notificacao"("usuarioId", "lida");

-- AddForeignKey
ALTER TABLE "NotaCliente" ADD CONSTRAINT "NotaCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaCliente" ADD CONSTRAINT "NotaCliente_manicureId_fkey" FOREIGN KEY ("manicureId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_manicureId_fkey" FOREIGN KEY ("manicureId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorarioDisponivel" ADD CONSTRAINT "HorarioDisponivel_manicureId_fkey" FOREIGN KEY ("manicureId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GaleriaModelo" ADD CONSTRAINT "GaleriaModelo_manicureId_fkey" FOREIGN KEY ("manicureId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_manicureId_fkey" FOREIGN KEY ("manicureId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "HorarioDisponivel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_corEsmalteId_fkey" FOREIGN KEY ("corEsmalteId") REFERENCES "CorEsmalte"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComprovanteSinal" ADD CONSTRAINT "ComprovanteSinal_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracoesNegocio" ADD CONSTRAINT "ConfiguracoesNegocio_manicureId_fkey" FOREIGN KEY ("manicureId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoAtendimento" ADD CONSTRAINT "HistoricoAtendimento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoAtendimento" ADD CONSTRAINT "HistoricoAtendimento_manicureId_fkey" FOREIGN KEY ("manicureId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoAtendimento" ADD CONSTRAINT "HistoricoAtendimento_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransacaoCaixa" ADD CONSTRAINT "TransacaoCaixa_manicureId_fkey" FOREIGN KEY ("manicureId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransacaoCaixa" ADD CONSTRAINT "TransacaoCaixa_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Supabase Storage: public portfolio images and private payment proofs.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('tainails-public', 'tainails-public', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('tainails-proofs', 'tainails-proofs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;


-- Tables are accessed only through the trusted Next.js server, using the database owner role.
-- RLS keeps accidental Data API exposure closed if the Data API is enabled later.
ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotaCliente" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Servico" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HorarioDisponivel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GaleriaModelo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CorEsmalte" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Agendamento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ComprovanteSinal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConfiguracoesNegocio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HistoricoAtendimento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TransacaoCaixa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notificacao" ENABLE ROW LEVEL SECURITY;
