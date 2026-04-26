"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { useWorkspaceMode } from "@/components/workspace/WorkspaceAccessProvider";
import { validateCompanyProfile, type FieldErrors } from "@/lib/business-form-validation";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { mapWorkspaceHref } from "@/lib/workspace-path";
import { getCompanySettings, listCompanyAssets, updateCompanySettings, uploadCompanyAsset, type CompanyAssetRecord, type CompanySettingsSnapshot } from "@/lib/workspace-api";

type FeedbackState = {
  kind: "save" | "upload";
  text: string;
  stamp: string;
};

const emptyState: CompanySettingsSnapshot = {
  company: {
    legalName: "",
    tradeName: "",
    arabicName: "",
    englishName: "",
    taxNumber: "",
    registrationNumber: "",
    phone: "",
    email: "",
    fax: "",
    baseCurrency: "",
    locale: "",
    timezone: "",
    addressBuildingNumber: "",
    addressStreet: "",
    addressArea: "",
    addressCity: "",
    addressPostalCode: "",
    addressAdditionalNumber: "",
    addressCountry: "",
    shortAddress: "",
    industry: "",
    organizationSize: "",
  },
  settings: {
    defaultLanguage: "",
    invoicePrefix: "",
    creditNotePrefix: "",
    paymentPrefix: "",
    vendorBillPrefix: "",
    purchaseInvoicePrefix: "",
    purchaseCreditNotePrefix: "",
    defaultReceivableAccountCode: "",
    defaultPayableAccountCode: "",
    defaultRevenueAccountCode: "",
    defaultExpenseAccountCode: "",
    defaultCashAccountCode: "",
    defaultCustomerAdvanceAccountCode: "",
    defaultSupplierAdvanceAccountCode: "",
    defaultVatPayableAccountCode: "",
    defaultVatReceivableAccountCode: "",
    zatcaEnvironment: "",
    numberingRules: {},
  },
};

