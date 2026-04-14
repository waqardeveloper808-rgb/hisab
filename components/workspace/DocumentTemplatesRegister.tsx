"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { ImportExportControls } from "@/components/workspace/ImportExportControls";
import { buildTemplateRegister } from "@/data/document-template-adapter";
import {
  createDocumentTemplate,
  listCompanyAssets,
  listDocumentTemplates,
  previewDocumentTemplate,
  uploadCompanyAsset,
  updateDocumentTemplate,
  type CompanyAssetRecord,
  type DocumentTemplateRecord,
} from "@/lib/workspace-api";

const sectionChoices = ["header", "seller-buyer", "items", "totals", "qr", "footer"];
const templatePresets = [
  { key: "classic", label: "Classic", detail: "Balanced header and seller-buyer structure.", settings: { layout: "classic", card_style: "soft", section_order: "header,seller-buyer,items,totals,qr,footer", watermark_enabled: true, watermark_logo_mode: "full-width" } },
  { key: "compact-grid", label: "Compact Grid", detail: "Dense invoice with concise spacing.", settings: { layout: "compact-grid", card_style: "outlined", section_order: "header,items,totals,qr,footer", watermark_enabled: true, watermark_logo_mode: "centered" } },
  { key: "statement", label: "Statement", detail: "Totals-ledger focus for repeat clients.", settings: { layout: "statement", card_style: "soft", section_order: "header,seller-buyer,totals,items,footer,qr", watermark_enabled: true, watermark_logo_mode: "centered" } },
  { key: "legal", label: "Legal", detail: "Structured blocks for audit-heavy documents.", settings: { layout: "legal", card_style: "outlined", section_order: "header,seller-buyer,items,totals,footer,qr", watermark_enabled: true, watermark_logo_mode: "disabled" } },
  { key: "ledger", label: "Ledger", detail: "Large line table with footer compliance emphasis.", settings: { layout: "ledger", card_style: "solid", section_order: "header,items,seller-buyer,totals,qr,footer", watermark_enabled: true, watermark_logo_mode: "full-width" } },
] as const;

