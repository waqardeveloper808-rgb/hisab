"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, FileBadge2, ImagePlus, MapPinned, ShieldCheck } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import {
  getCompanySettings,
  updateCompanySettings,
  uploadCompanyAsset,
  type CompanySettingsSnapshot,
} from "@/lib/workspace-api";

type CompanySetupWizardProps = {
  hasActiveCompany: boolean;
  userName: string;
};

type AssetField = "logo" | "stamp" | "signature";

type WizardState = {
  companyName: string;
  country: string;
  vatNumber: string;
  address: string;
  city: string;
  logoFile: File | null;
  stampFile: File | null;
  signatureFile: File | null;
};

const onboardingWarningStorageKey = "hisabix:onboarding-warning";

function buildSnapshot(base: CompanySettingsSnapshot | null, state: WizardState): CompanySettingsSnapshot {
  return {
    company: {
      legalName: state.companyName,
      tradeName: base?.company.tradeName ?? state.companyName,
      arabicName: base?.company.arabicName ?? "",
      englishName: state.companyName,
      taxNumber: state.vatNumber,
      registrationNumber: base?.company.registrationNumber ?? "",
      phone: base?.company.phone ?? "",
      email: base?.company.email ?? "",
      fax: base?.company.fax ?? "",
      baseCurrency: base?.company.baseCurrency ?? "SAR",
      locale: base?.company.locale ?? "en-SA",
      timezone: base?.company.timezone ?? "Asia/Riyadh",
      addressBuildingNumber: base?.company.addressBuildingNumber ?? "",
      addressStreet: state.address,
      addressArea: base?.company.addressArea ?? "",
      addressCity: state.city,
      addressPostalCode: base?.company.addressPostalCode ?? "",
      addressAdditionalNumber: base?.company.addressAdditionalNumber ?? "",
      addressCountry: state.country,
      shortAddress: [state.city, state.country].filter(Boolean).join(", "),
      industry: base?.company.industry ?? "",
      organizationSize: base?.company.organizationSize ?? "",
    },
    settings: {
      defaultLanguage: base?.settings.defaultLanguage ?? "en",
      invoicePrefix: base?.settings.invoicePrefix ?? "INV",
      creditNotePrefix: base?.settings.creditNotePrefix ?? "CRN",
      paymentPrefix: base?.settings.paymentPrefix ?? "PAY",
      vendorBillPrefix: base?.settings.vendorBillPrefix ?? "BIL",
      purchaseInvoicePrefix: base?.settings.purchaseInvoicePrefix ?? "PINV",
      purchaseCreditNotePrefix: base?.settings.purchaseCreditNotePrefix ?? "PCRN",
      defaultReceivableAccountCode: base?.settings.defaultReceivableAccountCode ?? "",
      defaultPayableAccountCode: base?.settings.defaultPayableAccountCode ?? "",
      defaultRevenueAccountCode: base?.settings.defaultRevenueAccountCode ?? "",
      defaultExpenseAccountCode: base?.settings.defaultExpenseAccountCode ?? "",
      defaultCashAccountCode: base?.settings.defaultCashAccountCode ?? "",
      defaultCustomerAdvanceAccountCode: base?.settings.defaultCustomerAdvanceAccountCode ?? "",
      defaultSupplierAdvanceAccountCode: base?.settings.defaultSupplierAdvanceAccountCode ?? "",
      defaultVatPayableAccountCode: base?.settings.defaultVatPayableAccountCode ?? "",
      defaultVatReceivableAccountCode: base?.settings.defaultVatReceivableAccountCode ?? "",
      zatcaEnvironment: base?.settings.zatcaEnvironment ?? "sandbox",
      numberingRules: base?.settings.numberingRules ?? {},
    },
  };
}

