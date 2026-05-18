import { vi } from "vitest";

type RouterMock = {
  push: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  prefetch: ReturnType<typeof vi.fn>;
  refresh: ReturnType<typeof vi.fn>;
  back: ReturnType<typeof vi.fn>;
  forward: ReturnType<typeof vi.fn>;
};

export function createNextNavigationModuleMock(options?: {
  pathname?: string;
  searchParams?: string | URLSearchParams;
  router?: Partial<RouterMock>;
}) {
  const router: RouterMock = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    ...options?.router,
  };

  return {
    useRouter: () => router,
    useSearchParams: () => {
      if (options?.searchParams instanceof URLSearchParams) {
        return options.searchParams;
      }

      return new URLSearchParams(options?.searchParams ?? "");
    },
    usePathname: () => options?.pathname ?? "/workspace/user",
  };
}