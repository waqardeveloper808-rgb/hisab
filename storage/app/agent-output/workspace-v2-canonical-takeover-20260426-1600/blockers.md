# Blockers

1. **`npm run build` / TypeScript:** Fails at `app/api/workspace/[...slug]/route.ts:273` — `CompanyAssetLike` shape mismatch. This file was **not** edited in the canonical workspace takeover. CI/production builds remain blocked until that type issue is fixed separately.

2. **Legacy-only user modules:** Routes such as `/workspace/user/customers` still use old components. They render inside V2 chrome but are **not** listed on the V2 sidebar (`navGroups`); reachability is via bookmarks, deep links, or `data/role-workspace` entries when legacy shell is used elsewhere.

3. **Admin / assistant / agent:** No `app/workspace-v2` parity for these segments; they remain on **legacy** `WorkspaceShell` by design in this pass.
