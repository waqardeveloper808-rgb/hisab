"use client";

import { Button } from "@/components/Button";
import { DocumentCenterOverview } from "@/components/workspace/DocumentCenterOverview";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { mapWorkspaceHref } from "@/lib/workspace-path";

export function SalesOverview() {
  const { basePath } = useWorkspacePath();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" data-inspector-sales-tabs="true">
        <Button variant="secondary" href={mapWorkspaceHref("/workspace/user/invoices", basePath)}>Invoices</Button>
        <Button variant="secondary" href={mapWorkspaceHref("/workspace/user/quotations", basePath)}>Quotations</Button>
        <Button variant="secondary" href={mapWorkspaceHref("/workspace/user/proforma-invoices", basePath)}>Proforma Invoices</Button>
      </div>
      <DocumentCenterOverview group="sales" titleOverride="Sales register" eyebrowOverride="Sales" />
    </div>
  );
}