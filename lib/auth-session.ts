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
      role?: string;
      abilities?: string[];
    };
  };
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

export async function readAuthSession(cookieValue?: string | null): Promise<AuthSession | null> {
  if (! cookieValue) {
    return null;
  }

  const [payload, signature] = cookieValue.split(".");

  if (! payload || ! signature) {
    return null;
  }

  const expectedSignature = await sign(payload);

  if (! await timingSafeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const decoded = new TextDecoder().decode(fromBase64Url(payload));
    const parsed = JSON.parse(decoded) as Partial<LegacyAuthSession>;

    if (typeof parsed.id !== "number" || ! parsed.name || ! parsed.email) {
      return null;
    }

    const activeCompany = parsed.workspaceContext?.activeCompany ?? parsed.workspace_context?.active_company;

    return {
      id: parsed.id,
      userId: typeof parsed.userId === "number" ? parsed.userId : parsed.id,
      name: parsed.name,
      email: parsed.email,
      authToken: typeof parsed.authToken === "string"
        ? parsed.authToken
        : typeof parsed.auth_token === "string"
          ? parsed.auth_token
          : undefined,
      companyId: typeof parsed.companyId === "number"
        ? parsed.companyId
        : typeof parsed.company_id === "number"
          ? parsed.company_id
          : typeof activeCompany?.id === "number"
            ? activeCompany.id
            : undefined,
      platformRole: typeof parsed.platformRole === "string" ? parsed.platformRole : undefined,
      workspaceContext: typeof activeCompany?.id === "number" && typeof activeCompany?.legal_name === "string"
        ? {
            activeCompany: {
              id: activeCompany.id,
              legalName: activeCompany.legal_name,
              role: typeof activeCompany.role === "string" ? activeCompany.role : undefined,
              abilities: Array.isArray(activeCompany.abilities)
                ? activeCompany.abilities.filter((ability): ability is string => typeof ability === "string")
                : undefined,
            },
          }
        : parsed.workspaceContext,
    };
  } catch {
    return null;
  }
}