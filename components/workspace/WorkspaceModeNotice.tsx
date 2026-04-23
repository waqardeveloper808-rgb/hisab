"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useWorkspaceMode } from "@/components/workspace/WorkspaceAccessProvider";

export function WorkspaceModeNotice({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  const { isPreview } = useWorkspaceMode();

  if (!isPreview) {
    return null;
  }

  return (
    <Card className="rounded-xl bg-white/95 p-2.5" data-inspector-preview-notice="true" data-inspector-guidance="true">
      <div className="flex items-center justify-between gap-3 text-xs">
        <div>
          <p className="font-semibold text-ink">{title}</p>
          <p className="mt-0.5 text-muted">{detail}</p>
        </div>
        <div className="shrink-0">
          <Button href="/login" variant="secondary" size="sm">Sign in</Button>
        </div>
      </div>
    </Card>
  );
}