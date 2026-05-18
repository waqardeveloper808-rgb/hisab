import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { config, proxy } from "../../proxy";

describe("workspace proxy", () => {
  it("preserves the workspace-only matcher config", () => {
    expect(config.matcher).toEqual(["/workspace/:path*"]);
  });

  it("does not redirect unrelated routes when called directly", () => {
    const response = proxy(new NextRequest("http://localhost:3000/login"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects legacy dashboard routes to the canonical user workspace path", () => {
    const response = proxy(new NextRequest("http://localhost:3000/workspace/dashboard"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("http://localhost:3000/workspace/user/dashboard");
  });

  it("returns next for an already canonical user workspace path", () => {
    const response = proxy(new NextRequest("http://localhost:3000/workspace/user/dashboard"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("preserves the query string during redirect", () => {
    const response = proxy(new NextRequest("http://localhost:3000/workspace/reports?tab=vat&range=this-quarter"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("http://localhost:3000/workspace/user/reports?tab=vat&range=this-quarter");
  });

  it("keeps redirect targets on the same origin", () => {
    const response = proxy(new NextRequest("http://localhost:3000/workspace/http://evil.example/steal"));
    const location = response.headers.get("location");
    const redirectedUrl = new URL(location!);

    expect(redirectedUrl.origin).toBe("http://localhost:3000");
    expect(redirectedUrl.pathname).toBe("/workspace/user/http:/evil.example/steal");
  });

  it("does not call backend or auth/session while canonicalizing", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    proxy(new NextRequest("http://localhost:3000/workspace/dashboard"));

    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it("keeps document shell routes unredirected under current canonicalization behavior", () => {
    const response = proxy(new NextRequest("http://localhost:3000/workspace/invoices"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});