"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { QuickCreateDialog } from "@/components/workflow/QuickCreateDialog";
import {
  createCustomFieldDefinition,
  createDocumentTemplate,
  listCompanyAssets,
  listCustomFieldDefinitions,
  listDocumentTemplates,
  previewDocumentTemplate,
  updateCustomFieldDefinition,
  updateDocumentTemplate,
  uploadCompanyAsset,
  type CompanyAssetRecord,
  type CustomFieldDefinitionRecord,
  type DocumentTemplateRecord,
} from "@/lib/workspace-api";

const documentTypeOptions = [
  "quotation",
  "proforma_invoice",
  "tax_invoice",
  "recurring_invoice",
  "cash_invoice",
  "api_invoice",
  "vendor_bill",
  "purchase_invoice",
  "purchase_order",
  "debit_note",
];

const standardFieldToggles = [
  { name: "PO", slug: "purchase_order", appliesTo: ["tax_invoice", "vendor_bill", "purchase_invoice"] },
  { name: "Reference", slug: "reference", appliesTo: ["quotation", "tax_invoice", "vendor_bill", "purchase_invoice"] },
  { name: "Project", slug: "project", appliesTo: ["quotation", "tax_invoice", "vendor_bill", "purchase_invoice"] },
];

const defaultTemplateDraft: Omit<DocumentTemplateRecord, "id" | "logoAssetUrl"> = {
  name: "",
  documentTypes: ["tax_invoice"],
  localeMode: "bilingual",
  accentColor: "#1f7a53",
  watermarkText: "",
  headerHtml: "<p>Prepared for review and approval.</p>",
  footerHtml: "<p>Questions? Contact the finance team for this document.</p>",
  settings: {
    header_layout: "split",
    footer_layout: "stacked",
    logo_position: "left",
    show_vat_section: true,
    show_totals: true,
    totals_style: "boxed",
    default_note: "Prepared by Gulf Hisab",
  },
  logoAssetId: null,
  isDefault: false,
  isActive: true,
};

const defaultFieldDraft = {
  name: "",
  slug: "",
  fieldType: "text",
  placement: "document",
  appliesTo: ["tax_invoice"],
  options: [] as string[],
  isActive: true,
};

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