export function SettingsOverview({ section = "all" }: { section?: "company" | "accounting" | "all" }) {
  const { basePath } = useWorkspacePath();
  const { isPreview } = useWorkspaceMode();
  const [snapshot, setSnapshot] = useState<CompanySettingsSnapshot>(emptyState);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingUsage, setUploadingUsage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [assets, setAssets] = useState<CompanyAssetRecord[]>([]);
  const showCompany = section === "all" || section === "company";
  const showAccounting = section === "all" || section === "accounting";
  const heading = section === "company"
    ? {
      eyebrow: "Company settings",
      title: "Company profile",
      description: "Maintain legal identity, VAT registration, and locale settings without mixing them with posting controls.",
    }
    : section === "accounting"
      ? {
        eyebrow: "Accounting settings",
        title: "Accounting controls",
        description: "Set numbering, default accounts, language, and ZATCA behavior for every document flow.",
      }
      : {
        eyebrow: "Settings",
        title: "Company and accounting settings",
        description: "Use one master company profile and one accounting control surface so every document and report starts from the same source of truth.",
      };

  useEffect(() => {
    Promise.all([
      getCompanySettings({ mode: isPreview ? "preview" : "backend" }),
      listCompanyAssets({ mode: isPreview ? "preview" : "backend" }),
    ]).then(([result, companyAssets]) => {
      if (result) {
        setSnapshot(result);
        setReady(true);
      }

      setAssets(companyAssets);
    });
  }, [isPreview]);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setFeedback((current) => current?.stamp === feedback.stamp ? null : current);
    }, 5000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [feedback]);

  useEffect(() => {
    const errors = validateCompanyProfile(snapshot.company);
    setFieldErrors(
      Object.fromEntries(
        Object.entries(errors).filter(([key]) => touchedFields[key] || (key === "address" && (touchedFields.addressStreet || touchedFields.addressCity || touchedFields.addressCountry))),
      ),
    );
  }, [snapshot, touchedFields]);

  function updateCompany<K extends keyof CompanySettingsSnapshot["company"]>(key: K, value: CompanySettingsSnapshot["company"][K]) {
    setError(null);
    setFeedback(null);
    setSnapshot((current) => ({ ...current, company: { ...current.company, [key]: value } }));
  }

  function updateSettings<K extends keyof CompanySettingsSnapshot["settings"]>(key: K, value: CompanySettingsSnapshot["settings"][K]) {
    setError(null);
    setFeedback(null);
    setSnapshot((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
  }

  function getVisibleErrors(nextSnapshot: CompanySettingsSnapshot, nextTouched = touchedFields, forceAll = false) {
    const errors = validateCompanyProfile(nextSnapshot.company);
    if (forceAll) {
      return errors;
    }

    return Object.fromEntries(
      Object.entries(errors).filter(([key]) => nextTouched[key] || (key === "address" && (nextTouched.addressStreet || nextTouched.addressCity || nextTouched.addressCountry))),
    );
  }

  function markTouched(field: string) {
    const nextTouched = { ...touchedFields, [field]: true };
    setTouchedFields(nextTouched);
    setFieldErrors(getVisibleErrors(snapshot, nextTouched));
  }

  const logoAsset = useMemo(() => assets.find((asset) => asset.usage === "logo") ?? null, [assets]);
  const stampAsset = useMemo(() => assets.find((asset) => asset.usage === "stamp") ?? null, [assets]);
  const signatureAsset = useMemo(() => assets.find((asset) => asset.usage === "signature") ?? null, [assets]);

  async function handleAssetUpload(usage: "logo" | "stamp" | "signature", file: File) {
    if (isPreview) {
      setFeedback(null);
      setError("Sign in to save changes.");
      return;
    }

    setUploadingUsage(usage);
    setFeedback(null);
    setError(null);

    try {
      const uploaded = await uploadCompanyAsset({
        type: usage === "logo" ? "logo" : "document",
        usage,
        file,
      });

      setAssets((current) => [uploaded, ...current.filter((asset) => asset.id !== uploaded.id)]);
      setFeedback({
        kind: "upload",
        text: `${usage[0].toUpperCase()}${usage.slice(1)} asset uploaded successfully.`,
        stamp: nowLabel(),
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : `${usage} asset could not be uploaded.`);
    } finally {
      setUploadingUsage(null);
    }
  }

  async function handleSave() {
    if (isPreview) {
      setFeedback(null);
      setError("Sign in to save changes.");
      return;
    }

    const nextErrors = validateCompanyProfile(snapshot.company);
    if (Object.keys(nextErrors).length > 0) {
      setTouchedFields({
        taxNumber: true,
        registrationNumber: true,
        phone: true,
        email: true,
        fax: true,
        addressBuildingNumber: true,
        addressStreet: true,
        addressArea: true,
        addressCity: true,
        addressPostalCode: true,
        addressAdditionalNumber: true,
        addressCountry: true,
        shortAddress: true,
      });
      setFieldErrors(nextErrors);
      setError("Settings were not saved. Fix the highlighted company fields, then try again.");
      return;
    }

    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const result = await updateCompanySettings(snapshot);
      setSnapshot(result);
      setReady(true);
      try {
        window.localStorage.removeItem("hisabix:onboarding-warning");
      } catch {
        // Ignore storage failures.
      }
      setFeedback({
        kind: "save",
        text: "Company settings were saved successfully.",
        stamp: nowLabel(),
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Company settings could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <Card className="rounded-xl border-white/70 bg-white/95 p-4 shadow-[0_20px_40px_-34px_rgba(17,32,24,0.18)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{heading.eyebrow}</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">{heading.title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted">{heading.description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href={mapWorkspaceHref("/workspace/settings/profile", basePath)} variant="secondary">User profile</Button>
            <Button href={mapWorkspaceHref("/workspace/settings/company", basePath)} variant={section === "company" ? "primary" : "secondary"}>Company profile</Button>
            <Button href={mapWorkspaceHref("/workspace/settings/accounting", basePath)} variant={section === "accounting" ? "primary" : "secondary"}>Accounting settings</Button>
            <Button href={mapWorkspaceHref("/workspace/settings/templates", basePath)} variant="secondary">Open templates</Button>
            <Button onClick={handleSave} disabled={saving || isPreview}>{saving ? "Saving settings" : "Save settings"}</Button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span>{ready ? "Connected to company settings" : "Company settings are not available yet"}</span>
          <Link href={mapWorkspaceHref("/workspace/help/faq", basePath)} className="font-semibold text-primary hover:text-primary-hover">Settings guidance</Link>
        </div>
      </Card>

      {isPreview ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Preview mode keeps the company profile visible with demo-safe values. Sign in to save changes or upload assets.
        </div>
      ) : null}

      <div className={["grid gap-3", showCompany && showAccounting ? "xl:grid-cols-2" : ""].join(" ")}>
        {showCompany ? <Card className="rounded-xl bg-white/95 p-4">
          <h2 className="text-lg font-semibold text-ink">Company profile master</h2>
          <div className="mt-3 grid gap-2.5 xl:grid-cols-3">
            {[
              { label: "Company logo", usage: "logo" as const, asset: logoAsset },
              { label: "Company stamp", usage: "stamp" as const, asset: stampAsset },
              { label: "Authorized signature", usage: "signature" as const, asset: signatureAsset },
            ].map((item) => (
              <div key={item.usage} className="rounded-lg border border-line bg-surface-soft p-3">
                <p className="text-sm font-semibold text-ink">{item.label}</p>
                <div className="mt-2 flex h-24 items-center justify-center rounded-lg border border-line bg-white p-3">
                  {item.asset?.publicUrl ? (
                    <Image src={item.asset.publicUrl} alt={item.label} width={180} height={96} unoptimized className="h-20 w-full object-contain" />
                  ) : <span className="text-xs text-muted">No asset uploaded</span>}
                </div>
                <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink">
                  {uploadingUsage === item.usage ? "Uploading" : `Upload ${item.label}`}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    disabled={uploadingUsage !== null || isPreview}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleAssetUpload(item.usage, file);
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2 rounded-lg border border-line bg-surface-soft px-3 py-2.5 text-sm text-muted">
              <p className="font-semibold text-ink">Single source of truth</p>
              <p className="mt-1">These values are the master company profile used to auto-fill document defaults while each issued document keeps its own snapshot.</p>
            </div>
            <Input label="Company Name EN" value={snapshot.company.englishName} onChange={(event) => updateCompany("englishName", event.target.value)} />
            <Input label="Company Name AR" value={snapshot.company.arabicName} onChange={(event) => updateCompany("arabicName", event.target.value)} />
            <Input label="Legal name" value={snapshot.company.legalName} onChange={(event) => updateCompany("legalName", event.target.value)} />
            <Input label="Trade name" value={snapshot.company.tradeName} onChange={(event) => updateCompany("tradeName", event.target.value)} />
            <Input label="CR Number" required hint="CR numbers must contain 10 digits" value={snapshot.company.registrationNumber} error={fieldErrors.registrationNumber} onBlur={() => markTouched("registrationNumber")} onChange={(event) => updateCompany("registrationNumber", event.target.value)} />
            <Input label="VAT Number" required hint="Saudi VAT numbers contain 15 digits" value={snapshot.company.taxNumber} error={fieldErrors.taxNumber} onBlur={() => markTouched("taxNumber")} onChange={(event) => updateCompany("taxNumber", event.target.value)} />
            <Input label="Building Number" required hint="4 digits" value={snapshot.company.addressBuildingNumber} error={fieldErrors.addressBuildingNumber} onBlur={() => markTouched("addressBuildingNumber")} onChange={(event) => updateCompany("addressBuildingNumber", event.target.value)} />
            <Input label="Street" required hint="Keep street, city, and country complete so the company address stays structured" value={snapshot.company.addressStreet} error={fieldErrors.addressStreet ?? fieldErrors.address} onBlur={() => markTouched("addressStreet")} onChange={(event) => updateCompany("addressStreet", event.target.value)} />
            <Input label="District" required value={snapshot.company.addressArea} error={fieldErrors.addressArea} onBlur={() => markTouched("addressArea")} onChange={(event) => updateCompany("addressArea", event.target.value)} />
            <Input label="City" required value={snapshot.company.addressCity} error={fieldErrors.addressCity} onBlur={() => markTouched("addressCity")} onChange={(event) => updateCompany("addressCity", event.target.value)} />
            <Input label="Postal Code" required hint="Postal codes must contain 5 digits" value={snapshot.company.addressPostalCode} error={fieldErrors.addressPostalCode} onBlur={() => markTouched("addressPostalCode")} onChange={(event) => updateCompany("addressPostalCode", event.target.value)} />
            <Input label="Additional Number / PO Box" required hint="Use digits only or PO Box 12345" value={snapshot.company.addressAdditionalNumber} error={fieldErrors.addressAdditionalNumber} onBlur={() => markTouched("addressAdditionalNumber")} onChange={(event) => updateCompany("addressAdditionalNumber", event.target.value)} />
            <Input label="Country" required hint="Use SA for Saudi company records" value={snapshot.company.addressCountry} error={fieldErrors.addressCountry} onBlur={() => markTouched("addressCountry")} onChange={(event) => updateCompany("addressCountry", event.target.value.toUpperCase())} />
            <Input label="Short address" required hint="Use the compact address shown on documents" value={snapshot.company.shortAddress} error={fieldErrors.shortAddress} onBlur={() => markTouched("shortAddress")} onChange={(event) => updateCompany("shortAddress", event.target.value)} />
            <Input label="Email" type="email" required hint="Use an address such as finance@company.sa" value={snapshot.company.email} error={fieldErrors.email} onBlur={() => markTouched("email")} onChange={(event) => updateCompany("email", event.target.value)} />
            <Input label="Phone" type="tel" required hint="Use 9 to 15 digits, for example +966112345678" value={snapshot.company.phone} error={fieldErrors.phone} onBlur={() => markTouched("phone")} onChange={(event) => updateCompany("phone", event.target.value)} />
            <Input label="Fax" type="tel" hint="Optional, but if used it must contain 9 to 15 digits" value={snapshot.company.fax} error={fieldErrors.fax} onBlur={() => markTouched("fax")} onChange={(event) => updateCompany("fax", event.target.value)} />
            <Input label="Industry" value={snapshot.company.industry} onChange={(event) => updateCompany("industry", event.target.value)} />
            <Input label="Organization Size" value={snapshot.company.organizationSize} onChange={(event) => updateCompany("organizationSize", event.target.value)} />
            <Input label="Base currency" value={snapshot.company.baseCurrency} onChange={(event) => updateCompany("baseCurrency", event.target.value.toUpperCase())} />
            <Input label="Locale" value={snapshot.company.locale} onChange={(event) => updateCompany("locale", event.target.value)} />
            <div className="rounded-lg border border-line bg-surface-soft px-3 py-2.5 text-sm text-muted md:col-span-2">
              <div className="flex flex-wrap gap-2">
                <Button size="xs" variant="secondary" onClick={() => updateCompany("englishName", snapshot.company.tradeName || snapshot.company.legalName)}>Use legal/trade as English</Button>
                <Button size="xs" variant="secondary" onClick={() => updateCompany("arabicName", snapshot.company.tradeName || snapshot.company.legalName)}>Use trade name as Arabic draft</Button>
              </div>
              <p className="mt-2">Translation assist is kept inside the real settings flow by letting operations copy the canonical company names into the bilingual fields before saving.</p>
            </div>
            <div className="md:col-span-2">
              <Input label="Timezone" value={snapshot.company.timezone} onChange={(event) => updateCompany("timezone", event.target.value)} />
            </div>
            {fieldErrors.address ? <div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{fieldErrors.address}</div> : null}
          </div>
        </Card> : null}

        {showAccounting ? <Card className="rounded-xl bg-white/95 p-4">
          <h2 className="text-lg font-semibold text-ink">Accounting defaults</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input label="Default language" value={snapshot.settings.defaultLanguage} onChange={(event) => updateSettings("defaultLanguage", event.target.value)} />
            <Input label="ZATCA environment" value={snapshot.settings.zatcaEnvironment} onChange={(event) => updateSettings("zatcaEnvironment", event.target.value)} />
            <Input label="Invoice prefix" value={snapshot.settings.invoicePrefix} onChange={(event) => updateSettings("invoicePrefix", event.target.value.toUpperCase())} />
            <Input label="Credit note prefix" value={snapshot.settings.creditNotePrefix} onChange={(event) => updateSettings("creditNotePrefix", event.target.value.toUpperCase())} />
            <Input label="Payment prefix" value={snapshot.settings.paymentPrefix} onChange={(event) => updateSettings("paymentPrefix", event.target.value.toUpperCase())} />
            <Input label="Vendor bill prefix" value={snapshot.settings.vendorBillPrefix} onChange={(event) => updateSettings("vendorBillPrefix", event.target.value.toUpperCase())} />
            <Input label="Purchase invoice prefix" value={snapshot.settings.purchaseInvoicePrefix} onChange={(event) => updateSettings("purchaseInvoicePrefix", event.target.value.toUpperCase())} />
            <Input label="Purchase credit note prefix" value={snapshot.settings.purchaseCreditNotePrefix} onChange={(event) => updateSettings("purchaseCreditNotePrefix", event.target.value.toUpperCase())} />
            <Input label="Receivable account" value={snapshot.settings.defaultReceivableAccountCode} onChange={(event) => updateSettings("defaultReceivableAccountCode", event.target.value)} />
            <Input label="Payable account" value={snapshot.settings.defaultPayableAccountCode} onChange={(event) => updateSettings("defaultPayableAccountCode", event.target.value)} />
            <Input label="Revenue account" value={snapshot.settings.defaultRevenueAccountCode} onChange={(event) => updateSettings("defaultRevenueAccountCode", event.target.value)} />
            <Input label="Expense account" value={snapshot.settings.defaultExpenseAccountCode} onChange={(event) => updateSettings("defaultExpenseAccountCode", event.target.value)} />
            <Input label="Cash account" value={snapshot.settings.defaultCashAccountCode} onChange={(event) => updateSettings("defaultCashAccountCode", event.target.value)} />
            <Input label="Customer advance account" value={snapshot.settings.defaultCustomerAdvanceAccountCode} onChange={(event) => updateSettings("defaultCustomerAdvanceAccountCode", event.target.value)} />
            <Input label="Supplier advance account" value={snapshot.settings.defaultSupplierAdvanceAccountCode} onChange={(event) => updateSettings("defaultSupplierAdvanceAccountCode", event.target.value)} />
            <Input label="VAT payable account" value={snapshot.settings.defaultVatPayableAccountCode} onChange={(event) => updateSettings("defaultVatPayableAccountCode", event.target.value)} />
            <Input label="VAT receivable account" value={snapshot.settings.defaultVatReceivableAccountCode} onChange={(event) => updateSettings("defaultVatReceivableAccountCode", event.target.value)} />
          </div>
        </Card> : null}
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {feedback ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" data-inspector-save-feedback={feedback.kind}>
          <p className="font-semibold text-emerald-900">{feedback.text}</p>
          <p className="mt-1 text-xs text-emerald-800">
            {feedback.kind === "save" ? "Saved to the current company settings snapshot." : "Asset upload completed."} Confirmed at {feedback.stamp}.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function nowLabel() {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}