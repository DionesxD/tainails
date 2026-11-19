# Tainails — Plataforma de Agendamento (PWA)

Plataforma web mobile-first (PWA) para a nail designer **Tainails**, com fluxo de agendamento completo incluindo pagamento de sinal via Pix.

## 🎨 Identidade Visual

| Token | Hex | Uso |
|-------|-----|-----|
| `--brand-bg` | `#FDF0F3` | Fundo geral (blush) |
| `--brand-surface` | `#F9C5D0` | Cards, pills |
| `--brand-primary` | `#D4617A` | Botões, destaques |
| `--brand-primary-hover` | `#B84E65` | Hover |
| `--brand-accent` | `#E8A0AF` | Bordas, ícones |
| `--brand-text-on-surface` | `#3D1520` | Texto escuro |
| `--brand-muted` | `#9B6070` | Texto secundário |

**Tipografia:** Playfair Display (headings) + DM Sans (corpo)

## 🚀 Como rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
cp .env.example .env
# Editar .env conforme necessário

# 3. Criar banco de dados
npx prisma db push
npx prisma generate

# 4. Popular com dados de exemplo
npx tsx scripts/seed.ts

# 5. Rodar
npm run dev
```

Acesse: http://localhost:3000

## 🔑 Credenciais demo

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Manicure | tainails@naildesigner.app | 123456 |
| Cliente | ana@exemplo.com | 123456 |
| Cliente confiança | bruna@exemplo.com | 123456 |

## 📱 Fluxo de agendamento com sinal

```
Cliente solicita horário
  → Sistema gera pedido: status = aguardando_sinal
  → Exibe valor do sinal (50%) + chave Pix
  → Cliente envia comprovante (upload de imagem)
  → Manicure aprova o comprovante no painel
  → Status muda para: confirmado
  → Cliente recebe notificação

Se comprovante não enviado em X horas:
  → Status muda para: expirado
  → Horário é liberado
```

### Clientes de confiança
- Marcadas pela manicure no painel
- Pulam a etapa de sinal — confirmação automática

## 🏗️ Estrutura do projeto

```
src/
├── app/
│   ├── api/
│   │   ├── agendamentos/      # CRUD + aprovar/recusar/concluir/cancelar/comprovante
│   │   ├── auth/              # login, register, me, perfil, logout, senha
│   │   ├── caixa/             # relatório de transações
│   │   ├── clientes/          # lista, confiança, histórico, notas, senha
│   │   ├── configuracoes/     # config do negócio
│   │   ├── cores/             # cores de esmalte
│   │   ├── cron/              # expirar-sinais, lembrete
│   │   ├── galeria/           # modelos da galeria
│   │   ├── horarios/          # grade de horários
│   │   ├── notificacoes/      # lista e marcar como lida
│   │   ├── servicos/          # serviços e preços
│   │   └── upload/            # upload de imagens
│   ├── termos/
│   ├── privacidade/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── admin/                 # Painel da manicure
│   ├── client/                # Telas da cliente
│   ├── ui/                    # Componentes shadcn/ui
│   └── ...                    # auth-screen, app-shell, etc.
├── hooks/
├── lib/
└── prisma/
    ├── schema.prisma           # SQLite
    └── schema.postgres.prisma  # PostgreSQL (produção)
```

## 🛠️ Stack

- **Frontend:** Next.js App Router, Tailwind CSS, Zustand, TanStack Query
- **UI:** shadcn/ui + Radix UI + Framer Motion + Lucide Icons
- **Auth:** HMAC cookie stateless
- **DB:** SQLite (dev) / PostgreSQL via Neon (prod)
- **Upload:** Vercel Blob (prod) / base64 (dev)
- **Deploy:** Vercel
- **Cron:** Vercel Cron Jobs

## 📊 Modelo de dados

Tabelas principais: `Usuario`, `Servico`, `HorarioDisponivel`, `Agendamento`, `ComprovanteSinal`, `ConfiguracoesNegocio`, `TransacaoCaixa`, `HistoricoAtendimento`, `Notificacao`, `GaleriaModelo`, `CorEsmalte`, `NotaCliente`

## 🎯 Componentes reutilizáveis

- `StatusBadge` — badge colorido por estado do agendamento
- `SinalBanner` — banner de sinal pendente com chave Pix e prazo
- `AvatarBubble` — avatar com iniciais e cor automática
- `NotificationBell` — sino de notificações com badge de não lidas

## ⚙️ Configurações do negócio

A manicure pode configurar no painel:
- Exigir sinal (on/off)
- Percentual do sinal (10-100%)
- Prazo para envio do comprovante (2h, 4h, 8h, 24h)
- Chave Pix
- Política de cancelamento (2h, 4h, 8h, 24h)

## 📝 Notas técnicas

- `queryClient.clear()` antes de `setUser()` no login/registro para evitar cache de sessão anterior
- Não fazer fetch redundante de `/api/auth/me` no onSuccess do PATCH de perfil
- URLs de foto de perfil usam `?t=Date.now()` para quebrar cache do browser
- Cron de expiração roda a cada 30min (configurado no vercel.json)
