Guia rápido: aplicar schema e configurar variáveis de ambiente

1) Aplicar o schema e seeds no Supabase
- Abra o projeto no dashboard do Supabase → SQL Editor → cole o conteúdo de `supabase/schema_and_seeds.sql` e execute.
- Ou via CLI/psql:

```bash
psql "<SUPABASE_DB_CONNECTION_STRING>" -f supabase/schema_and_seeds.sql
```

2) Variáveis de ambiente necessárias
- Para o cliente Vite (frontend) use as variáveis com prefixo `VITE_`:
  - `VITE_SUPABASE_URL` — URL do seu projeto Supabase (ex.: https://xyz.supabase.co)
  - `VITE_SUPABASE_ANON_KEY` — Chave anônima para usar no frontend
- Para funções servidor/rotas seguras (server-side) use a `SUPABASE_SERVICE_ROLE_KEY` (NUNCA a exponha no cliente).

3) Configurar na Vercel
- No painel do projeto Vercel → Settings → Environment Variables:
  - Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para os ambientes `Preview` e `Production`.
  - Adicione `SUPABASE_SERVICE_ROLE_KEY` somente como "Secret" (server) — marque para Production/Preview conforme necessidade.
- Deploy: Vercel irá injetar essas variáveis em tempo de build/runtime. Em Vite, as variáveis `VITE_` estarão disponíveis no cliente via `import.meta.env.VITE_SUPABASE_URL`.

4) Rodando localmente
- Copie `.env.example` para `.env.local` ou `.env` na raiz do projeto e preencha os valores.
- Inicie o dev server:

```bash
npm install
npm run dev
```

5) Segurança e boas práticas
- Nunca commite chaves reais ao repositório. Use `.gitignore` para `.env`.
- Use `SUPABASE_SERVICE_ROLE_KEY` apenas em servidores/edge functions; para ações críticas de DB use rotas server-side.
- Considere configurar RLS (Row Level Security) e policies no Supabase para proteger dados. Posso gerar políticas básicas se desejar.
