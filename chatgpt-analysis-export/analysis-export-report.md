# Hisabix ChatGPT analysis export report

**Purpose:** Filtered source archive for architecture / logic review — not for deployment.  
**Staging root used:** `C:\hisab\chatgpt-analysis-export\staging\`  
**Final ZIP:** `C:\hisab\chatgpt-analysis-export\hisabix-analysis-20260429_164652.zip`

---

## ZIP metrics

| Metric | Value |
|--------|-------|
| Size | 2,291,439 bytes (~**2.18 MiB**, below 25–50 MB target) |
| Files staged (disk) | **839** |
| ZIP member entries | **861** (includes empty directory placeholder entries from `Compress-Archive`) |

Original project files were not modified; only the staging tree and this report were written under `chatgpt-analysis-export\`.

---

## Included folders / areas

| Area | Notes |
|------|--------|
| `app/**` | Next.js app router, including `app/api/**` |
| `components/**` | Full tree (includes workspace UI under `components/workspace/**`) |
| `lib/**` | Full tree: `document-engine`, `template-engine`, `lib/pdf/simple-pdf.ts`, workspace/session helpers (`lib/workspace-*`, `server-access.ts`-style APIs per existing layout) |
| `backend/**` | Laravel codebase: `app`, `bootstrap` (sans `bootstrap/cache`), `config`, `database` (migrations/seeders/factories), `routes`, `resources`, `tests`, root `composer.json`, `composer.lock`, `artisan`, `phpunit.xml`, `vite.config.js`, loose PHP tooling scripts |
| `types/**` | Shared TypeScript typings (minimal size; aids reading imports) |
| `data/` | **`data/system-map/**` only**, plus **`data/document-canonical-contract.json`** (small canonical contract retained) |
| `docs/**` | Governance / architecture Markdown (no `logs/` subtree) |

## Root-level files staged

| File |
|------|
| `README.md`, `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts` |
| `vitest.config.ts`, `vitest.setup.ts`, `middleware.ts` |

`next-env.d.ts` was intentionally **omitted** (references `./.next/types`, adds noise).

---

## Excluded (not copied into staging)

| Bucket | Patterns / paths |
|--------|------------------|
| Dependencies | `node_modules/`, `vendor/` |
| Build / cache | `.next/`, `dist/`, `build/`, `backend/bootstrap/cache/` |
| Laravel runtime | `backend/storage/` (entire subtree) |
| Root / project artifacts | Repo `artifacts/`, `logs/`, `exports/`, `tmp/`, etc. — **not** included |
| Secrets | `.env`, `.env.local`, `backend/.env` (robocopy `/XF` + verification) |
| Heavy / binary policy | No `*.pdf`, no nested `*.zip` in final archive; post-copy removal of `backend/artifacts/` (contained a zip) |
| Data noise | `data/master-design/**`, `data/workspace/**`, `data/audit-runtime/**`, `data/standards/**`, `data/preview-*.json` stores, and other root `data/*.ts` / large JSON — **not** copied (see *Post-staging cleanup*) |

---

## Post-staging cleanup (signal over noise)

1. **`backend/artifacts/`** — removed (contained a nested `.zip`; violates zero-tolerance on nested archives).  
2. **`data/preview-*.json`** — if present under staging `data/`, removed (large preview fixture stores; not required for system-map / contract analysis).  
3. **Kept small contract:** `data/document-canonical-contract.json` + `data/system-map/actual-map.ts`.  
4. **`next-env.d.ts`** — removed from staging (points at generated `.next` types).

---

## Skipped large files

- Policy: exclude files **> 5 MiB** unless critical — **none retained** above that threshold after cleanup.  
- Notable **excluded preview data** from repo root (not staged): `data/preview-asset-store.json` (~3.6 MiB — under 5 MiB absolute cap but omitted as fixture noise per “system-map + small JSON only”).

---

## Decisions & uncertainties

| Topic | Decision |
|-------|----------|
| Top-level **`routes/`** | No dedicated Next `routes/` dir at repo root; Laravel routes live under **`backend/routes/**`** (included). |
| **`lib/zatca/**`** | No standalone folder in this repo — ZATCA-related code appears under **`lib/document-engine`** (and related helpers); ZIP reflects actual tree. |
| **`types/`** | Included despite not being in the short bullet list — total ~9 KiB and improves TypeScript readability. |
| **`middleware.ts`** | Included — needed to reason about Next middleware behavior. |
| **`vitest.config.ts`** | Included (was missing from early staging passes; aligned with documented config intent). |
| **Backend loose PHP scripts** (`check_data.php`, `*_proof_seed.php`, etc.) | Left in `backend/` root as copied — they exist in-repo; treat as ancillary tooling unless you want a stricter Laravel-only subtree in a future export. |

---

## Verification checklist

| Check | Result |
|-------|--------|
| ZIP size modest | PASS (~2.2 MiB) |
| No `node_modules` or `vendor` under staging | PASS |
| No `artifacts/` in final staged tree | PASS |
| No `*.pdf`, no nested `*.zip` | PASS |
| `lib/document-engine/**` present | PASS |
| `app/api/**` present | PASS |
| Laravel `backend/routes/**` present | PASS |
| `database/migrations/**` present | PASS |
| No `.env` secrets files in ZIP | PASS (staging scan + robocopy excludes) |

---

## Structure preview (staging, depth 2)

Top level:

```
app/
backend/
components/
data/
docs/
lib/
middleware.ts      (copied separately)
next.config.ts
package.json
package-lock.json
README.md
tsconfig.json
types/
vitest.config.ts
vitest.setup.ts
```

Second-level (high level):

```
app/api/
app/workspace/
app/(other route groups as in repo)/

backend/app/
backend/bootstrap/
backend/config/
backend/database/
backend/resources/
backend/routes/
backend/tests/

components/(feature folders…)/
components/workspace/

data/system-map/
data/document-canonical-contract.json

docs/governance/

lib/(engines, audits, workspace, document-engine, …)/
```
