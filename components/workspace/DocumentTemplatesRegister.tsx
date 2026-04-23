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

const sectionChoices = ["header", "title", "document-info", "delivery", "customer", "items", "totals", "notes", "footer"];
const fontChoices = ["Segoe UI", "Arial", "Georgia", "Tahoma", "Times New Roman"];
const templatePresets = [
  { key: "classic_corporate", label: "Classic Corporate", detail: "Dense formal document with thin borders, tight spacing, and accountant-first hierarchy.", settings: { layout: "classic_corporate", card_style: "none", section_order: "header,title,document-info,delivery,customer,items,totals,notes,footer", section_grid_columns: 2, section_layout_map: JSON.stringify({ header: { row: 1, column: 1, span: 2 }, title: { row: 2, column: 1, span: 2 }, "document-info": { row: 3, column: 1, span: 1 }, delivery: { row: 3, column: 2, span: 1 }, customer: { row: 4, column: 1, span: 1 }, totals: { row: 4, column: 2, span: 1 }, items: { row: 5, column: 1, span: 2 }, notes: { row: 6, column: 1, span: 1 }, footer: { row: 6, column: 2, span: 1 } }), watermark_enabled: true, watermark_logo_mode: "full-width", font_family: "Segoe UI", font_size: 12, title_font_size: 26, spacing_scale: 0.9, section_gap: 8, canvas_padding: 14, top_bar_height: 3, title_align: "center", body_align: "left", show_qr: true, show_footer: true } },
  { key: "modern_carded", label: "Modern Carded", detail: "Cleaner visual separation with softer panels and slightly more breathing room while remaining document-grade.", settings: { layout: "modern_carded", card_style: "outlined", section_order: "header,title,document-info,delivery,customer,items,totals,notes,footer", section_grid_columns: 2, section_layout_map: JSON.stringify({ header: { row: 1, column: 1, span: 2 }, title: { row: 2, column: 1, span: 2 }, customer: { row: 3, column: 1, span: 1 }, "document-info": { row: 3, column: 2, span: 1 }, items: { row: 4, column: 1, span: 2 }, notes: { row: 5, column: 1, span: 1 }, totals: { row: 5, column: 2, span: 1 }, delivery: { row: 6, column: 1, span: 2 }, footer: { row: 7, column: 1, span: 2 } }), watermark_enabled: true, watermark_logo_mode: "centered", font_family: "Segoe UI", font_size: 12, title_font_size: 27, spacing_scale: 1.04, section_gap: 14, canvas_padding: 20, top_bar_height: 5, title_align: "center", body_align: "left", show_qr: true, show_footer: true } },
  { key: "industrial_supply", label: "Industrial / Supply Chain", detail: "Data-heavy operational document with stronger tables, compact notes, and minimal decorative treatment.", settings: { layout: "industrial_supply", card_style: "none", section_order: "header,title,document-info,delivery,customer,items,totals,notes,footer", section_grid_columns: 3, section_layout_map: JSON.stringify({ header: { row: 1, column: 1, span: 3 }, title: { row: 2, column: 1, span: 3 }, "document-info": { row: 3, column: 1, span: 1 }, delivery: { row: 3, column: 2, span: 1 }, customer: { row: 3, column: 3, span: 1 }, items: { row: 4, column: 1, span: 3 }, notes: { row: 5, column: 1, span: 2 }, totals: { row: 5, column: 3, span: 1 }, footer: { row: 6, column: 1, span: 3 } }), watermark_enabled: true, watermark_logo_mode: "full-width", font_family: "Tahoma", font_size: 12, title_font_size: 25, spacing_scale: 0.9, section_gap: 10, canvas_padding: 16, top_bar_height: 4, title_align: "center", body_align: "left", show_qr: true, show_footer: true } },
] as const;

type SectionLayoutSetting = {
  row: number;
  column: number;
  span: number;
};

function buildDefaultSectionLayout(columns: number): Record<string, SectionLayoutSetting> {
  if (columns >= 3) {
    return {
      header: { row: 1, column: 1, span: 3 },
      title: { row: 2, column: 1, span: 3 },
      "document-info": { row: 3, column: 1, span: 1 },
      delivery: { row: 3, column: 2, span: 1 },
      customer: { row: 3, column: 3, span: 1 },
      items: { row: 4, column: 1, span: 3 },
      notes: { row: 5, column: 1, span: 2 },
      totals: { row: 5, column: 3, span: 1 },
      footer: { row: 6, column: 1, span: 3 },
    };
  }

  return {
    header: { row: 1, column: 1, span: columns },
    title: { row: 2, column: 1, span: columns },
    "document-info": { row: 3, column: 1, span: 1 },
    delivery: { row: 3, column: Math.min(2, columns), span: 1 },
    customer: { row: 4, column: 1, span: 1 },
    totals: { row: 4, column: Math.min(2, columns), span: 1 },
    items: { row: 5, column: 1, span: columns },
    notes: { row: 6, column: 1, span: 1 },
    footer: { row: 6, column: Math.min(2, columns), span: Math.max(1, columns - 1) },
  };
}

