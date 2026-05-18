import { vi } from "vitest";

const DEFAULT_ORIGIN = "http://127.0.0.1:3000";

type MockWorkspaceRoute = {
  method?: string;
  path: string | RegExp;
  status?: number;
  body: unknown;
  headers?: HeadersInit;
};

function resolveUrl(input: RequestInfo | URL) {
  if (typeof input === "string") {
    return new URL(input, DEFAULT_ORIGIN);
  }

  if (input instanceof URL) {
    return input;
  }

  return new URL(input.url, DEFAULT_ORIGIN);
}

function resolveMethod(input: RequestInfo | URL, init?: RequestInit) {
  if (input instanceof Request) {
    return input.method.toUpperCase();
  }

  return (init?.method ?? "GET").toUpperCase();
}

function pathMatches(path: string | RegExp, pathname: string) {
  return typeof path === "string" ? path === pathname : path.test(pathname);
}

function jsonResponse(route: MockWorkspaceRoute) {
  return new Response(JSON.stringify(route.body), {
    status: route.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...route.headers,
    },
  });
}

export function installWorkspaceApiFetchMock(routes: MockWorkspaceRoute[]) {
  const nativeFetch = globalThis.fetch.bind(globalThis);
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = resolveUrl(input);
    const method = resolveMethod(input, init);

    if (!url.pathname.startsWith("/api/workspace")) {
      return nativeFetch(input, init);
    }

    const matchedRoute = routes.find((route) => {
      const routeMethod = (route.method ?? "GET").toUpperCase();
      return routeMethod === method && pathMatches(route.path, url.pathname);
    });

    if (!matchedRoute) {
      throw new Error(`No explicit workspace mock registered for ${method} ${url.pathname}`);
    }

    return jsonResponse(matchedRoute);
  });

  globalThis.fetch = fetchMock as typeof fetch;

  return () => {
    globalThis.fetch = nativeFetch;
  };
}