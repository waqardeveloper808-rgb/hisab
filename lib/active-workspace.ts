/**
 * Single canonical workspace tenant for the product UI (user company workspace).
 * Default URL space: `/workspace/user`. See `WORKSPACE_PATH_NO_PREFIX_ROOTS` for exceptions.
 */

export const ACTIVE_WORKSPACE_SLUG = "user" as const;

export type ActiveWorkspaceSlug = typeof ACTIVE_WORKSPACE_SLUG;

/** Enforcement API — always the default workspace slug. */
export function getActiveWorkspace(): ActiveWorkspaceSlug {
  return ACTIVE_WORKSPACE_SLUG;
}

export function getActiveWorkspaceSlug(): ActiveWorkspaceSlug {
  return ACTIVE_WORKSPACE_SLUG;
}

export const CANONICAL_USER_WORKSPACE_BASE = `/workspace/${ACTIVE_WORKSPACE_SLUG}` as const;

/**
 * First URL segment after `/workspace/` that must not receive an automatic `/user/` insert.
 * Includes role areas, document shells, and legacy-only trees.
 */
export const WORKSPACE_PATH_NO_PREFIX_ROOTS = new Set<string>([
  ACTIVE_WORKSPACE_SLUG,
  "admin",
  "agent",
  "assistant",
  "agents",
  "settings",
  /** Document workspace routes (not under /user). */
  "invoices",
  "bills",
  /** Legacy-only roots (no /workspace/user/... mirror). */
  "contacts",
  "communications",
  "help",
  "sales",
  "purchases",
  /** Books + chart legacy paths under this tree. */
  "accounting",
]);

/** Only these exact paths redirect to a user-workspace page (308 / link canonicalization). */
const EXACT_LEGACY_TO_USER: Record<string, string> = {
  "/workspace/accounting": `${CANONICAL_USER_WORKSPACE_BASE}/accounting`,
  "/workspace/accounting/books": `${CANONICAL_USER_WORKSPACE_BASE}/ledger`,
  "/workspace/accounting/chart-of-accounts": `${CANONICAL_USER_WORKSPACE_BASE}/chart-of-accounts`,
  "/workspace/dashboard": `${CANONICAL_USER_WORKSPACE_BASE}/dashboard`,
  "/workspace/banking": `${CANONICAL_USER_WORKSPACE_BASE}/banking`,
  "/workspace/vat": `${CANONICAL_USER_WORKSPACE_BASE}/vat`,
  "/workspace/import": `${CANONICAL_USER_WORKSPACE_BASE}/import`,
  "/workspace/items": `${CANONICAL_USER_WORKSPACE_BASE}/items`,
  "/workspace/services": `${CANONICAL_USER_WORKSPACE_BASE}/services`,
  "/workspace/reports": `${CANONICAL_USER_WORKSPACE_BASE}/reports`,
  "/workspace/reconciliation": `${CANONICAL_USER_WORKSPACE_BASE}/reconciliation`,
};

function stripTrailingSlash(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

/** pathname includes leading slash, no query/hash */
export function canonicalizeWorkspacePathname(pathname: string): string | null {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;

  const noSlash = stripTrailingSlash(path);
  if (EXACT_LEGACY_TO_USER[noSlash]) {
    const target = EXACT_LEGACY_TO_USER[noSlash]!;
    return path.endsWith("/") && noSlash !== "/workspace" ? `${target}/` : target;
  }

  if (
    noSlash.startsWith("/workspace/reports/") &&
    !noSlash.startsWith(`${CANONICAL_USER_WORKSPACE_BASE}/reports`)
  ) {
    return `${CANONICAL_USER_WORKSPACE_BASE}/reports${noSlash.slice("/workspace/reports".length)}`;
  }

  const segs = path.split("/").filter(Boolean);
  if (segs.length < 2 || segs[0] !== "workspace") return null;

  const root = segs[1]!;
  if (WORKSPACE_PATH_NO_PREFIX_ROOTS.has(root)) return null;

  const tail = segs.slice(1).join("/");
  if (!tail) return `${CANONICAL_USER_WORKSPACE_BASE}/`;
  const next = `${CANONICAL_USER_WORKSPACE_BASE}/${tail}`;
  return path.endsWith("/") ? `${next}/` : next;
}

/** Full href — pathname rewritten only when canon pathname differs; preserves query + hash. */
export function canonicalizeWorkspaceHref(href: string): string {
  const q = href.indexOf("?");
  const hIdx = href.indexOf("#");
  const splitIdx =
    q >= 0 && hIdx >= 0
      ? Math.min(q, hIdx)
      : q >= 0
        ? q
        : hIdx >= 0
          ? hIdx
          : href.length;

  const pathPart = href.slice(0, splitIdx);
  const rest = splitIdx < href.length ? href.slice(splitIdx) : "";

  const canon = canonicalizeWorkspacePathname(pathPart);
  if (canon == null || canon === pathPart) return href;
  return `${canon}${rest}`;
}
