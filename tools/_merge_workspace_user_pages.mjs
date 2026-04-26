import fs from "node:fs";
import path from "node:path";

const srcRoot = path.resolve("app/workspace-v2/user");
const dstRoot = path.resolve("app/workspace/user");

const pairs = [
  ["WorkspaceV2SupplierPaymentsRegister", "WorkspaceSupplierPaymentsRegister"],
  ["WorkspaceV2DocumentRenderer", "WorkspaceDocumentRenderer"],
  ["WorkspaceV2PurchaseOrderRegister", "WorkspacePurchaseOrderRegister"],
  ["WorkspaceV2DocumentPreview", "WorkspaceDocumentPreview"],
  ["WorkspaceV2RegisterToolbar", "WorkspaceRegisterToolbar"],
  ["WorkspaceV2TemplateStudio", "WorkspaceTemplateStudio"],
  ["WorkspaceV2ModulePlaceholder", "WorkspaceModulePlaceholder"],
  ["WorkspaceV2ThemeSwitcher", "WorkspaceAppThemeSwitcher"],
  ["WorkspaceV2PaymentsRegister", "WorkspacePaymentsRegister"],
  ["WorkspaceV2CompanySettings", "WorkspaceCompanySettings"],
  ["WorkspaceV2ThemeBoundary", "WorkspaceThemeBoundary"],
  ["WorkspaceV2PreviewPanel", "WorkspacePreviewPanel"],
  ["WorkspaceV2ColumnPicker", "WorkspaceColumnPicker"],
  ["WorkspaceV2MoreActions", "WorkspaceMoreActions"],
  ["WorkspaceV2StockRegister", "WorkspaceStockRegister"],
  ["WorkspaceV2Suggestion", "WorkspaceSuggestion"],
  ["WorkspaceV2VendorRegister", "WorkspaceVendorRegister"],
  ["WorkspaceV2EmptyState", "WorkspaceEmptyState"],
  ["WorkspaceV2TemplatesList", "WorkspaceTemplatesList"],
  ["WorkspaceV2SettingsTabs", "WorkspaceSettingsTabs"],
  ["WorkspaceV2ImportHub", "WorkspaceImportHub"],
  ["WorkspaceV2Register", "WorkspaceRegister"],
  ["WorkspaceV2ReportsHub", "WorkspaceReportsHub"],
  ["WorkspaceV2Dashboard", "WorkspaceDashboard"],
  ["WorkspaceV2UserProfile", "WorkspaceUserProfile"],
  ["WorkspaceV2Profile", "WorkspaceUserProfile"],
  ["WorkspaceV2HelpCenter", "WorkspaceHelpCenter"],
  ["WorkspaceV2Help", "WorkspaceHelpCenter"],
  ["WorkspaceV2Sidebar", "WorkspaceAppSidebar"],
  ["WorkspaceV2Topbar", "WorkspaceAppTopbar"],
  ["WorkspaceV2Shell", "WorkspaceAppShell"],
];

function transform(content) {
  let c = content;
  for (const [a, b] of pairs) {
    c = c.split(a).join(b);
  }
  c = c.split("@/components/workspace-v2/").join("@/components/workspace/");
  c = c.split("@/lib/workspace-v2/").join("@/lib/workspace/");
  c = c.split("@/data/workspace-v2/").join("@/data/workspace/");
  c = c.split("Workspace V2 — ").join("Workspace — ");
  c = c.split('title: "Workspace V2"').join('title: "Workspace"');
  c = c.replace(/\/WorkspaceV2Settings/g, "/WorkspaceSettingsNav");
  return c;
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (name === "page.tsx") {
      const rel = path.relative(srcRoot, p);
      const dest = path.join(dstRoot, rel);
      const raw = fs.readFileSync(p, "utf8");
      const out = transform(raw);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, out, "utf8");
    }
  }
}

walk(srcRoot);
console.log("merged", srcRoot, "->", dstRoot);