function parseSectionLayout(template: DocumentTemplateRecord) {
  const columns = Math.max(1, Number(getSettingValue(template, "section_grid_columns", "2")) || 2);
  const fallback = buildDefaultSectionLayout(columns);
  const raw = getSettingValue(template, "section_layout_map", "");

  if (!raw.trim()) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, Partial<SectionLayoutSetting>>;

    return sectionChoices.reduce<Record<string, SectionLayoutSetting>>((accumulator, section) => {
      const candidate = parsed[section] ?? {};
      const base = fallback[section];
      accumulator[section] = {
        row: Math.max(1, Number(candidate.row) || base.row),
        column: Math.max(1, Number(candidate.column) || base.column),
        span: Math.max(1, Number(candidate.span) || base.span),
      };
      return accumulator;
    }, {});
  } catch {
    return fallback;
  }
}

function stringifySectionLayout(layout: Record<string, SectionLayoutSetting>) {
  return JSON.stringify(sectionChoices.reduce<Record<string, SectionLayoutSetting>>((accumulator, section) => {
    accumulator[section] = layout[section] ?? { row: 1, column: 1, span: 1 };
    return accumulator;
  }, {}));
}

function normalizeTemplateFamily(layout: string) {
  if (["modern_carded", "compact-grid", "statement", "modern"].includes(layout)) {
    return "modern_carded";
  }

  if (["industrial_supply", "legal", "ledger"].includes(layout)) {
    return "industrial_supply";
  }

  return "classic_corporate";
}

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
    .map((value) => value === "seller-buyer" ? "customer" : value === "qr" ? "footer" : value)
    .filter((value): value is (typeof sectionChoices)[number] => sectionChoices.includes(value as (typeof sectionChoices)[number]));

  const ordered = [...new Set(configured)];
  const normalized = sectionChoices.filter((section) => ordered.includes(section) || !configured.length);

  for (const section of sectionChoices) {
    if (!ordered.includes(section)) {
      const insertionIndex = normalized.findIndex((candidate) => sectionChoices.indexOf(candidate) > sectionChoices.indexOf(section));
      if (insertionIndex === -1) {
        normalized.push(section);
      } else {
        normalized.splice(insertionIndex, 0, section);
      }
    }
  }

  return normalized;
}

function parseHiddenSections(template: DocumentTemplateRecord) {
  return new Set(
    getSettingValue(template, "hidden_sections", "")
      .split(",")
      .map((value) => value.trim())
      .filter((value): value is (typeof sectionChoices)[number] => sectionChoices.includes(value as (typeof sectionChoices)[number])),
  );
}

