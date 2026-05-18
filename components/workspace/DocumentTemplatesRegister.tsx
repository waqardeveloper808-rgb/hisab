"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { ImportExportControls } from "@/components/workspace/ImportExportControls";
import { buildTemplateRegister } from "@/data/document-template-adapter";
import { buildDefaultSchemaSettings } from "@/lib/document-platform/schema";
import {
  createDocumentTemplate,
  exportDocumentTemplatePdf,
  listCompanyAssets,
  listDocumentTemplates,
  previewDocumentTemplate,
  uploadCompanyAsset,
  updateDocumentTemplate,
  type CompanyAssetRecord,
  type DocumentTemplateRecord,
} from "@/lib/workspace-api";

const sectionChoices = ["header", "title", "document-info", "delivery", "customer", "items", "totals", "notes", "footer"];
const fontChoices = ["Segoe UI", "Noto Sans Arabic", "Georgia", "Tahoma", "Times New Roman"];
const templatePresets = [
  { key: "classic_corporate", label: "Standard", detail: "Balanced default layout for everyday invoicing with dense spacing, bilingual hierarchy, and dependable print parity.", settings: { layout: "classic_corporate", card_style: "none", section_order: "header,title,document-info,delivery,customer,items,totals,notes,footer", section_grid_columns: 2, section_layout_map: JSON.stringify({ header: { row: 1, column: 1, span: 2 }, title: { row: 2, column: 1, span: 2 }, "document-info": { row: 3, column: 1, span: 1 }, delivery: { row: 3, column: 2, span: 1 }, customer: { row: 4, column: 1, span: 1 }, totals: { row: 4, column: 2, span: 1 }, items: { row: 5, column: 1, span: 2 }, notes: { row: 6, column: 1, span: 1 }, footer: { row: 6, column: 2, span: 1 } }), watermark_enabled: true, watermark_logo_mode: "full-width", font_family: "Segoe UI", font_size: 12, title_font_size: 26, spacing_scale: 0.9, section_gap: 8, canvas_padding: 14, top_bar_height: 3, title_align: "center", body_align: "left", show_qr: false, show_footer: true } },
  { key: "modern_carded", label: "Modern", detail: "Cleaner visual separation with softer panels and a client-facing presentation while remaining PDF-safe.", settings: { layout: "modern_carded", card_style: "outlined", section_order: "header,title,document-info,delivery,customer,items,totals,notes,footer", section_grid_columns: 2, section_layout_map: JSON.stringify({ header: { row: 1, column: 1, span: 2 }, title: { row: 2, column: 1, span: 2 }, customer: { row: 3, column: 1, span: 1 }, "document-info": { row: 3, column: 2, span: 1 }, items: { row: 4, column: 1, span: 2 }, notes: { row: 5, column: 1, span: 1 }, totals: { row: 5, column: 2, span: 1 }, delivery: { row: 6, column: 1, span: 2 }, footer: { row: 7, column: 1, span: 2 } }), watermark_enabled: true, watermark_logo_mode: "centered", font_family: "Segoe UI", font_size: 12, title_font_size: 27, spacing_scale: 1.04, section_gap: 14, canvas_padding: 20, top_bar_height: 5, title_align: "center", body_align: "left", show_qr: false, show_footer: true } },
  { key: "industrial_supply", label: "Compact", detail: "Compact data-first layout for operational documents with tighter spacing and stronger tabular emphasis.", settings: { layout: "industrial_supply", card_style: "none", section_order: "header,title,document-info,delivery,customer,items,totals,notes,footer", section_grid_columns: 3, section_layout_map: JSON.stringify({ header: { row: 1, column: 1, span: 3 }, title: { row: 2, column: 1, span: 3 }, "document-info": { row: 3, column: 1, span: 1 }, delivery: { row: 3, column: 2, span: 1 }, customer: { row: 3, column: 3, span: 1 }, items: { row: 4, column: 1, span: 3 }, notes: { row: 5, column: 1, span: 2 }, totals: { row: 5, column: 3, span: 1 }, footer: { row: 6, column: 1, span: 3 } }), watermark_enabled: true, watermark_logo_mode: "full-width", font_family: "Tahoma", font_size: 12, title_font_size: 25, spacing_scale: 0.9, section_gap: 10, canvas_padding: 16, top_bar_height: 4, title_align: "center", body_align: "left", show_qr: false, show_footer: true } },
] as const;

type SectionLayoutSetting = {
  row: number;
  column: number;
  span: number;
};

