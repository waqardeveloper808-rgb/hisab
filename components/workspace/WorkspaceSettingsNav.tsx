"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, UserRound } from "lucide-react";
import { USER_WORKSPACE_BASE } from "@/lib/workspace/navigation";

const TABS = [
  {
    id: "profile",
    label: "User profile",
    href: `${USER_WORKSPACE_BASE}/settings/profile`,
    icon: UserRound,
  },
  {
    id: "company",
    label: "Company profile",
    href: `${USER_WORKSPACE_BASE}/settings/company`,
    icon: Building2,
  },
];

export function WorkspaceSettingsTabs() {
  const pathname = usePathname() ?? "";
  return (
    <div className="wsv2-tabs" role="tablist" aria-label="Settings sections">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className="wsv2-tab"
            data-active={active ? "true" : "false"}
            role="tab"
          >
            <tab.icon size={13} /> {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
