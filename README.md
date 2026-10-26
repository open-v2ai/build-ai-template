# Build AI Template — Supabase branch

This branch preserves the Next.js/Supabase migration. The original FastAPI + web layout remains on `main` and `test`; its deployment files are historical and are not the entry point for this branch.

## Local development

Use Node.js 22 and pnpm 10. From the repository root:

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
# Fill the public Supabase URL/anon key and the server-only provider settings.
pnpm dev
```

Apply the SQL files documented in `supabase/migrations/README.md` to a separate Supabase project. The migration files include dependencies on Supabase Auth and are not plain PostgreSQL bootstrap scripts. Do not apply them to an existing production database without a separate review.

The anon key is public by design. `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` are server-only: keep them in ignored environment files or deployment secrets. The privileged Supabase client is exported only from `lib/supabase/admin.ts`.

## Checks and build

```bash
pnpm typecheck
pnpm lint
pnpm build
```

The root Dockerfile builds this branch. Pass the public Supabase settings as build arguments and inject private settings at runtime. The root `.dockerignore` excludes real environment files, dependency caches and runtime data.

The existing password-auth and registration documents describe the migration work. Database policies and external provider integration require acceptance against a separate Supabase test project before deployment.