function EditableHtmlBlock({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-soft p-2.5">
      <p className="text-xs font-semibold text-ink">{label}</p>
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={(event) => onChange(event.currentTarget.innerHTML)}
        className="mt-2 min-h-[5.5rem] rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
        dangerouslySetInnerHTML={{ __html: value || `<p>${placeholder}</p>` }}
      />
    </div>
  );
}

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

function normalizeTemplateFamily(layout: string | null | undefined): "standard" | "modern" | "compact" {
  const value = String(layout ?? "").trim().toLowerCase();

  if (["modern", "modern_carded", "carded"].includes(value)) {
    return "modern";
  }

  if (["compact", "compact_dense", "industrial_supply", "industrial supply", "dense"].includes(value)) {
    return "compact";
  }

  return "standard";
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

function parseLabelOverrides(template: DocumentTemplateRecord, language: "en" | "ar") {
  const raw = getSettingValue(template, `label_overrides_${language}`, "{}");

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.entries(parsed).reduce<Record<string, string>>((accumulator, [key, value]) => {
      if (typeof value === "string") {
        accumulator[key] = value;
      }
      return accumulator;
    }, {});
  } catch {
    return {};
  }
}

function stringifyLabelOverrides(overrides: Record<string, string>) {
  return JSON.stringify(overrides);
}

type ItemColumnConfig = {
  key: string;
  width: number;
  visible: boolean;
};

const fallbackItemColumnConfig: ItemColumnConfig[] = [
  { key: "serial", width: 4, visible: true },
  { key: "description", width: 26, visible: true },
  { key: "quantity", width: 7, visible: true },
  { key: "unit", width: 7, visible: true },
  { key: "unit_price", width: 9, visible: true },
  { key: "taxable", width: 11, visible: true },
  { key: "vat_rate", width: 7, visible: true },
  { key: "vat", width: 9, visible: true },
  { key: "total", width: 20, visible: true },
];

const ITEM_COLUMN_LABELS: Record<string, string> = {
  serial: "#",
  description: "Description",
  quantity: "Qty",
  unit: "Unit",
  unit_price: "Rate",
  taxable: "Taxable",
  vat_rate: "VAT %",
  vat: "VAT",
  total: "Total",
};