function getSettingValue(template: DocumentTemplateRecord, key: string, fallback = "") {
  const value = template.settings[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

function getBooleanSetting(template: DocumentTemplateRecord, key: string, fallback = false) {
  const value = template.settings[key];
  return typeof value === "boolean" ? value : fallback;
}

function parseSectionOrder(template: DocumentTemplateRecord) {
  const configured = getSettingValue(template, "section_order", sectionChoices.join(","))
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is (typeof sectionChoices)[number] => sectionChoices.includes(value as (typeof sectionChoices)[number]));

  return [...new Set([...configured, ...sectionChoices])];
}

function formatLocale(localeMode: string) {
  if (localeMode === "bilingual") {
    return "Bilingual";
  }

  if (localeMode === "en") {
    return "English";
  }

  if (localeMode === "ar") {
    return "Arabic";
  }

  return localeMode;
}

function formatUpdated(id: number) {
  const month = ((id % 12) + 1).toString().padStart(2, "0");
  const day = ((id % 27) + 1).toString().padStart(2, "0");
  return `2026-${month}-${day}`;
}

function cloneTemplate(template: DocumentTemplateRecord): DocumentTemplateRecord {
  return {
    ...template,
    documentTypes: [...template.documentTypes],
    settings: { ...template.settings },
  };
}

export function DocumentTemplatesRegister() {
  const [templates, setTemplates] = useState<DocumentTemplateRecord[]>([]);
  const [assets, setAssets] = useState<CompanyAssetRecord[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [draft, setDraft] = useState<DocumentTemplateRecord | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [localeFilter, setLocaleFilter] = useState("all");

  useEffect(() => {
    let active = true;

    Promise.all([listDocumentTemplates(), listCompanyAssets()])
      .then(([records, companyAssets]) => {
        if (!active) {
          return;
        }

        setTemplates(records);
        setAssets(companyAssets);

        if (records[0]) {
          setSelectedTemplateId(records[0].id);
          setDraft(cloneTemplate(records[0]));
        }
      })
      .catch(() => {
        if (active) {
          setTemplates([]);
          setAssets([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!draft) {
      setPreviewHtml("");
      return () => {
        active = false;
      };
    }

    const previewTimer = window.setTimeout(() => {
      void previewDocumentTemplate({
        name: draft.name,
        documentTypes: draft.documentTypes,
        localeMode: draft.localeMode,
        accentColor: draft.accentColor,
        watermarkText: draft.watermarkText,
        headerHtml: draft.headerHtml,
        footerHtml: draft.footerHtml,
        settings: draft.settings,
        logoAssetId: draft.logoAssetId,
        isDefault: draft.isDefault,
        isActive: draft.isActive,
      }, draft.documentTypes[0] ?? "tax_invoice")
        .then((preview) => {
          if (active) {
            setPreviewHtml(preview.html);
          }
        })
        .catch(() => {
          if (active) {
            setPreviewHtml("");
          }
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(previewTimer);
    };
  }, [draft]);

  const groups = useMemo(() => buildTemplateRegister(templates), [templates]);
  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase();

    return groups.flatMap((group) => group.templates.filter((template) => {
      const matchesSearch = term
        ? template.name.toLowerCase().includes(term) || group.label.toLowerCase().includes(term)
        : true;
      const matchesLocale = localeFilter === "all" ? true : template.localeMode === localeFilter;

      return matchesSearch && matchesLocale;
    }).map((template) => ({ group, template })));
  }, [groups, localeFilter, search]);

  function selectTemplate(template: DocumentTemplateRecord) {
    setSelectedTemplateId(template.id);
    setDraft(cloneTemplate(template));
    setFeedback(null);
    setError(null);
  }

  function updateDraft(partial: Partial<DocumentTemplateRecord>) {
    setDraft((current) => (current ? { ...current, ...partial } : current));
  }

  function updateDraftSettings(partial: Record<string, string | number | boolean | null>) {
    setDraft((current) => current ? {
      ...current,
      settings: {
        ...current.settings,
        ...partial,
      },
    } : current);
  }

  function moveSection(section: string, direction: -1 | 1) {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const sections = parseSectionOrder(current);
      const index = sections.indexOf(section as (typeof sectionChoices)[number]);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= sections.length) {
        return current;
      }

      const nextSections = [...sections];
      [nextSections[index], nextSections[nextIndex]] = [nextSections[nextIndex], nextSections[index]];

      return {
        ...current,
        settings: {
          ...current.settings,
          section_order: nextSections.join(","),
        },
      };
    });
  }

  function applyPreset(presetKey: (typeof templatePresets)[number]["key"]) {
    const preset = templatePresets.find((item) => item.key === presetKey);

    if (!preset) {
      return;
    }

    updateDraftSettings(preset.settings);
    setFeedback(`${preset.label} preset applied.`);
  }

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    setFeedback(null);
    setError(null);

    try {
      const uploaded = await uploadCompanyAsset({
        type: "logo",
        usage: "logo",
        file,
      });

      setAssets((current) => [uploaded, ...current.filter((asset) => asset.id !== uploaded.id)]);
      setDraft((current) => current ? {
        ...current,
        logoAssetId: uploaded.id,
        logoAssetUrl: uploaded.publicUrl,
        accentColor: uploaded.metadata?.generatedTheme.primary ?? current.accentColor,
        settings: {
          ...current.settings,
          watermark_enabled: true,
          watermark_logo_mode: "full-width",
        },
      } : current);
      setFeedback(`${file.name} uploaded and applied to the template.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Logo upload failed.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleCreateTemplate() {
    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const documentType = draft?.documentTypes[0] ?? "tax_invoice";
      const created = await createDocumentTemplate({
        name: `New ${documentType.replaceAll("_", " ")} template`,
        documentTypes: [documentType],
        localeMode: draft?.localeMode ?? "bilingual",
        accentColor: draft?.accentColor ?? "#1f7a53",
        watermarkText: "",
        headerHtml: "",
        footerHtml: "",
        settings: {},
        logoAssetId: null,
        isDefault: false,
        isActive: true,
      });

      setTemplates((current) => [created, ...current]);
      setSelectedTemplateId(created.id);
      setDraft(cloneTemplate(created));
      setFeedback(`${created.name} created.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Template could not be created.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(template: DocumentTemplateRecord) {
    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const updated = await updateDocumentTemplate({ ...template, isDefault: true });

      setTemplates((current) => current.map((item) => ({
        ...item,
        isDefault: item.documentTypes.some((type) => updated.documentTypes.includes(type)) ? item.id === updated.id : item.isDefault,
      })));
      setSelectedTemplateId(updated.id);
      setDraft(cloneTemplate(updated));
      setFeedback(`${updated.name} is now the default.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Default template could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!draft) {
      return;
    }

    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const updated = await updateDocumentTemplate(draft);
      setTemplates((current) => current.map((item) => item.id === updated.id ? updated : item));
      setDraft(cloneTemplate(updated));
      setFeedback(`${updated.name} updated.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Template could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate(template: DocumentTemplateRecord) {
    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const duplicate = await createDocumentTemplate({
        name: `${template.name} Copy`,
        documentTypes: template.documentTypes,
        localeMode: template.localeMode,
        accentColor: template.accentColor,
        watermarkText: template.watermarkText,
        headerHtml: template.headerHtml,
        footerHtml: template.footerHtml,
        settings: template.settings,
        logoAssetId: template.logoAssetId,
        isDefault: false,
        isActive: template.isActive,
      });

      setTemplates((current) => [duplicate, ...current]);
      setSelectedTemplateId(duplicate.id);
      setDraft(cloneTemplate(duplicate));
      setFeedback(`${template.name} duplicated.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Template could not be duplicated.");
    } finally {
      setSaving(false);
    }
  }

  const logoAssets = useMemo(() => assets.filter((asset) => asset.usage === "logo" || asset.type === "logo"), [assets]);
  const selectedAsset = draft?.logoAssetId ? logoAssets.find((asset) => asset.id === draft.logoAssetId) ?? null : null;
  const draftSections = draft ? parseSectionOrder(draft) : sectionChoices;

  return (
    <div className="space-y-3" data-inspector-split-view="true">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Sales operations</p>
          <h1 className="text-lg font-semibold text-ink">Document templates</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportExportControls
            label="templates"
            exportFileName="document-templates.csv"
            rows={templates}
            columns={[
              { label: "Name", value: (row) => row.name },
              { label: "Type", value: (row) => row.documentTypes.join(", ") },
              { label: "Locale", value: (row) => row.localeMode },
              { label: "Default", value: (row) => row.isDefault },
              { label: "Active", value: (row) => row.isActive },
            ]}
          />
          <Button variant="secondary" onClick={() => void handleCreateTemplate()} disabled={saving}>{saving ? "Working" : "Create Template"}</Button>
          {draft ? <Button onClick={() => void handleSave()} disabled={saving}>{saving ? "Saving" : "Save"}</Button> : null}
        </div>
      </div>

      {feedback ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{feedback}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <Card className="overflow-hidden rounded-[1rem] bg-white/95 p-0">
        <div className="grid gap-2 border-b border-line px-3 py-3 md:grid-cols-[1.2fr_0.8fr_auto]">
          <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search template or document type" />
          <div>
            <label htmlFor="template-locale-filter" className="mb-2 block text-sm font-semibold text-ink">Language</label>
            <select id="template-locale-filter" value={localeFilter} onChange={(event) => setLocaleFilter(event.target.value)} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
              <option value="all">All languages</option>
              <option value="bilingual">Bilingual</option>
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </select>
          </div>
          <div className="grid items-end">
            <Button variant="secondary" onClick={() => {
              setSearch("");
              setLocaleFilter("all");
            }}>Reset</Button>
          </div>
        </div>

        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_38rem]">
          <div className="overflow-x-auto border-r border-line">
            <table className="min-w-full text-sm" data-inspector-row-clickable="true">
              <thead className="border-b border-line bg-surface-soft/70">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted">Template</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted">Language</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted">State</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted">Updated</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-3 py-4 text-sm text-muted" colSpan={6}>Loading templates…</td>
                  </tr>
                ) : filteredTemplates.length ? filteredTemplates.map(({ group, template }) => {
                  const active = selectedTemplateId === template.id;

                  return (
                    <tr key={`${group.documentType}-${template.id}`} className={["border-t border-line/70 align-top", active ? "bg-primary-soft/20" : ""].join(" ")}>
                      <td className="px-3 py-2.5">
                        <button type="button" className="text-left" onClick={() => selectTemplate(template)} data-inspector-row-clickable="true">
                          <span className="block font-semibold text-ink hover:text-primary">{template.name}</span>
                          <span className="mt-0.5 block text-xs text-muted">{template.isDefault ? "Default layout" : "Custom layout"}</span>
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-muted">{group.label}</td>
                      <td className="px-3 py-2.5 text-sm text-muted">{formatLocale(template.localeMode)}</td>
                      <td className="px-3 py-2.5 text-sm text-muted">{template.isDefault ? "Default" : template.isActive ? "Active" : "Inactive"}</td>
                      <td className="px-3 py-2.5 text-sm text-muted">{formatUpdated(template.id)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" onClick={() => selectTemplate(template)}>Edit</Button>
                          <Button size="sm" variant="secondary" onClick={() => void handleDuplicate(template)} disabled={saving}>Duplicate</Button>
                          <Button size="sm" variant="secondary" onClick={() => selectTemplate(template)}>Preview</Button>
                          <Button size="sm" variant="secondary" onClick={() => void handleSetDefault(template)} disabled={saving || template.isDefault}>Default</Button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td className="px-3 py-4 text-sm text-muted" colSpan={6}>No templates match the current filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-3" data-inspector-preview-surface="true">
            {draft ? (
              <>
                <Card className="rounded-[1rem] bg-white/95 p-4">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-ink">Template editor</h2>
                        <p className="mt-1 text-xs text-muted">Edit the active template and review the output without losing the register.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => void handleDuplicate(draft)} disabled={saving}>Duplicate</Button>
                        <Button size="sm" onClick={() => void handleSave()} disabled={saving}>{saving ? "Saving" : "Save"}</Button>
                      </div>
                    </div>
                    <Input label="Template name" value={draft.name} onChange={(event) => updateDraft({ name: event.target.value })} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label htmlFor="template-language" className="mb-2 block text-sm font-semibold text-ink">Language</label>
                        <select id="template-language" value={draft.localeMode} onChange={(event) => updateDraft({ localeMode: event.target.value })} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                          <option value="bilingual">Bilingual</option>
                          <option value="en">English</option>
                          <option value="ar">Arabic</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="template-status" className="mb-2 block text-sm font-semibold text-ink">Status</label>
                        <select id="template-status" value={draft.isActive ? "active" : "inactive"} onChange={(event) => updateDraft({ isActive: event.target.value === "active" })} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input label="Accent color" value={draft.accentColor} onChange={(event) => updateDraft({ accentColor: event.target.value })} />
                      <Input label="Watermark" value={draft.watermarkText} onChange={(event) => updateDraft({ watermarkText: event.target.value })} placeholder="Optional watermark" />
                    </div>
                    <div className="grid gap-3 md:grid-cols-5">
                      {templatePresets.map((preset) => (
                        <button key={preset.key} type="button" onClick={() => applyPreset(preset.key)} className={[
                          "rounded-xl border px-3 py-3 text-left transition",
                          getSettingValue(draft, "layout", "classic") === preset.settings.layout ? "border-primary bg-primary-soft/30" : "border-line bg-surface-soft hover:border-primary/40 hover:bg-white",
                        ].join(" ")}>
                          <div className="text-sm font-semibold text-ink">{preset.label}</div>
                          <div className="mt-1 text-xs text-muted">{preset.detail}</div>
                        </button>
                      ))}
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label htmlFor="template-layout" className="mb-2 block text-sm font-semibold text-ink">Layout</label>
                        <select id="template-layout" value={getSettingValue(draft, "layout", "classic")} onChange={(event) => updateDraftSettings({ layout: event.target.value })} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                          <option value="classic">Classic</option>
                          <option value="compact-grid">Compact grid</option>
                          <option value="statement">Statement</option>
                          <option value="legal">Legal</option>
                          <option value="ledger">Ledger</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="template-card-style" className="mb-2 block text-sm font-semibold text-ink">Card style</label>
                        <select id="template-card-style" value={getSettingValue(draft, "card_style", "soft")} onChange={(event) => updateDraftSettings({ card_style: event.target.value })} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                          <option value="soft">Soft</option>
                          <option value="outlined">Outlined</option>
                          <option value="solid">Solid</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-ink">Section order</label>
                      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {draftSections.map((section, index) => (
                          <div key={section} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface-soft px-3 py-2.5 text-sm text-ink">
                            <span className="font-semibold">{index + 1}. {section}</span>
                            <div className="flex gap-1">
                              <Button size="xs" variant="secondary" onClick={() => moveSection(section, -1)} disabled={index === 0}>Up</Button>
                              <Button size="xs" variant="secondary" onClick={() => moveSection(section, 1)} disabled={index === draftSections.length - 1}>Down</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="flex items-center gap-3 rounded-xl border border-line bg-surface-soft px-3 py-3 text-sm font-semibold text-ink">
                        <input type="checkbox" checked={getBooleanSetting(draft, "watermark_enabled", true)} onChange={(event) => updateDraftSettings({ watermark_enabled: event.target.checked })} />
                        Enable watermark
                      </label>
                      <div>
                        <label htmlFor="template-watermark-mode" className="mb-2 block text-sm font-semibold text-ink">Watermark mode</label>
                        <select id="template-watermark-mode" value={getSettingValue(draft, "watermark_logo_mode", "full-width")} onChange={(event) => updateDraftSettings({ watermark_logo_mode: event.target.value })} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                          <option value="full-width">Full width</option>
                          <option value="centered">Centered</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </div>
                    </div>
                    <div className="rounded-[1rem] border border-line bg-surface-soft p-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-ink">Logo intelligence</p>
                          <p className="mt-1 text-xs text-muted">Upload a logo to generate a transparent asset, dominant colors, and an auto-applied template theme.</p>
                        </div>
                        <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold text-ink">
                          {uploadingLogo ? "Uploading" : "Upload logo"}
                          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={uploadingLogo} onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void handleLogoUpload(file);
                            }
                            event.currentTarget.value = "";
                          }} />
                        </label>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-[12rem_1fr]">
                        <div className="rounded-xl border border-line bg-white p-3">
                          {selectedAsset?.publicUrl ? (
                            <Image
                              src={selectedAsset.publicUrl}
                              alt={selectedAsset.originalName}
                              width={192}
                              height={96}
                              unoptimized
                              className="h-24 w-full object-contain"
                            />
                          ) : <div className="flex h-24 items-center justify-center text-xs text-muted">No logo selected</div>}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label htmlFor="template-logo" className="mb-2 block text-sm font-semibold text-ink">Logo asset</label>
                            <select id="template-logo" value={draft.logoAssetId ?? ""} onChange={(event) => {
                              const nextId = event.target.value ? Number(event.target.value) : null;
                              const asset = nextId ? logoAssets.find((candidate) => candidate.id === nextId) ?? null : null;
                              setDraft((current) => current ? {
                                ...current,
                                logoAssetId: nextId,
                                logoAssetUrl: asset?.publicUrl ?? "",
                                accentColor: asset?.metadata?.generatedTheme.primary ?? current.accentColor,
                              } : current);
                            }} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                              <option value="">No logo</option>
                              {logoAssets.map((asset) => (
                                <option key={asset.id} value={asset.id}>{asset.originalName}</option>
                              ))}
                            </select>
                          </div>
                          {selectedAsset?.metadata ? (
                            <div className="rounded-xl border border-line bg-white px-3 py-3 text-sm text-muted">
                              <p><span className="font-semibold text-ink">Processed:</span> {selectedAsset.metadata.transparentBackground ? "Transparent PNG" : "Original asset"}</p>
                              <p className="mt-1"><span className="font-semibold text-ink">Size:</span> {selectedAsset.metadata.width} × {selectedAsset.metadata.height}</p>
                              <p className="mt-1"><span className="font-semibold text-ink">Theme:</span> {(selectedAsset.metadata.dominantColors || []).join(", ") || "Auto-derived"}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {(selectedAsset.metadata.dominantColors || []).map((color) => (
                                  <span key={color} className="inline-flex items-center gap-2 rounded-full border border-line px-2 py-1 text-[11px] font-semibold text-ink">
                                    <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                                    {color}
                                  </span>
                                ))}
                              </div>
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {Object.entries(selectedAsset.metadata.generatedTheme || {}).map(([token, color]) => (
                                  <button key={token} type="button" onClick={() => updateDraft({ accentColor: token === "primary" ? color : draft.accentColor, watermarkText: draft.watermarkText || selectedAsset.originalName })} className="flex items-center justify-between rounded-lg border border-line bg-surface-soft px-3 py-2 text-left text-[11px] font-semibold text-ink">
                                    <span>{token}</span>
                                    <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: color }} />{color}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="template-header" className="mb-2 block text-sm font-semibold text-ink">Header HTML</label>
                      <textarea id="template-header" value={draft.headerHtml} onChange={(event) => updateDraft({ headerHtml: event.target.value })} rows={4} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />
                    </div>
                    <div>
                      <label htmlFor="template-footer" className="mb-2 block text-sm font-semibold text-ink">Footer HTML</label>
                      <textarea id="template-footer" value={draft.footerHtml} onChange={(event) => updateDraft({ footerHtml: event.target.value })} rows={4} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />
                    </div>
                  </div>
                </Card>

                <Card className="overflow-hidden rounded-[1rem] bg-white/95 p-0">
                  <div className="border-b border-line px-4 py-3">
                    <h3 className="text-sm font-semibold text-ink">Live preview</h3>
                  </div>
                  <div className="bg-[#eef3ee] p-3">
                    <div className="max-h-[34rem] overflow-auto rounded-xl border border-[#dfe6df] bg-white p-3 text-sm">
                      {previewHtml ? <div dangerouslySetInnerHTML={{ __html: previewHtml }} /> : <p className="text-muted">Preview unavailable in current context.</p>}
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="rounded-[1rem] bg-white/95 p-4 text-sm text-muted">Select a template row to edit and preview the layout.</Card>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}