function stringifyHiddenSections(hidden: Set<string>) {
  return sectionChoices.filter((section) => hidden.has(section)).join(",");
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

export function DocumentTemplatesRegister(props?: {
  initialDocumentType?: string;
  eyebrowOverride?: string;
  titleOverride?: string;
}) {
  const { initialDocumentType, eyebrowOverride, titleOverride } = props ?? {};
  const [templates, setTemplates] = useState<DocumentTemplateRecord[]>([]);
  const [assets, setAssets] = useState<CompanyAssetRecord[]>([]);
  const [, setSelectedTemplateId] = useState<number | null>(null);
  const [draft, setDraft] = useState<DocumentTemplateRecord | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [localeFilter, setLocaleFilter] = useState("all");
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([listDocumentTemplates(), listCompanyAssets()])
      .then(([records, companyAssets]) => {
        if (!active) {
          return;
        }

        setTemplates(records);
        setAssets(companyAssets);

        const initialTemplate = initialDocumentType
          ? records.find((template) => template.documentTypes.includes(initialDocumentType)) ?? records[0]
          : records[0];

        if (initialTemplate) {
          setSelectedTemplateId(initialTemplate.id);
          setDraft(cloneTemplate(initialTemplate));
        }
      })
      .catch((err: unknown) => {
        console.error('[DocumentTemplatesRegister] templates fetch failed:', err);
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
  }, [initialDocumentType]);

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
        .catch((err: unknown) => {
          console.error('[DocumentTemplatesRegister] template preview failed:', err);
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
      const matchesDocumentType = initialDocumentType ? template.documentTypes.includes(initialDocumentType) : true;

      return matchesSearch && matchesLocale && matchesDocumentType;
    }).map((template) => ({ group, template })));
  }, [groups, initialDocumentType, localeFilter, search]);

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

  function toggleSectionVisibility(section: string) {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const hidden = parseHiddenSections(current);
      if (hidden.has(section)) {
        hidden.delete(section);
      } else {
        hidden.add(section);
      }

      return {
        ...current,
        settings: {
          ...current.settings,
          hidden_sections: stringifyHiddenSections(hidden),
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

  async function handleAssetUpload(file: File, usage: "logo" | "stamp" | "signature") {
    setUploadingLogo(true);
    setFeedback(null);
    setError(null);

    try {
      const uploaded = await uploadCompanyAsset({
        type: usage === "logo" ? "logo" : "document_asset",
        usage,
        file,
      });

      setAssets((current) => [uploaded, ...current.filter((asset) => asset.id !== uploaded.id)]);
      setDraft((current) => {
        if (!current) {
          return current;
        }

        if (usage === "logo") {
          return {
            ...current,
            logoAssetId: uploaded.id,
            logoAssetUrl: uploaded.publicUrl,
            accentColor: uploaded.metadata?.generatedTheme.primary ?? current.accentColor,
            settings: {
              ...current.settings,
              watermark_enabled: true,
              watermark_logo_mode: "full-width",
            },
          };
        }

        return {
          ...current,
          settings: {
            ...current.settings,
            [`${usage}_asset_id`]: uploaded.id,
          },
        };
      });
      setFeedback(`${file.name} uploaded and applied as ${usage}.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : `${usage} upload failed.`);
    } finally {
      setUploadingLogo(false);
    }
  }

  function reorderSections(source: string, target: string) {
    if (source === target) {
      return;
    }

    setDraft((current) => {
      if (!current) {
        return current;
      }

      const sections = parseSectionOrder(current);
      const sourceIndex = sections.indexOf(source as (typeof sectionChoices)[number]);
      const targetIndex = sections.indexOf(target as (typeof sectionChoices)[number]);

      if (sourceIndex < 0 || targetIndex < 0) {
        return current;
      }

      const nextSections = [...sections];
      const [moved] = nextSections.splice(sourceIndex, 1);
      nextSections.splice(targetIndex, 0, moved);

      return {
        ...current,
        settings: {
          ...current.settings,
          section_order: nextSections.join(","),
        },
      };
    });
  }

  function updateSectionLayout(section: string, patch: Partial<SectionLayoutSetting>) {
    if (!draft) {
      return;
    }

    const currentLayout = parseSectionLayout(draft);
    const columns = Math.max(1, Number(getSettingValue(draft, "section_grid_columns", "2")) || 2);
    const existing = currentLayout[section] ?? { row: 1, column: 1, span: 1 };
    const nextColumn = Math.min(columns, Math.max(1, patch.column ?? existing.column));
    const nextSpan = Math.max(1, Math.min(columns - nextColumn + 1, patch.span ?? existing.span));

    currentLayout[section] = {
      row: Math.max(1, patch.row ?? existing.row),
      column: nextColumn,
      span: nextSpan,
    };

    updateDraftSettings({ section_layout_map: stringifySectionLayout(currentLayout) });
  }

  function updateGridColumns(nextColumns: number) {
    if (!draft) {
      return;
    }

    const columns = Math.max(1, Math.min(4, nextColumns || 2));
    const currentLayout = parseSectionLayout(draft);
    const nextLayout = sectionChoices.reduce<Record<string, SectionLayoutSetting>>((accumulator, section) => {
      const candidate = currentLayout[section] ?? { row: 1, column: 1, span: 1 };
      const column = Math.min(columns, Math.max(1, candidate.column));
      const span = Math.max(1, Math.min(columns - column + 1, candidate.span));
      accumulator[section] = {
        row: Math.max(1, candidate.row),
        column,
        span,
      };
      return accumulator;
    }, {});

    updateDraftSettings({
      section_grid_columns: columns,
      section_layout_map: stringifySectionLayout(nextLayout),
    });
  }

  async function handleCreateTemplate() {
    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const documentType = initialDocumentType ?? draft?.documentTypes[0] ?? "tax_invoice";
      const created = await createDocumentTemplate({
        name: `New ${documentType.replaceAll("_", " ")} template`,
        documentTypes: [documentType],
        localeMode: draft?.localeMode ?? "bilingual",
        accentColor: draft?.accentColor ?? "#1f7a53",
        watermarkText: "",
        headerHtml: "",
        footerHtml: "",
        settings: { ...templatePresets[0].settings },
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
  const stampAssets = useMemo(() => assets.filter((asset) => asset.usage === "stamp"), [assets]);
  const signatureAssets = useMemo(() => assets.filter((asset) => asset.usage === "signature"), [assets]);
  const selectedAsset = draft?.logoAssetId ? logoAssets.find((asset) => asset.id === draft.logoAssetId) ?? null : null;
  const selectedStampAsset = draft ? stampAssets.find((asset) => asset.id === Number(draft.settings.stamp_asset_id ?? 0)) ?? null : null;
  const selectedSignatureAsset = draft ? signatureAssets.find((asset) => asset.id === Number(draft.settings.signature_asset_id ?? 0)) ?? null : null;
  const draftSections = draft ? parseSectionOrder(draft) : sectionChoices;
  const hiddenSections = draft ? parseHiddenSections(draft) : new Set<string>();
  const visibleSections = draftSections.filter((section) => !hiddenSections.has(section));
  const hiddenSectionList = sectionChoices.filter((section) => hiddenSections.has(section));
  const draftGridColumns = draft ? Math.max(1, Number(getSettingValue(draft, "section_grid_columns", "2")) || 2) : 2;
  const draftSectionLayout = draft ? parseSectionLayout(draft) : buildDefaultSectionLayout(2);

  return (
    <div className="space-y-2" data-inspector-split-view="true">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">{eyebrowOverride ?? "Sales operations"}</p>
          <h1 className="text-lg font-semibold text-ink">{titleOverride ?? "Document templates"}</h1>
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

      <Card className={["overflow-hidden rounded-2xl bg-white/95 p-0", isFullscreen ? "fixed inset-0 z-50 rounded-none" : "min-h-[78vh]"].join(" ")}>
        <div className="grid gap-1.5 border-b border-line px-3 py-2 md:grid-cols-[1.2fr_0.8fr_auto]">
          <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search template or document type" labelClassName="mb-1 text-[10px]" inputClassName="h-10 rounded-lg px-3 text-sm" />
          <div>
            <label htmlFor="template-locale-filter" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink">Language</label>
            <select id="template-locale-filter" value={localeFilter} onChange={(event) => setLocaleFilter(event.target.value)} className="block h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
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

        {draft ? (
          <div className="grid gap-0 xl:grid-cols-[16rem_minmax(0,1fr)_23rem]">
            <aside className="border-r border-line bg-[#f7fbf8] p-3 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto">
              <div className="flex items-center justify-between gap-2 mb-3">
                <button type="button" onClick={() => { setSelectedTemplateId(null); setDraft(null); setFeedback(null); setError(null); }} className="text-sm font-semibold text-primary hover:underline">← Templates</button>
                <span className="rounded-full border border-line bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Studio</span>
              </div>
              <div className="rounded-2xl border border-line bg-white p-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Active template</p>
                <p className="mt-2 text-sm font-semibold text-ink">{draft.name}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{templatePresets.find((preset) => preset.key === normalizeTemplateFamily(getSettingValue(draft, "layout", "classic_corporate")))?.detail}</p>
              </div>
              <div className="mt-3 rounded-2xl border border-line bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-ink">Sections</p>
                  <span className="text-[10px] uppercase tracking-[0.08em] text-muted">Drag</span>
                </div>
                <div className="mt-3 grid gap-1.5">
                  {visibleSections.map((section, index) => (
                    <div
                      key={`rail-${section}`}
                      draggable
                      onDragStart={() => setDraggedSection(section)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (draggedSection) {
                          reorderSections(draggedSection, section);
                        }
                        setDraggedSection(null);
                      }}
                      onDragEnd={() => setDraggedSection(null)}
                      className={["flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-xs", draggedSection === section ? "border-primary bg-primary-soft/20" : "border-line bg-surface-soft"].join(" ")}
                    >
                      <span className="font-semibold text-ink">{index + 1}. {section}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => toggleSectionVisibility(section)} className="rounded-full border border-line bg-white px-1.5 py-0.5 text-[10px] font-semibold text-muted hover:border-primary/40">Hide</button>
                        <span className="text-[10px] uppercase tracking-[0.08em] text-muted">Move</span>
                      </div>
                    </div>
                  ))}
                </div>
                {hiddenSectionList.length ? (
                  <div className="mt-3 rounded-xl border border-dashed border-line bg-[#fbfdfb] p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Hidden sections</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {hiddenSectionList.map((section) => (
                        <button key={`hidden-${section}`} type="button" onClick={() => toggleSectionVisibility(section)} className="rounded-full border border-line bg-white px-2 py-1 text-[10px] font-semibold text-ink hover:border-primary/40">
                          Add {section}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </aside>

            <div className="bg-[#edf2ed] p-4" data-inspector-template-surface="true">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-white px-3 py-2 shadow-sm">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Document canvas</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{draft.name}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-line bg-surface-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">{formatLocale(draft.localeMode)}</span>
                  <Button size="xs" variant="secondary" onClick={() => setIsFullscreen((v) => !v)}>{isFullscreen ? "Windowed" : "Fullscreen"}</Button>
                  <Button size="xs" variant="secondary" onClick={() => void handleDuplicate(draft)} disabled={saving}>Duplicate</Button>
                  <Button size="xs" onClick={() => void handleSave()} disabled={saving}>{saving ? "Saving" : "Save"}</Button>
                </div>
              </div>
              <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
                {templatePresets.map((preset) => (
                  <button key={preset.key} type="button" onClick={() => applyPreset(preset.key)} className={[
                    "shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
                    normalizeTemplateFamily(getSettingValue(draft, "layout", "classic_corporate")) === preset.settings.layout ? "border-primary bg-primary-soft/30 text-ink" : "border-line bg-white text-muted hover:border-primary/40",
                  ].join(" ")}>{preset.label}</button>
                ))}
              </div>
              <div className="mb-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-[#d9e2d9] bg-white px-3 py-2 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      {visibleSections.map((section, index) => (
                        <button
                          key={`stage-${section}`}
                          type="button"
                          draggable
                          onDragStart={() => setDraggedSection(section)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => {
                            if (draggedSection) {
                              reorderSections(draggedSection, section);
                            }
                            setDraggedSection(null);
                          }}
                          onDragEnd={() => setDraggedSection(null)}
                          className={["inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition", draggedSection === section ? "border-primary bg-primary-soft/25 text-ink" : "border-line bg-surface-soft text-ink hover:border-primary/40"].join(" ")}
                        >
                          <span className="text-muted">{index + 1}</span>
                          <span>{section.replaceAll("-", " ")}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={["overflow-auto rounded-[28px] border border-[#d9e2d9] bg-[#f7faf7] p-5", isFullscreen ? "max-h-[calc(100vh-12.5rem)]" : "max-h-[68vh]"].join(" ")}>
                {previewHtml ? <div dangerouslySetInnerHTML={{ __html: previewHtml }} /> : <p className="py-12 text-center text-sm text-muted">Preview loading…</p>}
                  </div>
                </div>
                <div className="rounded-2xl border border-line bg-white p-3 shadow-sm">
                  <p className="text-xs font-semibold text-ink">Canvas brief</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted">The stage above mirrors the document section flow. Hide, restore, and reorder sections visually while the PDF preview remains exact.</p>
                  <div className="mt-3 grid gap-2">
                    <div className="rounded-xl border border-line bg-surface-soft px-3 py-2 text-xs text-ink">
                      <span className="font-semibold">Grid:</span> {draftGridColumns} columns
                    </div>
                    <div className="rounded-xl border border-line bg-surface-soft px-3 py-2 text-xs text-ink">
                      <span className="font-semibold">Font:</span> {getSettingValue(draft, "font_family", "Segoe UI")} / {getSettingValue(draft, "font_size", "12")}px
                    </div>
                    <div className="rounded-xl border border-line bg-surface-soft px-3 py-2 text-xs text-ink">
                      <span className="font-semibold">Spacing:</span> gap {getSettingValue(draft, "section_gap", "8")}, scale {getSettingValue(draft, "spacing_scale", "0.9")}
                    </div>
                    <div className="rounded-xl border border-line bg-surface-soft px-3 py-2 text-xs text-ink">
                      <span className="font-semibold">Canvas:</span> {getSettingValue(draft, "canvas_padding", "14")}px padding
                    </div>
                    <div className="rounded-xl border border-line bg-surface-soft px-3 py-2 text-xs text-ink">
                      <span className="font-semibold">Visible:</span> {visibleSections.length} sections
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={["overflow-y-auto border-l border-line bg-white", isFullscreen ? "max-h-[calc(100vh-3rem)]" : "max-h-[85vh]"].join(" ")}>
              <div className="sticky top-0 z-10 border-b border-line bg-white px-3 py-3">
                <h3 className="text-sm font-semibold text-ink">Inspector</h3>
                <p className="mt-1 text-[11px] leading-5 text-muted">Secondary controls live here. The canvas stays primary while you tune the output.</p>
              </div>
              <div className="grid gap-3 p-3">
                <Input label="Template name" value={draft.name} onChange={(event) => updateDraft({ name: event.target.value })} labelClassName="mb-1 text-[10px]" inputClassName="h-9 rounded-lg px-3 text-sm" />
                <div className="grid gap-3 grid-cols-2">
                  <div>
                    <label htmlFor="template-language" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink">Language</label>
                    <select id="template-language" value={draft.localeMode} onChange={(event) => updateDraft({ localeMode: event.target.value })} className="block h-9 w-full rounded-lg border border-line-strong bg-white px-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                      <option value="bilingual">Bilingual</option>
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="template-status" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink">Status</label>
                    <select id="template-status" value={draft.isActive ? "active" : "inactive"} onChange={(event) => updateDraft({ isActive: event.target.value === "active" })} className="block h-9 w-full rounded-lg border border-line-strong bg-white px-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <Input label="Accent color" value={draft.accentColor} onChange={(event) => updateDraft({ accentColor: event.target.value })} labelClassName="mb-1 text-[10px]" inputClassName="h-9 rounded-lg px-3 text-sm" />
                  <div>
                    <label htmlFor="template-layout" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink">Template family</label>
                    <select id="template-layout" value={normalizeTemplateFamily(getSettingValue(draft, "layout", "classic_corporate"))} onChange={(event) => updateDraftSettings({ layout: event.target.value })} className="block h-9 w-full rounded-lg border border-line-strong bg-white px-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                      <option value="classic_corporate">Classic Corporate</option>
                      <option value="modern_carded">Modern Carded</option>
                      <option value="industrial_supply">Industrial / Supply Chain</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="template-card-style" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink">Card style</label>
                  <select id="template-card-style" value={getSettingValue(draft, "card_style", "soft")} onChange={(event) => updateDraftSettings({ card_style: event.target.value })} className="block h-9 w-full rounded-lg border border-line-strong bg-white px-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                    <option value="soft">Soft</option>
                    <option value="outlined">Outlined</option>
                    <option value="solid">Solid</option>
                  </select>
                </div>
                <div className="rounded-xl border border-line bg-surface-soft p-2.5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-ink">Grid layout</p>
                      <p className="mt-0.5 text-[11px] text-muted">These row and column settings are sent to the backend preview and PDF renderer.</p>
                    </div>
                    <div className="w-24">
                      <label htmlFor="template-grid-columns" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink">Columns</label>
                      <select id="template-grid-columns" value={String(draftGridColumns)} onChange={(event) => updateGridColumns(Number(event.target.value) || 2)} className="block h-9 w-full rounded-lg border border-line-strong bg-white px-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    {draftSections.map((section) => {
                      const placement = draftSectionLayout[section] ?? { row: 1, column: 1, span: 1 };

                      return (
                        <div key={`${section}-placement`} className="rounded-lg border border-line bg-white px-2.5 py-2">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold capitalize text-ink">{section.replaceAll("-", " ")}</span>
                            <span className="text-[10px] text-muted">Row {placement.row} · Col {placement.column} · Span {placement.span}</span>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <div>
                              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink">Row</label>
                              <input type="number" min="1" value={placement.row} onChange={(event) => updateSectionLayout(section, { row: Number(event.target.value) || 1 })} className="block h-9 w-full rounded-lg border border-line-strong bg-white px-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink">Column</label>
                              <input type="number" min="1" max={draftGridColumns} value={placement.column} onChange={(event) => updateSectionLayout(section, { column: Number(event.target.value) || 1 })} className="block h-9 w-full rounded-lg border border-line-strong bg-white px-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink">Span</label>
                              <input type="number" min="1" max={draftGridColumns} value={placement.span} onChange={(event) => updateSectionLayout(section, { span: Number(event.target.value) || 1 })} className="block h-9 w-full rounded-lg border border-line-strong bg-white px-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <label className="flex items-center gap-2 rounded-lg border border-line bg-surface-soft px-2.5 py-2 text-xs font-semibold text-ink">
                    <input type="checkbox" checked={getBooleanSetting(draft, "watermark_enabled", true)} onChange={(event) => updateDraftSettings({ watermark_enabled: event.target.checked })} />
                    Watermark
                  </label>
                  <div>
                    <label htmlFor="template-watermark-mode" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink">Mode</label>
                    <select id="template-watermark-mode" value={getSettingValue(draft, "watermark_logo_mode", "full-width")} onChange={(event) => updateDraftSettings({ watermark_logo_mode: event.target.value })} className="block h-9 w-full rounded-lg border border-line-strong bg-white px-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                      <option value="full-width">Full width</option>
                      <option value="centered">Centered</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div>
                    <label htmlFor="template-font-family" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink">Font family</label>
                    <select id="template-font-family" value={getSettingValue(draft, "font_family", "Segoe UI")} onChange={(event) => updateDraftSettings({ font_family: event.target.value })} className="block h-9 w-full rounded-lg border border-line-strong bg-white px-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                      {fontChoices.map((font) => <option key={font} value={font}>{font}</option>)}
                    </select>
                  </div>
                  <Input label="Base font size" value={getSettingValue(draft, "font_size", "12")} onChange={(event) => updateDraftSettings({ font_size: Number(event.target.value) || 12 })} labelClassName="mb-1 text-[10px]" inputClassName="h-9 rounded-lg px-3 text-sm" />
                </div>
                <div className="grid gap-3 grid-cols-4">
                  <Input label="Title size" value={getSettingValue(draft, "title_font_size", "26")} onChange={(event) => updateDraftSettings({ title_font_size: Number(event.target.value) || 26 })} labelClassName="mb-1 text-[10px]" inputClassName="h-9 rounded-lg px-3 text-sm" />
                  <Input label="Section gap" value={getSettingValue(draft, "section_gap", "12")} onChange={(event) => updateDraftSettings({ section_gap: Number(event.target.value) || 12 })} labelClassName="mb-1 text-[10px]" inputClassName="h-9 rounded-lg px-3 text-sm" />
                  <Input label="Spacing scale" value={getSettingValue(draft, "spacing_scale", "1")} onChange={(event) => updateDraftSettings({ spacing_scale: Number(event.target.value) || 1 })} labelClassName="mb-1 text-[10px]" inputClassName="h-9 rounded-lg px-3 text-sm" />
                  <Input label="Canvas padding" value={getSettingValue(draft, "canvas_padding", "14")} onChange={(event) => updateDraftSettings({ canvas_padding: Number(event.target.value) || 14 })} labelClassName="mb-1 text-[10px]" inputClassName="h-9 rounded-lg px-3 text-sm" />
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div>
                    <label htmlFor="template-title-align" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink">Title alignment</label>
                    <select id="template-title-align" value={getSettingValue(draft, "title_align", "center")} onChange={(event) => updateDraftSettings({ title_align: event.target.value })} className="block h-9 w-full rounded-lg border border-line-strong bg-white px-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="template-body-align" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.05em] text-ink">Body alignment</label>
                    <select id="template-body-align" value={getSettingValue(draft, "body_align", "left")} onChange={(event) => updateDraftSettings({ body_align: event.target.value })} className="block h-9 w-full rounded-lg border border-line-strong bg-white px-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-surface-soft p-2.5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold text-ink">Logo intelligence</p>
                    <label className="inline-flex cursor-pointer items-center rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink">
                      {uploadingLogo ? "Uploading…" : "Upload"}
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={uploadingLogo} onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void handleAssetUpload(file, "logo");
                        }
                        event.currentTarget.value = "";
                      }} />
                    </label>
                  </div>
                  <div className="rounded-lg border border-line bg-white p-2">
                    {selectedAsset?.publicUrl ? (
                      <Image src={selectedAsset.publicUrl} alt={selectedAsset.originalName} width={192} height={64} unoptimized className="h-16 w-full object-contain" />
                    ) : <div className="flex h-16 items-center justify-center text-xs text-muted">No logo selected</div>}
                  </div>
                  {logoAssets.length > 0 ? (
                    <select value={draft.logoAssetId ?? ""} onChange={(event) => {
                      const nextId = event.target.value ? Number(event.target.value) : null;
                      const asset = nextId ? logoAssets.find((candidate) => candidate.id === nextId) ?? null : null;
                      setDraft((current) => current ? {
                        ...current,
                        logoAssetId: nextId,
                        logoAssetUrl: asset?.publicUrl ?? "",
                        accentColor: asset?.metadata?.generatedTheme.primary ?? current.accentColor,
                      } : current);
                    }} className="mt-2 block h-9 w-full rounded-lg border border-line-strong bg-white px-2 text-xs text-ink outline-none">
                      <option value="">No logo</option>
                      {logoAssets.map((asset) => (
                        <option key={asset.id} value={asset.id}>{asset.originalName}</option>
                      ))}
                    </select>
                  ) : null}
                  {selectedAsset?.metadata ? (
                    <div className="mt-2 text-[11px] text-muted">
                      <p>{selectedAsset.metadata.transparentBackground ? "Transparent PNG" : "Original asset"} · {selectedAsset.metadata.width}×{selectedAsset.metadata.height}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(selectedAsset.metadata.dominantColors || []).map((color) => (
                          <span key={color} className="inline-flex items-center gap-1 rounded-full border border-line px-1.5 py-0.5 text-[10px]">
                            <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                            {color}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 grid gap-1 grid-cols-2">
                        {Object.entries(selectedAsset.metadata.generatedTheme || {}).map(([token, color]) => (
                          <button key={token} type="button" onClick={() => updateDraft({ accentColor: token === "primary" ? color : draft.accentColor })} className="flex items-center justify-between rounded-lg border border-line bg-white px-2 py-1.5 text-left text-[10px] font-semibold text-ink">
                            <span>{token}</span>
                            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ backgroundColor: color }} />{color}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div className="rounded-xl border border-line bg-surface-soft p-2.5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-ink">Stamp</p>
                      <label className="inline-flex cursor-pointer items-center rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink">
                        Upload
                        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void handleAssetUpload(file, "stamp");
                          }
                          event.currentTarget.value = "";
                        }} />
                      </label>
                    </div>
                    <div className="rounded-lg border border-line bg-white p-2">
                      {selectedStampAsset?.publicUrl ? <Image src={selectedStampAsset.publicUrl} alt={selectedStampAsset.originalName} width={128} height={96} unoptimized className="h-20 w-full object-contain" /> : <div className="flex h-20 items-center justify-center text-xs text-muted">No stamp selected</div>}
                    </div>
                    <select value={draft.settings.stamp_asset_id ? String(draft.settings.stamp_asset_id) : ""} onChange={(event) => updateDraftSettings({ stamp_asset_id: event.target.value ? Number(event.target.value) : null })} className="mt-2 block h-9 w-full rounded-lg border border-line-strong bg-white px-2 text-xs text-ink outline-none">
                      <option value="">No stamp</option>
                      {stampAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.originalName}</option>)}
                    </select>
                  </div>
                  <div className="rounded-xl border border-line bg-surface-soft p-2.5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-ink">Signature</p>
                      <label className="inline-flex cursor-pointer items-center rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink">
                        Upload
                        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void handleAssetUpload(file, "signature");
                          }
                          event.currentTarget.value = "";
                        }} />
                      </label>
                    </div>
                    <div className="rounded-lg border border-line bg-white p-2">
                      {selectedSignatureAsset?.publicUrl ? <Image src={selectedSignatureAsset.publicUrl} alt={selectedSignatureAsset.originalName} width={160} height={80} unoptimized className="h-20 w-full object-contain" /> : <div className="flex h-20 items-center justify-center text-xs text-muted">No signature selected</div>}
                    </div>
                    <select value={draft.settings.signature_asset_id ? String(draft.settings.signature_asset_id) : ""} onChange={(event) => updateDraftSettings({ signature_asset_id: event.target.value ? Number(event.target.value) : null })} className="mt-2 block h-9 w-full rounded-lg border border-line-strong bg-white px-2 text-xs text-ink outline-none">
                      <option value="">No signature</option>
                      {signatureAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.originalName}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                ) : filteredTemplates.length ? filteredTemplates.map(({ group, template }) => (
                  <tr key={`${group.documentType}-${template.id}`} className="border-t border-line/70 align-top">
                    <td className="px-3 py-2">
                      <button type="button" className="text-left" onClick={() => selectTemplate(template)} data-inspector-row-clickable="true">
                        <span className="block font-semibold text-ink hover:text-primary">{template.name}</span>
                        <span className="mt-0.5 block text-xs text-muted">{templatePresets.find((preset) => preset.key === normalizeTemplateFamily(getSettingValue(template, "layout", "classic_corporate")))?.label ?? "Classic Corporate"}</span>
                      </button>
                    </td>
                    <td className="px-3 py-2 text-sm text-muted">{group.label}</td>
                    <td className="px-3 py-2 text-sm text-muted">{formatLocale(template.localeMode)}</td>
                    <td className="px-3 py-2 text-sm text-muted">{template.isDefault ? "Default" : template.isActive ? "Active" : "Inactive"}</td>
                    <td className="px-3 py-2 text-sm text-muted">{formatUpdated(template.id)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => selectTemplate(template)}>Edit</Button>
                        <Button size="sm" variant="secondary" onClick={() => void handleDuplicate(template)} disabled={saving}>Duplicate</Button>
                        <Button size="sm" variant="secondary" onClick={() => void handleSetDefault(template)} disabled={saving || template.isDefault}>Default</Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-3 py-4 text-sm text-muted" colSpan={6}>No templates match the current filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}