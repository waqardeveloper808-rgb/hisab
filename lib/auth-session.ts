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

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET
    ?? process.env.GULF_HISAB_API_TOKEN
    ?? "gulf-hisab-dev-session-secret";
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

function isPositiveInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function normalizeOptionalPositiveInteger(value: unknown) {
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
    session.workspaceContext = {
      activeCompany: {
        id: activeCompanyId,
        legalName: activeCompanyLegalName,
        role: typeof activeCompany.role === "string" ? activeCompany.role : undefined,
        abilities: Array.isArray(activeCompany.abilities)
          ? activeCompany.abilities.filter((ability): ability is string => typeof ability === "string")
          : undefined,
      },
    };
  }

  return session;
}

export async function readAuthSessionOutcome(cookieValue?: string | null): Promise<AuthSessionReadResult> {
  if (! cookieValue) {
    // #region agent log
    fetch('http://127.0.0.1:7465/ingest/b2483e75-3306-45a2-911d-fd8fcd98d8f8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b10564'},body:JSON.stringify({sessionId:'b10564',runId:'identity-entry-1',hypothesisId:'H1',location:'lib/auth-session.ts:188',message:'Auth session cookie missing',data:{hasCookie:false},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return { status: "guest", session: null, reason: "missing" };
  }

  const [payload, signature] = cookieValue.split(".");

  if (! payload || ! signature) {
    // #region agent log
    fetch('http://127.0.0.1:7465/ingest/b2483e75-3306-45a2-911d-fd8fcd98d8f8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b10564'},body:JSON.stringify({sessionId:'b10564',runId:'identity-entry-1',hypothesisId:'H1',location:'lib/auth-session.ts:194',message:'Auth session cookie malformed',data:{hasPayload:Boolean(payload),hasSignature:Boolean(signature)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return { status: "invalid_session", session: null, reason: "malformed" };
  }

  const expectedSignature = await sign(payload);

  if (! await timingSafeEqual(signature, expectedSignature)) {
    // #region agent log
    fetch('http://127.0.0.1:7465/ingest/b2483e75-3306-45a2-911d-fd8fcd98d8f8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b10564'},body:JSON.stringify({sessionId:'b10564',runId:'identity-entry-1',hypothesisId:'H2',location:'lib/auth-session.ts:200',message:'Auth session signature invalid',data:{payloadLength:payload.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return { status: "invalid_session", session: null, reason: "invalid_signature" };
  }

  try {
    const decoded = new TextDecoder().decode(fromBase64Url(payload));
    const parsed = JSON.parse(decoded) as Partial<LegacyAuthSession>;
    const session = normalizeAuthSession(parsed);

    // #region agent log
    fetch('http://127.0.0.1:7465/ingest/b2483e75-3306-45a2-911d-fd8fcd98d8f8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b10564'},body:JSON.stringify({sessionId:'b10564',runId:'identity-entry-1',hypothesisId:'H1',location:'lib/auth-session.ts:209',message:'Auth session parsed',data:{normalized:Boolean(session),hasParsedCompanyId:typeof parsed.companyId==='number'||typeof parsed.company_id==='number',hasParsedActiveCompany:Boolean(parsed.workspaceContext?.activeCompany??parsed.workspace_context?.active_company),normalizedCompanyId:session?.companyId??null,hasNormalizedActiveCompany:Boolean(session?.workspaceContext?.activeCompany?.id)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

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
