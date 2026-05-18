export type AuthSession = {
  id: number;
  userId: number;
  name: string;
  email: string;
  authToken?: string;
  companyId?: number;
  platformRole?: string;
  workspaceContext?: {
    activeCompany?: {
      id: number;
      legalName: string;
      role?: string;
      abilities?: string[];
    };
  };
};

export type AuthSessionReadStatus = "guest" | "invalid_session" | "ready";

export type AuthSessionReadResult =
  | {
      status: "guest";
      session: null;
      reason: "missing";
    }
  | {
      status: "invalid_session";
      session: null;
      reason: "malformed" | "invalid_signature" | "invalid_payload";
    }
  | {
      status: "ready";
      session: AuthSession;
      reason: null;
    };

type LegacyAuthSession = {
  id: number;
  userId?: number;
  name: string;
  email: string;
  authToken?: string;
  auth_token?: string;
  companyId?: number;
  company_id?: number;
  platformRole?: string;
  workspaceContext?: AuthSession["workspaceContext"];
  workspace_context?: {
    active_company?: {
      id?: number;
      legal_name?: string;
      legalName?: string;
      role?: string;
      abilities?: string[];
    };
  };
};

type LegacyActiveCompany = {
  id?: number;
  legalName?: string;
  legal_name?: string;
  role?: string;
  abilities?: string[];
};

export const authSessionCookieName = "gulf_hisab_session";
export const authSessionMaxAge = 60 * 60 * 24 * 7;

/** When `AUTH_SESSION_COOKIE_SECURE=0`, allow `http://` cookies under `next start` (local proof only). */
export function authSessionCookieSecure(): boolean {
  const v = process.env.AUTH_SESSION_COOKIE_SECURE?.trim();
  if (v === "0" || v?.toLowerCase() === "false") {
    return false;
  }
  if (v === "1" || v?.toLowerCase() === "true") {
    return true;
  }
  return process.env.NODE_ENV === "production";
}

export const guestAuthSession: AuthSession = {
  id: 0,
  userId: 0,
  name: "Guest preview",
  email: "preview@hisabix.local",
  platformRole: "guest",
};

export function getSessionSecret() {
  const explicit = process.env.AUTH_SESSION_SECRET?.trim();

  if (explicit) {
    return explicit;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SESSION_SECRET is required in production.");
  }

  return "hisabix-local-dev-session-secret-do-not-use-in-production";
}

function toBase64Url(bytes: Uint8Array) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  const base64 = typeof btoa === "function"
    ? btoa(binary)
    : Buffer.from(binary, "binary").toString("base64");

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = typeof atob === "function"
    ? atob(base64)
    : Buffer.from(base64, "base64").toString("binary");

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return toBase64Url(new Uint8Array(signature));
}

async function timingSafeEqual(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);

  if (leftBytes.length !== rightBytes.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < leftBytes.length; index += 1) {
    result |= leftBytes[index] ^ rightBytes[index];
  }

  return result === 0;
}

export async function createAuthSessionValue(session: AuthSession) {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify(session)));
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function normalizeOptionalPositiveInteger(value: unknown): number | null {
  return isPositiveInteger(value) ? value : null;
}

function normalizeAuthSession(parsed: Partial<LegacyAuthSession>): AuthSession | null {
  const activeCompany = (parsed.workspaceContext?.activeCompany ?? parsed.workspace_context?.active_company) as LegacyActiveCompany | undefined;
  const normalizedCompanyId = normalizeOptionalPositiveInteger(parsed.companyId) ?? normalizeOptionalPositiveInteger(parsed.company_id);
  const activeCompanyId = normalizeOptionalPositiveInteger(activeCompany?.id);
  const activeCompanyLegalName = typeof activeCompany?.legalName === "string"
    ? activeCompany.legalName
    : typeof activeCompany?.legal_name === "string"
      ? activeCompany.legal_name
      : null;

  if (!isPositiveInteger(parsed.id) || !isPositiveInteger(parsed.userId) || !isNonEmptyString(parsed.name) || !isNonEmptyString(parsed.email)) {
    return null;
  }

  if (activeCompanyId !== null && !isNonEmptyString(activeCompanyLegalName)) {
    return null;
  }

  if (activeCompanyId === null && activeCompanyLegalName !== null) {
    return null;
  }

  if (normalizedCompanyId !== null && activeCompanyId !== null && normalizedCompanyId !== activeCompanyId) {
    return null;
  }

  const session: AuthSession = {
    id: parsed.id as number,
    userId: parsed.userId as number,
    name: parsed.name as string,
    email: parsed.email as string,
    authToken: isNonEmptyString(parsed.authToken)
      ? parsed.authToken
      : isNonEmptyString(parsed.auth_token)
        ? parsed.auth_token
        : undefined,
    companyId: normalizedCompanyId ?? activeCompanyId ?? undefined,
    platformRole: typeof parsed.platformRole === "string" ? parsed.platformRole : undefined,
  };

  if (activeCompanyId !== null && activeCompanyLegalName !== null) {
    const activeCompanyRole = typeof activeCompany?.role === "string" ? activeCompany.role : undefined;
    const activeCompanyAbilities = Array.isArray(activeCompany?.abilities)
      ? activeCompany.abilities.filter((ability): ability is string => typeof ability === "string")
      : undefined;

    session.workspaceContext = {
      activeCompany: {
        id: activeCompanyId,
        legalName: activeCompanyLegalName,
        role: activeCompanyRole,
        abilities: activeCompanyAbilities,
      },
    };
  }

  return session;
}

export async function readAuthSessionOutcome(cookieValue?: string | null): Promise<AuthSessionReadResult> {
  if (! cookieValue) {
    return { status: "guest", session: null, reason: "missing" };
  }

  const [payload, signature] = cookieValue.split(".");

  if (! payload || ! signature) {
    return { status: "invalid_session", session: null, reason: "malformed" };
  }

  const expectedSignature = await sign(payload);

  if (! await timingSafeEqual(signature, expectedSignature)) {
    return { status: "invalid_session", session: null, reason: "invalid_signature" };
  }

  try {
    const decoded = new TextDecoder().decode(fromBase64Url(payload));
    const parsed = JSON.parse(decoded) as Partial<LegacyAuthSession>;
    const session = normalizeAuthSession(parsed);

    if (! session) {
      return { status: "invalid_session", session: null, reason: "invalid_payload" };
    }

    return { status: "ready", session, reason: null };
  } catch {
    return { status: "invalid_session", session: null, reason: "invalid_payload" };
  }
}

export async function readAuthSession(cookieValue?: string | null): Promise<AuthSession | null> {
  const result = await readAuthSessionOutcome(cookieValue);
  return result.status === "ready" ? result.session : null;
}
