import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const repoRoot = path.resolve(__dirname, "..", "..");

const guardedFiles = [
  "lib/auth-session.ts",
  "lib/server-access.ts",
  "lib/workspace-session.ts",
  "app/api/auth/login/route.ts",
  "app/api/auth/session/route.ts",
] as const;

const bannedSourceMarkers = [
  "127.0.0.1:7465",
  "X-Debug-Session-Id",
  "identity-entry",
  "#region agent log",
  "b10564",
  "gulf-hisab-dev-session-secret",
  "dummy-workspace-token",
] as const;

const envKeys = [
  "NODE_ENV",
  "AUTH_SESSION_SECRET",
  "ENABLE_DUMMY_LOGIN",
  "DUMMY_LOGIN_EMAIL",
  "DUMMY_LOGIN_PASSWORD",
  "DUMMY_LOGIN_AUTH_TOKEN",
  "DUMMY_LOGIN_ABILITIES",
  "GULF_HISAB_API_TOKEN",
  "WORKSPACE_API_TOKEN",
  "GULF_HISAB_API_BASE_URL",
  "NEXT_PUBLIC_GULF_HISAB_API_BASE_URL",
] as const;

const originalEnv = new Map(envKeys.map((key) => [key, process.env[key]]));

function restoreEnv() {
  for (const key of envKeys) {
    const value = originalEnv.get(key);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

async function importLoginRoute() {
  vi.resetModules();
  return import("@/app/api/auth/login/route");
}

describe("auth and debug hardening guards", () => {
  afterEach(() => {
    restoreEnv();
    vi.resetModules();
  });

  it("fails if banned auth/session debug markers return to guarded source files", () => {
    for (const relativePath of guardedFiles) {
      const contents = readFileSync(path.join(repoRoot, relativePath), "utf8");

      for (const marker of bannedSourceMarkers) {
        expect(contents).not.toContain(marker);
      }
    }
  });

  it("requires AUTH_SESSION_SECRET in production", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.AUTH_SESSION_SECRET;

    const { getSessionSecret } = await import("@/lib/auth-session");

    expect(() => getSessionSecret()).toThrow("AUTH_SESSION_SECRET is required in production.");
  });

  it("keeps dummy login disabled by default", async () => {
    process.env.NODE_ENV = "test";
    delete process.env.ENABLE_DUMMY_LOGIN;
    delete process.env.DUMMY_LOGIN_EMAIL;
    delete process.env.DUMMY_LOGIN_PASSWORD;
    delete process.env.GULF_HISAB_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_GULF_HISAB_API_BASE_URL;

    const { POST } = await importLoginRoute();
    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "demo@hisabix.local", password: "demo123" }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(503);
  });

  it("only allows dummy login when explicitly enabled", async () => {
    process.env.NODE_ENV = "test";
    process.env.ENABLE_DUMMY_LOGIN = "1";
    process.env.DUMMY_LOGIN_EMAIL = "demo@hisabix.local";
    process.env.DUMMY_LOGIN_PASSWORD = "demo123";
    delete process.env.DUMMY_LOGIN_AUTH_TOKEN;
    delete process.env.GULF_HISAB_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_GULF_HISAB_API_BASE_URL;

    const { POST } = await importLoginRoute();
    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "demo@hisabix.local", password: "demo123" }),
    });

    const response = await POST(request as never);
    const payload = await response.json() as { data?: { dummy_login?: boolean; email?: string } };

    expect(response.status).toBe(200);
    expect(payload.data?.dummy_login).toBe(true);
    expect(payload.data?.email).toBe("demo@hisabix.local");
  });
});