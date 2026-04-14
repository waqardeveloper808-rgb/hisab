"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { mapWorkspaceHref } from "@/lib/workspace-path";
import { getCompanySettings, updateCompanySettings, type CompanySettingsSnapshot } from "@/lib/workspace-api";

const emptyState: CompanySettingsSnapshot = {
  company: {
    legalName: "",
    tradeName: "",
    taxNumber: "",
    registrationNumber: "",
    baseCurrency: "SAR",
    locale: "en",
    timezone: "Asia/Riyadh",
  },
  settings: {
    defaultLanguage: "en",
    invoicePrefix: "INV",
    creditNotePrefix: "CRN",
    paymentPrefix: "PAY",
    vendorBillPrefix: "BILL",
    purchaseInvoicePrefix: "PINV",
    purchaseCreditNotePrefix: "PCRN",
    defaultReceivableAccountCode: "1100",
    defaultPayableAccountCode: "2100",
    defaultRevenueAccountCode: "4000",
    defaultExpenseAccountCode: "5100",
    defaultCashAccountCode: "1210",
    defaultCustomerAdvanceAccountCode: "2300",
    defaultSupplierAdvanceAccountCode: "1410",
    defaultVatPayableAccountCode: "2200",
    defaultVatReceivableAccountCode: "2210",
    zatcaEnvironment: "sandbox",
    numberingRules: {},
  },
};

export function SettingsOverview() {
  const { basePath } = useWorkspacePath();
  const [snapshot, setSnapshot] = useState<CompanySettingsSnapshot>(emptyState);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCompanySettings().then((result) => {
      if (result) {
        setSnapshot(result);
        setReady(true);
      }
    });
  }, []);

  function updateCompany<K extends keyof CompanySettingsSnapshot["company"]>(key: K, value: CompanySettingsSnapshot["company"][K]) {
    setSnapshot((current) => ({ ...current, company: { ...current.company, [key]: value } }));
  }

  function updateSettings<K extends keyof CompanySettingsSnapshot["settings"]>(key: K, value: CompanySettingsSnapshot["settings"][K]) {
    setSnapshot((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const result = await updateCompanySettings(snapshot);
      setSnapshot(result);
      setReady(true);
      setFeedback("Company settings were saved successfully.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Company settings could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-white/70 bg-white/92 p-7 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Settings</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Keep company identity and posting controls stable without cluttering the daily work modules.</h1>
            <p className="mt-4 text-base leading-7 text-muted">These values drive numbering, posting defaults, and compliance behavior across the workspace.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href={mapWorkspaceHref("/workspace/settings/templates", basePath)} variant="secondary">Open templates</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving settings" : "Save settings"}</Button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>{ready ? "Connected to company settings" : "Company settings are not available yet"}</span>
          <Link href={mapWorkspaceHref("/workspace/help/faq", basePath)} className="font-semibold text-primary hover:text-primary-hover">Settings guidance</Link>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[1.8rem] bg-white/92 p-6">
          <h2 className="text-2xl font-semibold text-ink">Company profile</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input label="Legal name" value={snapshot.company.legalName} onChange={(event) => updateCompany("legalName", event.target.value)} />
            <Input label="Trade name" value={snapshot.company.tradeName} onChange={(event) => updateCompany("tradeName", event.target.value)} />
            <Input label="Tax number" value={snapshot.company.taxNumber} onChange={(event) => updateCompany("taxNumber", event.target.value)} />
            <Input label="Registration number" value={snapshot.company.registrationNumber} onChange={(event) => updateCompany("registrationNumber", event.target.value)} />
            <Input label="Base currency" value={snapshot.company.baseCurrency} onChange={(event) => updateCompany("baseCurrency", event.target.value.toUpperCase())} />
            <Input label="Locale" value={snapshot.company.locale} onChange={(event) => updateCompany("locale", event.target.value)} />
            <div className="md:col-span-2">
              <Input label="Timezone" value={snapshot.company.timezone} onChange={(event) => updateCompany("timezone", event.target.value)} />
            </div>
          </div>
        </Card>

        <Card className="rounded-[1.8rem] bg-white/92 p-6">
          <h2 className="text-2xl font-semibold text-ink">Posting defaults</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input label="Default language" value={snapshot.settings.defaultLanguage} onChange={(event) => updateSettings("defaultLanguage", event.target.value)} />
            <Input label="ZATCA environment" value={snapshot.settings.zatcaEnvironment} onChange={(event) => updateSettings("zatcaEnvironment", event.target.value)} />
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
        </Card>
      </div>

      {error ? <div className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {feedback ? <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}
    </div>
  );
}