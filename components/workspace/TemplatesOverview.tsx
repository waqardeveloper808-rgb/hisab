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
  "credit_note",
  "debit_note",
  "recurring_invoice",
  "cash_invoice",
  "api_invoice",
  "vendor_bill",
  "purchase_invoice",
  "purchase_credit_note",
  "purchase_order",
];

const standardFieldToggles = [
  { name: "PO", slug: "purchase_order", appliesTo: ["tax_invoice", "vendor_bill", "purchase_invoice"] },
  { name: "Reference", slug: "reference", appliesTo: ["quotation", "tax_invoice", "vendor_bill", "purchase_invoice"] },
  { name: "Project", slug: "project", appliesTo: ["quotation", "tax_invoice", "vendor_bill", "purchase_invoice"] },
];

const sectionChoices = ["header", "title", "document-info", "delivery", "customer", "items", "totals", "notes", "footer"] as const;

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
    totals_style: "minimal",
    section_order: sectionChoices.join(","),
    hidden_sections: "",
    default_note: "Prepared with the selected company document settings.",
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

function parseSectionOrder(template: Omit<DocumentTemplateRecord, "id" | "logoAssetUrl">) {
  const configured = String(template.settings.section_order ?? sectionChoices.join(","))
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is (typeof sectionChoices)[number] => sectionChoices.includes(value as (typeof sectionChoices)[number]));

  const ordered = [...new Set(configured)];
  return sectionChoices.filter((section) => ordered.includes(section) || !configured.length);
}

