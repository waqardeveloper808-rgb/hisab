export type AuthSession = {
  id: number;
  name: string;
  email: string;
  platformRole?: string;
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
    const parsed = JSON.parse(decoded) as Partial<AuthSession>;

    if (typeof parsed.id !== "number" || ! parsed.name || ! parsed.email) {
      return null;
    }

    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      platformRole: typeof parsed.platformRole === "string" ? parsed.platformRole : undefined,
    };
  } catch {
    return null;
  }
}