export function TemplatesOverview() {
  const [templates, setTemplates] = useState<DocumentTemplateRecord[]>([]);
  const [assets, setAssets] = useState<CompanyAssetRecord[]>([]);
  const [customFields, setCustomFields] = useState<CustomFieldDefinitionRecord[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | "new">("new");
  const [templateDraft, setTemplateDraft] = useState<Omit<DocumentTemplateRecord, "id" | "logoAssetUrl">>(defaultTemplateDraft);
  const [previewDocumentType, setPreviewDocumentType] = useState("tax_invoice");
  const [previewHtml, setPreviewHtml] = useState("");
  const [fieldDraft, setFieldDraft] = useState(defaultFieldDraft);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([listDocumentTemplates(), listCompanyAssets(), listCustomFieldDefinitions()])
      .then(([nextTemplates, nextAssets, nextFields]) => {
        if (!active) {
          return;
        }

        setTemplates(nextTemplates);
        setAssets(nextAssets);
        setCustomFields(nextFields);

        if (nextTemplates[0]) {
          setDraftFromTemplate(nextTemplates[0]);
        }
      })
      .catch((nextError) => {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : "Template studio data could not be loaded.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingPreview(true);

    previewDocumentTemplate(templateDraft, previewDocumentType)
      .then((preview) => {
        if (active) {
          setPreviewHtml(preview.html);
        }
      })
      .catch((nextError) => {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : "Template preview could not be rendered.");
          setPreviewHtml("");
        }
      })
      .finally(() => {
        if (active) {
          setLoadingPreview(false);
        }
      });

    return () => {
      active = false;
    };
  }, [previewDocumentType, templateDraft]);

  function setDraftFromTemplate(template: DocumentTemplateRecord | null) {
    if (!template) {
      setSelectedTemplateId("new");
      setTemplateDraft(defaultTemplateDraft);
      return;
    }

    setSelectedTemplateId(template.id);
    setTemplateDraft({
      name: template.name,
      documentTypes: template.documentTypes,
      localeMode: template.localeMode,
      accentColor: template.accentColor,
      watermarkText: template.watermarkText,
      headerHtml: template.headerHtml,
      footerHtml: template.footerHtml,
      settings: template.settings,
      logoAssetId: template.logoAssetId,
      isDefault: template.isDefault,
      isActive: template.isActive,
    });
  }

  function updateTemplate<K extends keyof Omit<DocumentTemplateRecord, "id" | "logoAssetUrl">>(key: K, value: Omit<DocumentTemplateRecord, "id" | "logoAssetUrl">[K]) {
    setTemplateDraft((current) => ({ ...current, [key]: value }));
  }

  function updateSetting(key: string, value: string | number | boolean | null) {
    setTemplateDraft((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [key]: value,
      },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const result = selectedTemplateId === "new"
        ? await createDocumentTemplate(templateDraft)
        : await updateDocumentTemplate({ id: selectedTemplateId, ...templateDraft });

      setTemplates((current) => {
        if (selectedTemplateId === "new") {
          return [result, ...current];
        }

        return current.map((template) => (template.id === result.id ? result : template));
      });

      setSelectedTemplateId(result.id);
      setFeedback("Template studio changes were saved successfully.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Template changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAssetUpload(file: File | null) {
    if (!file) {
      return;
    }

    setUploading(true);
    setFeedback(null);
    setError(null);

    try {
      const asset = await uploadCompanyAsset({ type: "logo", usage: "branding", file });
      setAssets((current) => [asset, ...current]);
      setTemplateDraft((current) => ({ ...current, logoAssetId: asset.id }));
      setFeedback("Logo asset uploaded and attached to the current template.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Asset upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateField() {
    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const field = await createCustomFieldDefinition(fieldDraft);
      setCustomFields((current) => [field, ...current]);
      setFieldDraft(defaultFieldDraft);
      setFieldModalOpen(false);
      setFeedback("Custom field created successfully.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Custom field could not be created.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleField(field: CustomFieldDefinitionRecord) {
    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const result = await updateCustomFieldDefinition({ ...field, isActive: !field.isActive });
      setCustomFields((current) => current.map((item) => (item.id === result.id ? result : item)));
      setFeedback("Custom field status updated.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Custom field could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickFieldToggle(slug: string) {
    const existing = customFields.find((field) => field.slug === slug);

    if (existing) {
      await handleToggleField(existing);
      return;
    }

    const preset = standardFieldToggles.find((item) => item.slug === slug);

    if (!preset) {
      return;
    }

    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const created = await createCustomFieldDefinition({
        name: preset.name,
        slug: preset.slug,
        fieldType: "text",
        placement: "document",
        appliesTo: preset.appliesTo,
        options: [],
        isActive: true,
      });
      setCustomFields((current) => [created, ...current]);
      setFeedback(`${preset.name} field enabled.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Preset field could not be enabled.");
    } finally {
      setSaving(false);
    }
  }

  const selectedAsset = assets.find((asset) => asset.id === templateDraft.logoAssetId) ?? null;
  const activePresetFields = useMemo(() => new Set(customFields.filter((field) => field.isActive).map((field) => field.slug)), [customFields]);

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-white/70 bg-white/92 p-7 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Templates</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Structured template studio, real rendered preview, branding controls, and dynamic-field governance.</h1>
            <p className="mt-4 text-base leading-7 text-muted">Build the header, footer, logo placement, VAT block, totals block, and supporting custom fields in one studio, then preview the exact backend renderer before assigning the template to live documents.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setDraftFromTemplate(null)}>New template</Button>
            <Button onClick={handleSave} disabled={saving || uploading}>{saving ? "Saving template" : "Save template"}</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <Card className="rounded-[1.8rem] bg-white/92 p-6">
          <h2 className="text-2xl font-semibold text-ink">Templates</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Select an existing template or start a new one.</p>
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => setDraftFromTemplate(null)}
              className={[
                "block w-full rounded-[1.4rem] border px-4 py-3 text-left text-sm",
                selectedTemplateId === "new" ? "border-primary bg-primary-soft" : "border-line bg-surface-soft hover:bg-white",
              ].join(" ")}
            >
              <p className="font-semibold text-ink">New template</p>
              <p className="mt-1 text-muted">Start a fresh layout and assign its document types.</p>
            </button>
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setDraftFromTemplate(template)}
                className={[
                  "block w-full rounded-[1.4rem] border px-4 py-3 text-left text-sm",
                  selectedTemplateId === template.id ? "border-primary bg-primary-soft" : "border-line bg-surface-soft hover:bg-white",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">{template.name}</p>
                  {template.isDefault ? <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Default</span> : null}
                </div>
                <p className="mt-1 text-muted">{template.documentTypes.map(labelize).join(", ")}</p>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[1.8rem] bg-white/92 p-6">
            <div className="flex flex-col gap-5 border-b border-line pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-ink">Template editor</h2>
                <p className="mt-1 text-sm text-muted">Drive layout with structured settings first, then use header and footer HTML for the last layer of branding and copy.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {standardFieldToggles.map((field) => (
                  <button
                    key={field.slug}
                    type="button"
                    onClick={() => void handleQuickFieldToggle(field.slug)}
                    className={[
                      "rounded-full border px-3 py-2 text-sm font-semibold",
                      activePresetFields.has(field.slug) ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface-soft text-ink",
                    ].join(" ")}
                  >
                    {activePresetFields.has(field.slug) ? `Hide ${field.name}` : `Show ${field.name}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Input label="Template name" value={templateDraft.name} onChange={(event) => updateTemplate("name", event.target.value)} placeholder="Modern bilingual invoice" />
              <Input label="Accent color" value={templateDraft.accentColor} onChange={(event) => updateTemplate("accentColor", event.target.value)} placeholder="#1f7a53" />
              <div>
                <label htmlFor="locale-mode" className="mb-2.5 block text-sm font-semibold text-ink">Locale mode</label>
                <select id="locale-mode" value={templateDraft.localeMode} onChange={(event) => updateTemplate("localeMode", event.target.value)} className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                  <option value="bilingual">Bilingual</option>
                </select>
              </div>
              <Input label="Watermark text" value={templateDraft.watermarkText} onChange={(event) => updateTemplate("watermarkText", event.target.value)} placeholder="Draft" />
              <div>
                <label htmlFor="header-layout" className="mb-2.5 block text-sm font-semibold text-ink">Header layout</label>
                <select id="header-layout" value={String(templateDraft.settings.header_layout ?? "split")} onChange={(event) => updateSetting("header_layout", event.target.value)} className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                  <option value="split">Split</option>
                  <option value="stacked">Stacked</option>
                </select>
              </div>
              <div>
                <label htmlFor="footer-layout" className="mb-2.5 block text-sm font-semibold text-ink">Footer layout</label>
                <select id="footer-layout" value={String(templateDraft.settings.footer_layout ?? "stacked")} onChange={(event) => updateSetting("footer_layout", event.target.value)} className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                  <option value="stacked">Stacked</option>
                  <option value="columns">Columns</option>
                </select>
              </div>
              <div>
                <label htmlFor="logo-position" className="mb-2.5 block text-sm font-semibold text-ink">Logo placement</label>
                <select id="logo-position" value={String(templateDraft.settings.logo_position ?? "left")} onChange={(event) => updateSetting("logo_position", event.target.value)} className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div>
                <label htmlFor="totals-style" className="mb-2.5 block text-sm font-semibold text-ink">Totals style</label>
                <select id="totals-style" value={String(templateDraft.settings.totals_style ?? "boxed")} onChange={(event) => updateSetting("totals_style", event.target.value)} className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                  <option value="boxed">Boxed</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
              <div className="md:col-span-2 xl:col-span-4">
                <p className="mb-2.5 text-sm font-semibold text-ink">Document types</p>
                <div className="flex flex-wrap gap-2">
                  {documentTypeOptions.map((option) => {
                    const active = templateDraft.documentTypes.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateTemplate(
                          "documentTypes",
                          active
                            ? templateDraft.documentTypes.filter((item) => item !== option)
                            : [...templateDraft.documentTypes, option],
                        )}
                        className={[
                          "rounded-full border px-3 py-2 text-sm font-semibold",
                          active ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface-soft text-ink",
                        ].join(" ")}
                      >
                        {labelize(option)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="md:col-span-2 xl:col-span-2">
                <label htmlFor="header-html" className="mb-2.5 block text-sm font-semibold text-ink">Header HTML</label>
                <textarea id="header-html" rows={4} value={templateDraft.headerHtml} onChange={(event) => updateTemplate("headerHtml", event.target.value)} className="block w-full rounded-[1.4rem] border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />
              </div>
              <div className="md:col-span-2 xl:col-span-2">
                <label htmlFor="footer-html" className="mb-2.5 block text-sm font-semibold text-ink">Footer HTML</label>
                <textarea id="footer-html" rows={4} value={templateDraft.footerHtml} onChange={(event) => updateTemplate("footerHtml", event.target.value)} className="block w-full rounded-[1.4rem] border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />
              </div>
              <div className="md:col-span-2 xl:col-span-2">
                <Input label="Default note" value={String(templateDraft.settings.default_note ?? "")} onChange={(event) => updateSetting("default_note", event.target.value)} />
              </div>
              <div>
                <label htmlFor="logo-asset" className="mb-2.5 block text-sm font-semibold text-ink">Logo asset</label>
                <select id="logo-asset" value={templateDraft.logoAssetId ?? ""} onChange={(event) => updateTemplate("logoAssetId", event.target.value ? Number(event.target.value) : null)} className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                  <option value="">No logo</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>{asset.originalName}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface-soft px-4 py-3 text-sm font-semibold text-ink"><input type="checkbox" checked={Boolean(templateDraft.settings.show_vat_section ?? true)} onChange={(event) => updateSetting("show_vat_section", event.target.checked)} />Show VAT section</label>
              <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface-soft px-4 py-3 text-sm font-semibold text-ink"><input type="checkbox" checked={Boolean(templateDraft.settings.show_totals ?? true)} onChange={(event) => updateSetting("show_totals", event.target.checked)} />Show totals block</label>
              <div className="md:col-span-2 xl:col-span-2 flex flex-wrap gap-6 text-sm text-ink">
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={templateDraft.isDefault} onChange={(event) => updateTemplate("isDefault", event.target.checked)} />Default template</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={templateDraft.isActive} onChange={(event) => updateTemplate("isActive", event.target.checked)} />Active for use</label>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <Card className="rounded-[1.8rem] overflow-hidden bg-white/92 p-0">
              <div className="flex flex-col gap-4 border-b border-line px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-ink">Live preview</h2>
                  <p className="mt-1 text-sm text-muted">This is rendered by the backend template engine, not a mock card.</p>
                </div>
                <div className="w-full max-w-xs">
                  <label htmlFor="preview-document-type" className="mb-2.5 block text-sm font-semibold text-ink">Preview as</label>
                  <select id="preview-document-type" value={previewDocumentType} onChange={(event) => setPreviewDocumentType(event.target.value)} className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                    {documentTypeOptions.map((option) => (
                      <option key={option} value={option}>{labelize(option)}</option>
                    ))}
                  </select>
                </div>
              </div>
              {loadingPreview ? (
                <div className="px-6 py-10 text-sm text-muted">Rendering preview...</div>
              ) : previewHtml ? (
                <div className="bg-[#eef3ee] p-4 sm:p-6">
                  <div className="mx-auto max-w-[920px] overflow-hidden rounded-[1.5rem] border border-[#dfe6df] bg-white shadow-[0_28px_60px_-42px_rgba(17,32,24,0.22)]">
                    <div className="max-h-[72vh] overflow-auto p-4 sm:p-6" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  </div>
                </div>
              ) : (
                <div className="px-6 py-10 text-sm text-muted">Template preview unavailable.</div>
              )}
            </Card>

            <Card className="rounded-[1.8rem] bg-white/92 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-ink">Brand assets</h2>
                  <p className="mt-1 text-sm text-muted">Upload a logo and attach it to the current template.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-primary bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_32px_-18px_rgba(31,122,83,0.6)]">
                  {uploading ? "Uploading" : "Upload logo"}
                  <input type="file" className="hidden" accept=".svg,.png,.jpg,.jpeg,.webp" onChange={(event) => void handleAssetUpload(event.target.files?.[0] ?? null)} />
                </label>
              </div>
              {selectedAsset?.publicUrl ? (
                <div className="mt-5 flex h-24 items-center justify-center rounded-[1.4rem] border border-line bg-surface-soft p-4">
                  <span className="block h-14 w-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${selectedAsset.publicUrl})` }} />
                </div>
              ) : null}
              <div className="mt-5 space-y-3">
                {assets.length ? assets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-line bg-surface-soft px-4 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-ink">{asset.originalName}</p>
                      <p className="text-muted">{asset.mimeType} · {Math.round(asset.sizeBytes / 1024)} KB</p>
                    </div>
                    <Button variant="secondary" onClick={() => updateTemplate("logoAssetId", asset.id)}>Use</Button>
                  </div>
                )) : <div className="rounded-[1.4rem] border border-dashed border-line bg-surface-soft px-4 py-6 text-sm text-muted">No uploaded branding assets yet.</div>}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <Card className="rounded-[1.8rem] bg-white/92 p-6">
              <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-ink">Dynamic fields</h2>
                  <p className="mt-1 text-sm text-muted">Toggle common fields fast or open the modal to add a custom field definition.</p>
                </div>
                <Button variant="secondary" onClick={() => setFieldModalOpen(true)}>Add custom field</Button>
              </div>
              <div className="mt-5 space-y-3">
                {customFields.length ? customFields.map((field) => (
                  <div key={field.id} className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-line bg-surface-soft px-4 py-4 text-sm">
                    <div>
                      <p className="font-semibold text-ink">{field.name}</p>
                      <p className="mt-1 text-muted">{field.slug} · {field.fieldType} · {field.placement}</p>
                      <p className="mt-1 text-muted">{field.appliesTo.map(labelize).join(", ")}</p>
                    </div>
                    <Button variant="secondary" onClick={() => void handleToggleField(field)} disabled={saving}>
                      {field.isActive ? "Disable" : "Enable"}
                    </Button>
                  </div>
                )) : <div className="rounded-[1.4rem] border border-dashed border-line bg-surface-soft px-4 py-6 text-sm text-muted">No custom fields defined yet.</div>}
              </div>
            </Card>

            <Card className="rounded-[1.8rem] bg-white/92 p-6">
              <h2 className="text-2xl font-semibold text-ink">Field behavior</h2>
              <div className="mt-5 space-y-4 text-sm text-muted">
                <div className="rounded-[1.4rem] border border-line bg-surface-soft px-4 py-4">
                  <p className="font-semibold text-ink">Editor</p>
                  <p className="mt-2">Document and line fields appear automatically inside the invoice and bill editor when their placement and document types match.</p>
                </div>
                <div className="rounded-[1.4rem] border border-line bg-surface-soft px-4 py-4">
                  <p className="font-semibold text-ink">Preview</p>
                  <p className="mt-2">Active document-level custom fields now flow into the rendered preview and PDF output through the backend renderer.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <QuickCreateDialog open={fieldModalOpen} title="Add custom field" description="Create a new field definition and make it available immediately in matching document editors and previews." onClose={() => setFieldModalOpen(false)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Field name" value={fieldDraft.name} onChange={(event) => setFieldDraft((current) => ({ ...current, name: event.target.value }))} />
          <Input label="Slug" value={fieldDraft.slug} onChange={(event) => setFieldDraft((current) => ({ ...current, slug: event.target.value }))} placeholder="project_code" />
          <div>
            <label htmlFor="field-type" className="mb-2.5 block text-sm font-semibold text-ink">Field type</label>
            <select id="field-type" value={fieldDraft.fieldType} onChange={(event) => setFieldDraft((current) => ({ ...current, fieldType: event.target.value }))} className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="boolean">Boolean</option>
              <option value="select">Select</option>
            </select>
          </div>
          <div>
            <label htmlFor="field-placement" className="mb-2.5 block text-sm font-semibold text-ink">Placement</label>
            <select id="field-placement" value={fieldDraft.placement} onChange={(event) => setFieldDraft((current) => ({ ...current, placement: event.target.value }))} className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
              <option value="document">Document</option>
              <option value="line">Line</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Input label="Applies to" value={fieldDraft.appliesTo.join(",")} onChange={(event) => setFieldDraft((current) => ({ ...current, appliesTo: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} hint="Comma-separated document types" />
          </div>
          <div className="md:col-span-2">
            <Input label="Options" value={fieldDraft.options.join(",")} onChange={(event) => setFieldDraft((current) => ({ ...current, options: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} hint="Only used for select fields" />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={() => void handleCreateField()} disabled={saving || uploading}>{saving ? "Saving field" : "Create field"}</Button>
          </div>
        </div>
      </QuickCreateDialog>

      {error ? <div className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {feedback ? <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}
    </div>
  );
}