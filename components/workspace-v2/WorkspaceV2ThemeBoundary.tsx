"use client";

import { useWsV2Theme } from "@/lib/workspace-v2/use-theme";

/**
 * Wraps Workspace V2 content with a single attribute root that exposes the
 * persisted theme via `data-wsv2-theme`. All theme-aware CSS in `v2.css`
 * keys off this attribute, so changing it instantly retints every V2 surface
 * (sidebar, registers, preview panel, template studio, settings) without any
 * page reload or component re-mount.
 *
 * SSR returns "light" (see use-theme.ts), so the initial markup is stable
 * and the persisted choice is applied on the very first client commit.
 */
export function WorkspaceV2ThemeBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useWsV2Theme();
  return (
    <div data-wsv2 data-wsv2-theme={theme}>
      {children}
    </div>
  );
}