function parseItemColumnConfig(template: DocumentTemplateRecord): ItemColumnConfig[] {
  const raw = getSettingValue(template, "item_table_columns", "");
  let parsed: ItemColumnConfig[] = [];

  if (raw.trim()) {
    try {
      const json = JSON.parse(raw) as Array<Partial<ItemColumnConfig>>;
      parsed = json
        .filter((entry): entry is Partial<ItemColumnConfig> & { key: string } => typeof entry?.key === "string")
        .map((entry) => ({
          key: entry.key,
          width: Math.max(3, Math.min(60, Number(entry.width) || 10)),
          visible: typeof entry.visible === "boolean" ? entry.visible : true,
        }));
    } catch {
      parsed = [];
    }
  }

  const byKey = new Map(parsed.map((column) => [column.key, column]));
  return fallbackItemColumnConfig.map((defaults) => {
    const override = byKey.get(defaults.key);
    return override
      ? { key: defaults.key, width: override.width, visible: override.visible }
      : { ...defaults };
  });
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

/**
 * Laravel-backed template preview/PDF payloads only understand legacy layout enums.
 * `compact_dense` is a UI-facing alias persisted in drafts but must collapse to `industrial_supply`
 * outbound (backend schema unchanged — Prompt A3 constraint).
 */
function sanitizeOutboundTemplateSettings(settings: DocumentTemplateRecord["settings"]): DocumentTemplateRecord["settings"] {
  const layout = settings.layout != null ? String(settings.layout) : "";
  if (layout === "compact_dense") {
    return { ...settings, layout: "industrial_supply" };
  }
  return settings;
}

function getPreviewStyleFromTemplate(template: DocumentTemplateRecord): "standard" | "modern" | "compact" {
  const explicit = template.settings.template_style;
  if (typeof explicit === "string") {
    return normalizeTemplateFamily(explicit);
  }

  return normalizeTemplateFamily(getSettingValue(template, "layout", "standard"));
}

function presetKeyForAmbientStyle(style: "standard" | "modern" | "compact"): (typeof templatePresets)[number]["key"] {
  if (style === "modern") return "modern_carded";
  if (style === "compact") return "industrial_supply";
  return "classic_corporate";
}

export function DocumentTemplatesRegister(props?: {
  initialDocumentType?: string;
  eyebrowOverride?: string;
  titleOverride?: string;
}) {
  const { initialDocumentType, eyebrowOverride, titleOverride } = props ?? {};
  const router = useRouter();
  const pathname = usePathname();
  const [templates, setTemplates] = useState<DocumentTemplateRecord[]>([]);
  const [assets, setAssets] = useState<CompanyAssetRecord[]>([]);
  const [, setSelectedTemplateId] = useState<number | null>(null);
  const [draft, setDraft] = useState<DocumentTemplateRecord | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [localeFilter, setLocaleFilter] = useState("all");
  const [signatureUploadIntent, setSignatureUploadIntent] = useState<File | null>(null);
  const [signatoryFormName, setSignatoryFormName] = useState("");
  const [signatoryFormPosition, setSignatoryFormPosition] = useState("");
  const [ambientPreviewFamily, setAmbientPreviewFamily] = useState<"standard" | "modern" | "compact">("standard");

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
          setAmbientPreviewFamily(getPreviewStyleFromTemplate(initialTemplate));
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
        settings: sanitizeOutboundTemplateSettings(draft.settings),
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
    setAmbientPreviewFamily(getPreviewStyleFromTemplate(template));
    setFeedback(null);
    setError(null);
  }

  function openTemplateStudioFromTemplate(
    template: DocumentTemplateRecord,
    styleOverride?: "standard" | "modern" | "compact",
  ) {
    const params = new URLSearchParams();
    const style = normalizeTemplateFamily(styleOverride ?? getPreviewStyleFromTemplate(template));
    params.set("templateId", String(template.id));
    params.set("style", style);
    params.set("documentType", template.documentTypes[0] ?? initialDocumentType ?? "tax_invoice");
    router.push(`/workspace/user/templates/studio?${params.toString()}`);
  }

  function applyPreviewStyle(template: DocumentTemplateRecord, style: "standard" | "modern" | "compact") {
    const layout =
      style === "modern"
        ? "modern_carded"
        : style === "compact"
          ? "compact_dense"
          : "classic_corporate";

    const next = cloneTemplate(template);
    next.settings = {
      ...next.settings,
      layout,
      template_style: style,
    };

    setSelectedTemplateId(next.id);
    setDraft(next);
    setAmbientPreviewFamily(style);
    setFeedback(`Previewing ${style} style for ${next.name}.`);
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

  async function handleAssetUpload(
    file: File,
    usage: "logo" | "stamp" | "signature",
    signatory?: { name: string; position: string },
  ) {
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

        if (usage === "signature" && signatory) {
          return {
            ...current,
            settings: {
              ...current.settings,
              signature_asset_id: uploaded.id,
              signatory_name: signatory.name.trim(),
              signatory_position: signatory.position.trim(),
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

  function updateLabelOverride(language: "en" | "ar", key: string, value: string) {
    if (!draft) {
      return;
    }

    const current = parseLabelOverrides(draft, language);
    if (value.trim()) {
      current[key] = value;
    } else {
      delete current[key];
    }

    updateDraftSettings({ [`label_overrides_${language}`]: stringifyLabelOverrides(current) });
  }

  function updateItemColumn(key: string, patch: Partial<ItemColumnConfig>) {
    if (!draft) {
      return;
    }

    const nextColumns = parseItemColumnConfig(draft).map((column) => {
      if (column.key !== key) {
        return column;
      }

      return {
        ...column,
        width: patch.width !== undefined ? Math.max(3, Math.min(60, patch.width || 10)) : column.width,
        visible: patch.visible !== undefined ? patch.visible : column.visible,
      };
    });

    updateDraftSettings({ item_table_columns: JSON.stringify(nextColumns) });
  }

  function moveItemColumn(key: string, direction: -1 | 1) {
    if (!draft) {
      return;
    }

    const cols = parseItemColumnConfig(draft);
    const index = cols.findIndex((column) => column.key === key);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= cols.length) {
      return;
    }

    const next = [...cols];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    updateDraftSettings({ item_table_columns: JSON.stringify(next) });
  }

  async function confirmSignatureUploadFromModal() {
    if (!signatureUploadIntent) {
      return;
    }

    await handleAssetUpload(signatureUploadIntent, "signature", {
      name: signatoryFormName,
      position: signatoryFormPosition,
    });
    setSignatureUploadIntent(null);
  }

  async function handleCreateTemplate() {
    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const documentType = initialDocumentType ?? draft?.documentTypes[0] ?? "tax_invoice";
      const schemaDefaults = buildDefaultSchemaSettings(
        ["tax_invoice", "proforma_invoice", "quotation", "credit_note", "debit_note"].includes(documentType)
          ? documentType as "tax_invoice" | "proforma_invoice" | "quotation" | "credit_note" | "debit_note"
          : "tax_invoice",
      );
      const created = await createDocumentTemplate({
        name: `New ${documentType.replaceAll("_", " ")} template`,
        documentTypes: [documentType],
        localeMode: draft?.localeMode ?? "bilingual",
        accentColor: draft?.accentColor ?? "#3FAE2A",
        watermarkText: "",
        headerHtml: "",
        footerHtml: "",
        settings: { ...schemaDefaults },
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
    if (typeof window !== "undefined" && (document.cookie.includes("workspace_mode=preview") || window.location.search.includes("mode=preview"))) {
      setError(null);
      setFeedback("Set default is unavailable in workspace preview mode — sign in to persist company defaults.");
      return;
    }
    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const updated = await updateDocumentTemplate({
        ...template,
        isDefault: true,
        settings: sanitizeOutboundTemplateSettings(template.settings),
      });

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
      const updated = await updateDocumentTemplate({
        ...draft,
        settings: sanitizeOutboundTemplateSettings(draft.settings),
      });
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

  async function handleDownloadPdf() {
    if (!draft) {
      return;
    }

    setExportingPdf(true);
    setFeedback(null);
    setError(null);

    try {
      const result = await exportDocumentTemplatePdf({
        name: draft.name,
        documentTypes: draft.documentTypes,
        localeMode: draft.localeMode,
        accentColor: draft.accentColor,
        watermarkText: draft.watermarkText,
        headerHtml: draft.headerHtml,
        footerHtml: draft.footerHtml,
        settings: sanitizeOutboundTemplateSettings(draft.settings),
        logoAssetId: draft.logoAssetId,
        isDefault: draft.isDefault,
        isActive: draft.isActive,
      }, draft.documentTypes[0] ?? initialDocumentType ?? "tax_invoice");

      const anchor = document.createElement("a");
      anchor.href = result.url;
      anchor.download = result.fileName;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(result.url), 1000);
      setFeedback(`${result.fileName} downloaded.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Template PDF could not be downloaded.");
    } finally {
      setExportingPdf(false);
    }
  }

  function getWorkspaceHref() {
    if (initialDocumentType) {
      return pathname || "/workspace/user/document-templates";
    }

    return "/workspace/user";
  }

  function getTemplateHubHref() {
    return pathname || "/workspace/user/document-templates";
  }

  function handleExitEditor() {
    router.push(getTemplateHubHref());
  }

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
        </div>
      </div>

      {feedback ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{feedback}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <Card className="min-h-[calc(100vh-7rem)] overflow-hidden rounded-2xl bg-white/95 p-0">
        <div className="border-b border-line bg-white/95 px-3 py-2 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleExitEditor}>
                Exit Editor
              </Button>
              <Link href={getWorkspaceHref()} className="inline-flex min-h-[var(--control-button)] items-center justify-center rounded-[var(--radius-sm)] border border-line bg-white px-2.5 py-1 text-sm font-semibold text-ink hover:border-primary/30 hover:bg-primary-soft hover:text-primary">
                Back to Workspace
              </Link>
              <Link href={getTemplateHubHref()} className="inline-flex min-h-[var(--control-button)] items-center justify-center rounded-[var(--radius-sm)] border border-line bg-white px-2.5 py-1 text-sm font-semibold text-ink hover:border-primary/30 hover:bg-primary-soft hover:text-primary">
                Template Register
              </Link>
              <span className="rounded-full border border-line bg-surface-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                Template register + preview
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {draft ? <Button size="sm" variant="secondary" onClick={() => void handleDuplicate(draft)} disabled={saving}>Duplicate</Button> : null}
              {draft ? <Button size="sm" variant="secondary" onClick={() => void handleSetDefault(draft)} disabled={saving || draft.isDefault}>{draft.isDefault ? "Default" : "Set Default"}</Button> : null}
              {draft ? <Button size="sm" variant="secondary" onClick={() => void handleDownloadPdf()} disabled={exportingPdf}>{exportingPdf ? "Downloading PDF" : "Download PDF"}</Button> : null}
              {draft ? <Button size="sm" onClick={() => void handleSave()} disabled={saving}>{saving ? "Saving" : "Save"}</Button> : null}
            </div>
          </div>
        </div>
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

        <div className="grid gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="overflow-x-auto rounded-xl border border-line bg-white">
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
                  <tr
                    key={`${group.documentType}-${template.id}`}
                    className="cursor-pointer border-t border-line/70 align-top transition hover:bg-surface-soft/50"
                    role="button"
                    tabIndex={0}
                    data-testid={`template-row-${template.id}`}
                    onClick={() => selectTemplate(template)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectTemplate(template);
                      }
                    }}
                  >
                    <td className="px-3 py-2">
                      <span className="block font-semibold text-ink">{template.name}</span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {templatePresets.find((preset) => preset.key === presetKeyForAmbientStyle(getPreviewStyleFromTemplate(template)))?.label ?? "Standard"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-muted">{group.label}</td>
                    <td className="px-3 py-2 text-sm text-muted">{formatLocale(template.localeMode)}</td>
                    <td className="px-3 py-2 text-sm text-muted">{template.isDefault ? "Default" : template.isActive ? "Active" : "Inactive"}</td>
                    <td className="px-3 py-2 text-sm text-muted">{formatUpdated(template.id)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          data-testid={`template-preview-action-${template.id}`}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            selectTemplate(template);
                          }}
                        >
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          data-testid={`template-edit-action-${template.id}`}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            openTemplateStudioFromTemplate(template);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          data-testid={`template-set-default-action-${template.id}`}
                          disabled={saving || template.isDefault}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void handleSetDefault(template);
                          }}
                        >
                          Set default
                        </Button>
                        <Button size="sm" variant="secondary" disabled={saving} onClick={(event) => { event.preventDefault(); event.stopPropagation(); void handleDuplicate(template); }}>Duplicate</Button>
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
          <div
            data-testid="template-register-preview-panel"
            className="min-h-[320px] rounded-xl border border-line bg-surface-soft p-3 lg:max-h-[calc(100vh-14rem)] lg:overflow-auto"
          >
            {draft ? (
              <div className="space-y-3">
                <span className="sr-only" data-testid="template-register-preview-ambient">
                  {ambientPreviewFamily}
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Selected template</p>
                  <h2 className="text-base font-semibold text-ink">{draft.name}</h2>
                  <p className="text-xs text-muted">
                    Document type: {draft.documentTypes[0] ?? "—"} · Current style: {getPreviewStyleFromTemplate(draft)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={getPreviewStyleFromTemplate(draft) === "standard" ? "primary" : "secondary"}
                    data-testid="template-preview-style-standard"
                    onClick={() => applyPreviewStyle(draft, "standard")}
                  >
                    Standard
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={getPreviewStyleFromTemplate(draft) === "modern" ? "primary" : "secondary"}
                    data-testid="template-preview-style-modern"
                    onClick={() => applyPreviewStyle(draft, "modern")}
                  >
                    Modern
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={getPreviewStyleFromTemplate(draft) === "compact" ? "primary" : "secondary"}
                    data-testid="template-preview-style-compact"
                    onClick={() => applyPreviewStyle(draft, "compact")}
                  >
                    Compact
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => selectTemplate(draft)}>
                    Preview
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    data-testid="template-preview-edit-selected"
                    onClick={() => openTemplateStudioFromTemplate(draft, getPreviewStyleFromTemplate(draft))}
                  >
                    Edit in Studio
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={saving || draft.isDefault}
                    onClick={() => void handleSetDefault(draft)}
                  >
                    Set default
                  </Button>
                </div>
                <div className="max-h-[55vh] overflow-auto rounded-lg border border-line bg-white p-3">
                  {previewHtml ? <div dangerouslySetInnerHTML={{ __html: previewHtml }} /> : <p className="py-8 text-center text-sm text-muted">Preview loading…</p>}
                </div>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted">Select a template from the list to preview.</p>
            )}
          </div>
        </div>
        {signatureUploadIntent ? (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="sig-modal-title">
            <div className="w-full max-w-md rounded-xl border border-line bg-white p-4 shadow-xl">
              <h4 id="sig-modal-title" className="text-sm font-semibold text-ink">Signature upload</h4>
              <p className="mt-1 text-[11px] text-muted">File: {signatureUploadIntent.name}</p>
              <p className="mt-2 text-[11px] text-muted">Name and position appear under the signature only when filled; empty fields stay blank on the document.</p>
              <div className="mt-3 grid gap-2">
                <Input label="Signatory name" value={signatoryFormName} onChange={(event) => setSignatoryFormName(event.target.value)} labelClassName="mb-0.5 text-[10px]" inputClassName="h-8 rounded-lg px-2 text-sm" />
                <Input label="Signatory position" value={signatoryFormPosition} onChange={(event) => setSignatoryFormPosition(event.target.value)} labelClassName="mb-0.5 text-[10px]" inputClassName="h-8 rounded-lg px-2 text-sm" />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => setSignatureUploadIntent(null)} disabled={uploadingLogo}>Cancel</Button>
                <Button type="button" size="sm" onClick={() => void confirmSignatureUploadFromModal()} disabled={uploadingLogo}>{uploadingLogo ? "Uploading…" : "Upload"}</Button>
              </div>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
