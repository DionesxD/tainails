# Supabase e Vercel

## Variáveis do servidor

Configure apenas no ambiente do servidor, sem colocar esses valores no código:

- `DATABASE_URL`: conexão PostgreSQL do Supabase. Para as funções da Vercel, use o pooler de transação na porta `6543` com `pgbouncer=true`.
- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: chave secreta de servidor do Supabase. Nunca use como variável `NEXT_PUBLIC_*`.
- `SESSION_SECRET`: segredo longo e aleatório para as sessões do Tainails.
- `CRON_SECRET`: segredo longo e aleatório compartilhado com o Supabase Vault.

## Banco e imagens

Execute `migrations/20261119000000_initial_schema.sql` uma vez no SQL Editor do Supabase. Ele cria as tabelas do app, o bucket público `tainails-public` para fotos de perfil/galeria e o bucket privado `tainails-proofs` para comprovantes.

Os comprovantes são servidos por links temporários assinados. A chave service role fica somente no servidor.

## Tarefas agendadas

O plano Hobby da Vercel não aceita a expiração de sinais a cada 30 minutos. Depois de publicar a URL estável na Vercel:

1. Salve `tainails_app_url` e `tainails_cron_secret` no Vault do Supabase. O segundo valor precisa ser exatamente o `CRON_SECRET` configurado na Vercel.
2. Execute `schedule.sql` no SQL Editor do Supabase.

Assim, o Supabase chama as rotas protegidas de expiração a cada 30 minutos e de lembrete diariamente. Não execute esse arquivo antes de configurar os dois segredos no Vault.

## Dados locais

O SQLite do projeto contém contas, serviços e fotos locais. A migração deve preservar os IDs e enviar as fotos locais ao bucket público antes de gravar as URLs novas. Não copie `prisma/dev.db` para a Vercel nem para o repositório.

Para importar os dados locais depois de criar o banco vazio e aplicar a migração:

1. Pare o servidor local e configure `DATABASE_URL` (pooler de sessão ou conexão direta), `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` em `.env.local`.
2. Gere o cliente PostgreSQL com `npm run db:generate:postgres`.
3. Execute `npm run db:import:sqlite`. O script interrompe se encontrar qualquer linha no destino.
4. Volte ao cliente local com `npm run db:generate` e deixe `DATABASE_URL` apontando para `file:./dev.db` em `.env.local`.

O script preserva IDs, copia os uploads locais para os buckets apropriados e não imprime nomes, contatos ou hashes de senha no terminal.