export function CompanySetupWizard({ hasActiveCompany, userName }: CompanySetupWizardProps) {
  const router = useRouter();
  const [state, setState] = useState<WizardState>({
    companyName: "",
    country: "Saudi Arabia",
    vatNumber: "",
    address: "",
    city: "",
    logoFile: null,
    stampFile: null,
    signatureFile: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const assetSummary = useMemo(() => [
    { key: "logoFile" as const, label: "Logo upload" },
    { key: "stampFile" as const, label: "Stamp upload" },
    { key: "signatureFile" as const, label: "Signature upload" },
  ], []);

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  async function ensureCompanyContext() {
    if (hasActiveCompany) {
      return;
    }

    const response = await fetch("/api/auth/company-setup", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        legal_name: state.companyName,
        trade_name: state.companyName,
        tax_number: state.vatNumber || undefined,
        base_currency: "SAR",
        locale: "en-SA",
        timezone: "Asia/Riyadh",
        branch_city: state.city || undefined,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { message?: string; errors?: Record<string, string[]> } | null;
      throw new Error(payload?.message ?? Object.values(payload?.errors ?? {})[0]?.[0] ?? "Company setup could not be completed.");
    }
  }

  async function uploadOptionalAsset(kind: AssetField) {
    const file = kind === "logo" ? state.logoFile : kind === "stamp" ? state.stampFile : state.signatureFile;
    if (!file) {
      return;
    }

    await uploadCompanyAsset({
      type: kind === "logo" ? "logo" : "document",
      usage: kind,
      file,
    });
  }

  async function handleContinue() {
    setSaving(true);
    setError(null);
    setStatus("Creating your company workspace...");

    try {
      await ensureCompanyContext();
      const currentSettings = await getCompanySettings().catch(() => null);
      await updateCompanySettings(buildSnapshot(currentSettings, state));
      await uploadOptionalAsset("logo");
      await uploadOptionalAsset("stamp");
      await uploadOptionalAsset("signature");

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(onboardingWarningStorageKey);
      }

      router.push("/workspace/user?onboarding=complete");
      router.refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Company setup failed.");
    } finally {
      setSaving(false);
      setStatus(null);
    }
  }

  function handleSkip() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(onboardingWarningStorageKey, "skipped");
    }

    router.push("/workspace/user?onboarding=skipped");
    router.refresh();
  }

  const canContinue = state.companyName.trim().length > 1 && state.country.trim().length > 1;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)]">
        <Card className="rounded-2xl bg-white/95 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-primary-soft p-3 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Company setup wizard</p>
              <h1 className="mt-1 text-2xl font-semibold text-ink">Set up the company profile before you enter the live workspace.</h1>
              <p className="mt-2 text-sm leading-6 text-muted">
                This step prepares the legal identity, VAT details, and brand assets used across invoices, previews, and document output.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Input label="Company name" required value={state.companyName} onChange={(event) => update("companyName", event.target.value)} placeholder="Hisabix Trading Co." />
            <Input label="Country" required value={state.country} onChange={(event) => update("country", event.target.value)} placeholder="Saudi Arabia" />
            <Input label="VAT number" value={state.vatNumber} onChange={(event) => update("vatNumber", event.target.value)} placeholder="300000000000003" />
            <Input label="City" value={state.city} onChange={(event) => update("city", event.target.value)} placeholder="Riyadh" />
            <Input label="Address" className="md:col-span-2" value={state.address} onChange={(event) => update("address", event.target.value)} placeholder="District, street, building, and postal details" />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <AssetUploadCard
              icon={<ImagePlus className="h-4 w-4" />}
              label="Logo upload"
              file={state.logoFile}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onFileChange={(file) => update("logoFile", file)}
            />
            <AssetUploadCard
              icon={<FileBadge2 className="h-4 w-4" />}
              label="Stamp upload"
              file={state.stampFile}
              accept="image/png,image/jpeg,image/webp"
              onFileChange={(file) => update("stampFile", file)}
            />
            <AssetUploadCard
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Signature upload"
              file={state.signatureFile}
              accept="image/png,image/jpeg,image/webp"
              onFileChange={(file) => update("signatureFile", file)}
            />
          </div>

          {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          {status ? <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">{status}</div> : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-xs text-muted">You can update these values later from Settings / Company Profile.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={handleSkip} disabled={saving}>Skip for now</Button>
              <Button onClick={() => void handleContinue()} disabled={!canContinue || saving}>
                {saving ? "Saving setup" : "Continue to workspace"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl bg-white/95 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Prepared for {userName}</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">What this setup unlocks</h2>
          <div className="mt-4 space-y-3">
            <InfoRow icon={<MapPinned className="h-4 w-4" />} title="Document defaults" description="The company name, VAT number, and address flow into invoice and report output." />
            <InfoRow icon={<ImagePlus className="h-4 w-4" />} title="Brand assets" description="Logo, stamp, and signature stay ready for templates, print, and PDF actions." />
            <InfoRow icon={<ShieldCheck className="h-4 w-4" />} title="Skip-safe entry" description="If you skip, the workspace still opens and shows a warning until setup is completed." />
          </div>

          <div className="mt-5 rounded-xl border border-line bg-surface-soft/50 p-4">
            <p className="text-sm font-semibold text-ink">Current draft</p>
            <div className="mt-3 space-y-2 text-sm text-muted">
              <p><span className="font-semibold text-ink">Company:</span> {state.companyName || "Not entered yet"}</p>
              <p><span className="font-semibold text-ink">Country:</span> {state.country || "Not entered yet"}</p>
              <p><span className="font-semibold text-ink">VAT:</span> {state.vatNumber || "Optional for now"}</p>
              {assetSummary.map((entry) => (
                <p key={entry.key}>
                  <span className="font-semibold text-ink">{entry.label}:</span> {state[entry.key] ? "Ready" : "Not uploaded"}
                </p>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AssetUploadCard({
  icon,
  label,
  file,
  accept,
  onFileChange,
}: {
  icon: ReactNode;
  label: string;
  file: File | null;
  accept: string;
  onFileChange: (file: File | null) => void;
}) {
  return (
    <label className="rounded-xl border border-line bg-surface-soft/35 p-4 text-sm text-ink">
      <div className="flex items-center gap-2">
        <span className="rounded-lg bg-white p-2 text-primary">{icon}</span>
        <span className="font-semibold">{label}</span>
      </div>
      <p className="mt-2 text-xs text-muted">{file ? file.name : "Upload an image file"}</p>
      <input
        type="file"
        accept={accept}
        className="mt-3 block w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:font-semibold file:text-white"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function InfoRow({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-soft/35 p-4">
      <div className="flex items-center gap-2">
        <span className="rounded-lg bg-white p-2 text-primary">{icon}</span>
        <span className="font-semibold text-ink">{title}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}