function parseHiddenSections(template: Omit<DocumentTemplateRecord, "id" | "logoAssetUrl">) {
  return new Set(
    String(template.settings.hidden_sections ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter((value): value is (typeof sectionChoices)[number] => sectionChoices.includes(value as (typeof sectionChoices)[number])),
  );
}

function stringifyHiddenSections(hidden: Set<string>) {
  return sectionChoices.filter((section) => hidden.has(section)).join(",");
}

function parseSectionLayoutMap(template: Omit<DocumentTemplateRecord, "id" | "logoAssetUrl">) {
  try {
    const decoded = JSON.parse(String(template.settings.section_layout_map ?? "{}")) as Record<string, { column?: number; span?: number; row?: number }>;
    return decoded && typeof decoded === "object" ? decoded : {};
  } catch {
    return {};
  }
}

function stringifySectionLayoutMap(layout: Record<string, { column?: number; span?: number; row?: number }>) {
  return JSON.stringify(layout);
}

function WysiwygBlock({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
        <span className="text-[10px] text-muted">WYSIWYG block</span>
      </div>
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={(event) => onChange(event.currentTarget.innerHTML)}
        className="mt-2 min-h-[7rem] rounded-lg border border-line bg-surface-soft/20 px-3 py-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
        dangerouslySetInnerHTML={{ __html: value || `<p>${hint}</p>` }}
      />
    </div>
  );
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
  const [fullScreenEditor, setFullScreenEditor] = useState(false);
  const [draggingSection, setDraggingSection] = useState<(typeof sectionChoices)[number] | null>(null);

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

  function moveSection(section: (typeof sectionChoices)[number], direction: -1 | 1) {
    const sections = parseSectionOrder(templateDraft);
    const index = sections.indexOf(section);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= sections.length) {
      return;
    }

    const nextSections = [...sections];
    [nextSections[index], nextSections[nextIndex]] = [nextSections[nextIndex], nextSections[index]];
    updateSetting("section_order", nextSections.join(","));
  }

  function toggleSectionVisibility(section: (typeof sectionChoices)[number]) {
    const hidden = parseHiddenSections(templateDraft);
    if (hidden.has(section)) {
      hidden.delete(section);
    } else {
      hidden.add(section);
    }
    updateSetting("hidden_sections", stringifyHiddenSections(hidden));
  }

  function reorderSection(section: (typeof sectionChoices)[number], target: (typeof sectionChoices)[number]) {
    if (section === target) {
      return;
    }

    const sections = parseSectionOrder(templateDraft).filter((entry) => entry !== section);
    const targetIndex = sections.indexOf(target);
    if (targetIndex < 0) {
      return;
    }
    sections.splice(targetIndex, 0, section);
    updateSetting("section_order", sections.join(","));
  }

  function updateSectionLayout(section: (typeof sectionChoices)[number], key: "column" | "span" | "row", value: number) {
    const current = parseSectionLayoutMap(templateDraft);
    current[section] = {
      ...(current[section] ?? {}),
      [key]: value,
    };
    updateSetting("section_layout_map", stringifySectionLayoutMap(current));
  }

  const sectionLayoutMap = useMemo(() => parseSectionLayoutMap(templateDraft), [templateDraft]);

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
  const draftSections = useMemo(() => parseSectionOrder(templateDraft), [templateDraft]);
  const hiddenSections = useMemo(() => parseHiddenSections(templateDraft), [templateDraft]);

  return (
    <div className={["space-y-3", fullScreenEditor ? "fixed inset-0 z-50 overflow-auto bg-[#edf3ef] p-3" : ""].join(" ")} data-inspector-split-view="true">
      <Card className="rounded-xl border-white/70 bg-white/95 p-3 shadow-[0_22px_40px_-34px_rgba(17,32,24,0.18)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Templates</p>
            <h1 className="mt-1.5 text-[1.5rem] font-semibold tracking-tight text-ink">Canvas-first template studio with compact controls and print-true layout orchestration.</h1>
            <p className="mt-1 text-xs leading-5 text-muted">Operate like a production design surface: reorder sections, adjust columns, scale typography, and edit content blocks next to the live rendered canvas.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setFullScreenEditor((current) => !current)}>{fullScreenEditor ? "Exit Full Screen" : "Full Screen Editor"}</Button>
            <Button variant="secondary" onClick={() => setDraftFromTemplate(null)}>New template</Button>
            <Button onClick={handleSave} disabled={saving || uploading}>{saving ? "Saving template" : "Save template"}</Button>
          </div>
        </div>
      </Card>

      <div className={["grid gap-3", fullScreenEditor ? "xl:grid-cols-[16rem_minmax(0,1fr)_20rem]" : "xl:grid-cols-[minmax(0,1.5fr)_18rem]"].join(" ")}>
        <Card className={["rounded-xl bg-white/95 p-3 xl:self-start", fullScreenEditor ? "order-1 xl:sticky xl:top-3" : "order-2 xl:sticky xl:top-3"].join(" ")}>
          <h2 className="text-lg font-semibold text-ink">Templates</h2>
          <p className="mt-1 text-xs leading-5 text-muted">Select an existing template or start a new one.</p>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => setDraftFromTemplate(null)}
              className={[
                "block w-full rounded-lg border px-3 py-2 text-left text-sm",
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
                  "block w-full rounded-lg border px-3 py-2 text-left text-sm",
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

        <div className={["space-y-3", fullScreenEditor ? "order-2" : "order-1"].join(" ")}>
          <Card className="rounded-xl bg-white/95 p-3">
            <div className="flex flex-col gap-3 border-b border-line pb-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink">Studio tools</h2>
                <p className="mt-1 text-xs text-muted">The control rail is compact by design. Keep the canvas dominant while changing structure, typography, and rendering behavior.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {standardFieldToggles.map((field) => (
                  <button
                    key={field.slug}
                    type="button"
                    onClick={() => void handleQuickFieldToggle(field.slug)}
                    className={[
                      "rounded-full border px-2.5 py-1 text-xs font-semibold",
                      activePresetFields.has(field.slug) ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface-soft text-ink",
                    ].join(" ")}
                  >
                    {activePresetFields.has(field.slug) ? `Hide ${field.name}` : `Show ${field.name}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.85fr)]">
              <div className="space-y-3">
                <div className="rounded-xl border border-line bg-surface-soft/45 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Section layout</p>
                      <h3 className="mt-1 text-sm font-semibold text-ink">Visual document stack</h3>
                    </div>
                    <div className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-muted">{draftSections.length - hiddenSections.size} live sections</div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {draftSections.map((section, index) => {
                      const hidden = hiddenSections.has(section);
                      const layout = sectionLayoutMap[section] ?? {};
                      return (
                        <div
                          key={section}
                          draggable
                          onDragStart={() => setDraggingSection(section)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => {
                            if (draggingSection) {
                              reorderSection(draggingSection, section);
                            }
                            setDraggingSection(null);
                          }}
                          onDragEnd={() => setDraggingSection(null)}
                          className={["grid gap-2 rounded-lg border px-3 py-2", hidden ? "border-line bg-white/70 opacity-70" : "border-line bg-white"].join(" ")}
                        >
                          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
                          <div className="rounded-md bg-surface-soft px-2 py-1 text-[11px] font-semibold text-muted">{index + 1}</div>
                          <div>
                            <p className="text-sm font-semibold text-ink">{labelize(section)}</p>
                            <p className="text-[11px] text-muted">{hidden ? "Hidden from output" : "Visible in rendered document"}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => moveSection(section, -1)} className="rounded-md border border-line bg-surface-soft px-2 py-1 text-[11px] font-semibold text-ink">Up</button>
                            <button type="button" onClick={() => moveSection(section, 1)} className="rounded-md border border-line bg-surface-soft px-2 py-1 text-[11px] font-semibold text-ink">Down</button>
                            <button type="button" onClick={() => toggleSectionVisibility(section)} className={["rounded-md border px-2 py-1 text-[11px] font-semibold", hidden ? "border-line bg-white text-ink" : "border-primary/20 bg-primary-soft text-primary"].join(" ")}>{hidden ? "Show" : "Hide"}</button>
                          </div>
                          </div>
                          <div className="grid gap-2 md:grid-cols-3">
                            <label className="text-[11px] text-muted">Column
                              <select value={String(layout.column ?? 1)} onChange={(event) => updateSectionLayout(section, "column", Number(event.target.value))} className="mt-1 block h-8 w-full rounded-md border border-line bg-white px-2 text-xs text-ink">
                                {[1, 2, 3].map((value) => <option key={value} value={value}>{value}</option>)}
                              </select>
                            </label>
                            <label className="text-[11px] text-muted">Span
                              <select value={String(layout.span ?? 1)} onChange={(event) => updateSectionLayout(section, "span", Number(event.target.value))} className="mt-1 block h-8 w-full rounded-md border border-line bg-white px-2 text-xs text-ink">
                                {[1, 2, 3].map((value) => <option key={value} value={value}>{value}</option>)}
                              </select>
                            </label>
                            <label className="text-[11px] text-muted">Row
                              <input type="number" min="1" value={layout.row ?? index + 1} onChange={(event) => updateSectionLayout(section, "row", Number(event.target.value) || index + 1)} className="mt-1 block h-8 w-full rounded-md border border-line bg-white px-2 text-xs text-ink" />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
              <Input label="Template name" value={templateDraft.name} onChange={(event) => updateTemplate("name", event.target.value)} placeholder="Modern bilingual invoice" />
              <Input label="Accent color" value={templateDraft.accentColor} onChange={(event) => updateTemplate("accentColor", event.target.value)} placeholder="#1f7a53" />
              <div>
                <label htmlFor="locale-mode" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">Locale mode</label>
                <select id="locale-mode" value={templateDraft.localeMode} onChange={(event) => updateTemplate("localeMode", event.target.value)} className="block h-[var(--control-input)] w-full rounded-lg border border-line-strong bg-white px-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10">
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                  <option value="bilingual">Bilingual</option>
                </select>
              </div>
              <Input label="Watermark text" value={templateDraft.watermarkText} onChange={(event) => updateTemplate("watermarkText", event.target.value)} placeholder="Draft" />
              <div>
                <label htmlFor="header-layout" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">Header layout</label>
                <select id="header-layout" value={String(templateDraft.settings.header_layout ?? "split")} onChange={(event) => updateSetting("header_layout", event.target.value)} className="block h-[var(--control-input)] w-full rounded-lg border border-line-strong bg-white px-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10">
                  <option value="split">Split</option>
                  <option value="stacked">Stacked</option>
                </select>
              </div>
              <div>
                <label htmlFor="footer-layout" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">Footer layout</label>
                <select id="footer-layout" value={String(templateDraft.settings.footer_layout ?? "stacked")} onChange={(event) => updateSetting("footer_layout", event.target.value)} className="block h-[var(--control-input)] w-full rounded-lg border border-line-strong bg-white px-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10">
                  <option value="stacked">Stacked</option>
                  <option value="columns">Columns</option>
                </select>
              </div>
              <div>
                <label htmlFor="logo-position" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">Logo placement</label>
                <select id="logo-position" value={String(templateDraft.settings.logo_position ?? "left")} onChange={(event) => updateSetting("logo_position", event.target.value)} className="block h-[var(--control-input)] w-full rounded-lg border border-line-strong bg-white px-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10">
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div>
                <label htmlFor="title-align" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">Title align</label>
                <select id="title-align" value={String(templateDraft.settings.title_align ?? "center")} onChange={(event) => updateSetting("title_align", event.target.value)} className="block h-[var(--control-input)] w-full rounded-lg border border-line-strong bg-white px-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10">
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div>
                <label htmlFor="totals-style" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">Totals style</label>
                <select id="totals-style" value={String(templateDraft.settings.totals_style ?? "boxed")} onChange={(event) => updateSetting("totals_style", event.target.value)} className="block h-[var(--control-input)] w-full rounded-lg border border-line-strong bg-white px-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10">
                  <option value="boxed">Boxed</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
              <Input label="Font size" type="number" value={String(templateDraft.settings.font_size ?? 12)} onChange={(event) => updateSetting("font_size", event.target.value)} />
              <Input label="Title size" type="number" value={String(templateDraft.settings.title_font_size ?? 24)} onChange={(event) => updateSetting("title_font_size", event.target.value)} />
              <Input label="Spacing scale" type="number" value={String(templateDraft.settings.spacing_scale ?? 0.9)} onChange={(event) => updateSetting("spacing_scale", event.target.value)} />
              <Input label="Grid columns" type="number" value={String(templateDraft.settings.section_grid_columns ?? 2)} onChange={(event) => updateSetting("section_grid_columns", event.target.value)} />
              <Input label="Section gap" type="number" value={String(templateDraft.settings.section_gap ?? 10)} onChange={(event) => updateSetting("section_gap", event.target.value)} />
              <Input label="Canvas padding" type="number" value={String(templateDraft.settings.canvas_padding ?? 16)} onChange={(event) => updateSetting("canvas_padding", event.target.value)} />
              <div className="md:col-span-2 xl:col-span-2">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">Document types</p>
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
                          "rounded-full border px-2.5 py-1 text-xs font-semibold",
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
                <Input label="Default note" value={String(templateDraft.settings.default_note ?? "")} onChange={(event) => updateSetting("default_note", event.target.value)} />
              </div>
              <div>
                <label htmlFor="logo-asset" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">Logo asset</label>
                <select id="logo-asset" value={templateDraft.logoAssetId ?? ""} onChange={(event) => updateTemplate("logoAssetId", event.target.value ? Number(event.target.value) : null)} className="block h-[var(--control-input)] w-full rounded-lg border border-line-strong bg-white px-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10">
                  <option value="">No logo</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>{asset.originalName}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 rounded-lg border border-line bg-surface-soft px-3 py-2 text-sm font-semibold text-ink"><input type="checkbox" checked={Boolean(templateDraft.settings.show_vat_section ?? true)} onChange={(event) => updateSetting("show_vat_section", event.target.checked)} />Show VAT section</label>
              <label className="flex items-center gap-2 rounded-lg border border-line bg-surface-soft px-3 py-2 text-sm font-semibold text-ink"><input type="checkbox" checked={Boolean(templateDraft.settings.show_totals ?? true)} onChange={(event) => updateSetting("show_totals", event.target.checked)} />Show totals block</label>
              <div className="md:col-span-2 xl:col-span-2 flex flex-wrap gap-4 text-sm text-ink">
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={templateDraft.isDefault} onChange={(event) => updateTemplate("isDefault", event.target.checked)} />Default template</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={templateDraft.isActive} onChange={(event) => updateTemplate("isActive", event.target.checked)} />Active for use</label>
              </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <WysiwygBlock label="Header content" value={templateDraft.headerHtml} onChange={(value) => updateTemplate("headerHtml", value)} hint="Add custom header copy, approval notes, or branding statements." />
                  <WysiwygBlock label="Footer content" value={templateDraft.footerHtml} onChange={(value) => updateTemplate("footerHtml", value)} hint="Add signatures, legal text, or contact notes." />
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-line bg-surface-soft/45 p-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Canvas behavior</p>
                  <h3 className="mt-1 text-sm font-semibold text-ink">Print-first controls</h3>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
                    <p className="font-semibold text-ink">Bilingual balance</p>
                    <p className="mt-1 text-xs text-muted">English stays left, Arabic stays right, and totals remain dominant regardless of section order.</p>
                  </div>
                  <div className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
                    <p className="font-semibold text-ink">Rendered output</p>
                    <p className="mt-1 text-xs text-muted">The canvas preview uses the same renderer path as PDF and document delivery.</p>
                  </div>
                  <div className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
                    <p className="font-semibold text-ink">Linked tools</p>
                    <p className="mt-1 text-xs text-muted">Field toggles, assets, and section visibility all update the template record directly.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className={["grid gap-3", fullScreenEditor ? "xl:grid-cols-[minmax(0,1fr)]" : "xl:grid-cols-[minmax(0,1.55fr)_19rem]"].join(" ")}>
            <Card className="rounded-xl overflow-hidden bg-white/95 p-0">
              <div className="flex flex-col gap-3 border-b border-line px-4 py-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-ink">Canvas preview</h2>
                  <p className="mt-1 text-xs text-muted">Live rendered output for print, PDF, and document delivery. Use fullscreen mode to design directly around this canvas.</p>
                </div>
                <div className="w-full max-w-xs">
                  <label htmlFor="preview-document-type" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">Preview as</label>
                  <select id="preview-document-type" value={previewDocumentType} onChange={(event) => setPreviewDocumentType(event.target.value)} className="block h-[var(--control-input)] w-full rounded-lg border border-line-strong bg-white px-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10">
                    {documentTypeOptions.map((option) => (
                      <option key={option} value={option}>{labelize(option)}</option>
                    ))}
                  </select>
                </div>
              </div>
              {loadingPreview ? (
                <div className="px-6 py-10 text-sm text-muted">Rendering preview...</div>
              ) : previewHtml ? (
                <div className="bg-[#edf3ee] p-2 sm:p-2.5">
                  <div className="mx-auto max-w-[1100px] overflow-hidden rounded-xl border border-[#dfe6df] bg-white shadow-[0_30px_70px_-46px_rgba(17,32,24,0.28)]">
                    <div className={["overflow-auto", fullScreenEditor ? "max-h-[84vh] p-2.5" : "max-h-[78vh] p-2 sm:p-2.5"].join(" ")} dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  </div>
                </div>
              ) : (
                <div className="px-6 py-10 text-sm text-muted">Template preview unavailable.</div>
              )}
            </Card>

            {!fullScreenEditor ? <Card className="rounded-xl bg-white/95 p-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-ink">Brand assets</h2>
                  <p className="mt-1 text-xs text-muted">Upload a logo and attach it to the current template.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-semibold text-white shadow-[0_16px_32px_-18px_rgba(31,122,83,0.6)]">
                  {uploading ? "Uploading" : "Upload logo"}
                  <input type="file" className="hidden" accept=".svg,.png,.jpg,.jpeg,.webp" onChange={(event) => void handleAssetUpload(event.target.files?.[0] ?? null)} />
                </label>
              </div>
              {selectedAsset?.publicUrl ? (
                <div className="mt-3 flex h-20 items-center justify-center rounded-lg border border-line bg-surface-soft p-3">
                  <span className="block h-14 w-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${selectedAsset.publicUrl})` }} />
                </div>
              ) : null}
              <div className="mt-3 space-y-2">
                {assets.length ? assets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-soft px-3 py-2 text-sm">
                    <div>
                      <p className="font-semibold text-ink">{asset.originalName}</p>
                      <p className="text-muted">{asset.mimeType} · {Math.round(asset.sizeBytes / 1024)} KB</p>
                    </div>
                    <Button variant="secondary" onClick={() => updateTemplate("logoAssetId", asset.id)}>Use</Button>
                  </div>
                )) : <div className="rounded-lg border border-dashed border-line bg-surface-soft px-4 py-6 text-sm text-muted">No uploaded branding assets yet.</div>}
              </div>
            </Card> : null}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <Card className="rounded-xl bg-white/95 p-3">
              <div className="flex items-center justify-between gap-4 border-b border-line pb-3">
                <div>
                  <h2 className="text-lg font-semibold text-ink">Dynamic fields</h2>
                  <p className="mt-1 text-xs text-muted">Toggle common fields fast or open the modal to add a custom field definition.</p>
                </div>
                <Button variant="secondary" onClick={() => setFieldModalOpen(true)}>Add custom field</Button>
              </div>
              <div className="mt-3 space-y-2">
                {customFields.length ? customFields.map((field) => (
                  <div key={field.id} className="flex items-start justify-between gap-4 rounded-lg border border-line bg-surface-soft px-3 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-ink">{field.name}</p>
                      <p className="mt-1 text-muted">{field.slug} · {field.fieldType} · {field.placement}</p>
                      <p className="mt-1 text-muted">{field.appliesTo.map(labelize).join(", ")}</p>
                    </div>
                    <Button variant="secondary" onClick={() => void handleToggleField(field)} disabled={saving}>
                      {field.isActive ? "Disable" : "Enable"}
                    </Button>
                  </div>
                )) : <div className="rounded-lg border border-dashed border-line bg-surface-soft px-4 py-6 text-sm text-muted">No custom fields defined yet.</div>}
              </div>
            </Card>

            <Card className="rounded-xl bg-white/95 p-3">
              <h2 className="text-lg font-semibold text-ink">Field behavior</h2>
              <div className="mt-3 space-y-3 text-sm text-muted">
                <div className="rounded-lg border border-line bg-surface-soft px-3 py-3">
                  <p className="font-semibold text-ink">Editor</p>
                  <p className="mt-2">Document and line fields appear automatically inside the invoice and bill editor when their placement and document types match.</p>
                </div>
                <div className="rounded-lg border border-line bg-surface-soft px-3 py-3">
                  <p className="font-semibold text-ink">Preview</p>
                  <p className="mt-2">Active document-level custom fields now flow into the rendered preview and PDF output through the backend renderer.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <QuickCreateDialog open={fieldModalOpen} title="Add custom field" description="Create a new field definition and make it available immediately in matching document editors and previews." onClose={() => setFieldModalOpen(false)}>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Field name" value={fieldDraft.name} onChange={(event) => setFieldDraft((current) => ({ ...current, name: event.target.value }))} />
          <Input label="Slug" value={fieldDraft.slug} onChange={(event) => setFieldDraft((current) => ({ ...current, slug: event.target.value }))} placeholder="project_code" />
          <div>
            <label htmlFor="field-type" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">Field type</label>
            <select id="field-type" value={fieldDraft.fieldType} onChange={(event) => setFieldDraft((current) => ({ ...current, fieldType: event.target.value }))} className="block h-[var(--control-input)] w-full rounded-lg border border-line-strong bg-white px-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10">
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="boolean">Boolean</option>
              <option value="select">Select</option>
            </select>
          </div>
          <div>
            <label htmlFor="field-placement" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">Placement</label>
            <select id="field-placement" value={fieldDraft.placement} onChange={(event) => setFieldDraft((current) => ({ ...current, placement: event.target.value }))} className="block h-[var(--control-input)] w-full rounded-lg border border-line-strong bg-white px-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10">
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

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {feedback ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}
    </div>
  );
}