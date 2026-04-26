"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, UserRound } from "lucide-react";
import { V2_BASE } from "@/lib/workspace-v2/navigation";

const TABS = [
  {
    id: "profile",
    label: "User profile",
    href: `${V2_BASE}/settings/profile`,
    icon: UserRound,
  },
  {
    id: "company",
    label: "Company profile",
    href: `${V2_BASE}/settings/company`,
    icon: Building2,
  },
];

export function WorkspaceV2SettingsTabs() {
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
