import { describe, expect, it, vi } from "vitest";
import { installAuthSessionFetchMock } from "@/tests/helpers/mock-auth-session";
import { installWorkspaceApiFetchMock } from "@/tests/helpers/mock-workspace-api-fetch";

describe("global mock isolation", () => {
  it("leaves global fetch unmocked by default", () => {
    expect(vi.isMockFunction(globalThis.fetch)).toBe(false);
  });

  it("does not provide a default workspace success envelope", async () => {
    await expect(globalThis.fetch("/api/workspace/settings")).rejects.toThrow();
  });

  it("applies workspace API mocks only after explicit opt-in and restores cleanly", async () => {
    const restore = installWorkspaceApiFetchMock([
      {
        path: "/api/workspace/settings",
        body: {
          data: {
            company: {
              legal_name: "Truthful Test Co",
            },
          },
        },
      },
    ]);

    expect(vi.isMockFunction(globalThis.fetch)).toBe(true);

    const response = await globalThis.fetch("/api/workspace/settings");

    expect(response.ok).toBe(true);
    await expect(response.json()).resolves.toEqual({
      data: {
        company: {
          legal_name: "Truthful Test Co",
        },
      },
    });

    restore();

    expect(vi.isMockFunction(globalThis.fetch)).toBe(false);
  });

  it("applies auth session mocks only after explicit opt-in and restores cleanly", async () => {
    const restore = installAuthSessionFetchMock({
      data: {
        id: 9,
        userId: 9,
        name: "Session Tester",
        email: "session@test.local",
      },
      active_company_id: 5,
    });

    const response = await globalThis.fetch("/api/auth/session");

    expect(response.ok).toBe(true);
    await expect(response.json()).resolves.toEqual({
      data: {
        id: 9,
        userId: 9,
        name: "Session Tester",
        email: "session@test.local",
      },
      access_status: "ready",
      active_company_id: 5,
    });

    restore();

    expect(vi.isMockFunction(globalThis.fetch)).toBe(false);
  });
});