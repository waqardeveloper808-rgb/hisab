"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { buildTemplateRegister } from "@/data/document-template-adapter";
import {
  listDocumentTemplates,
  previewDocumentTemplate,
  updateDocumentTemplate,
  type DocumentTemplateRecord,
} from "@/lib/workspace-api";

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
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [draft, setDraft] = useState<DocumentTemplateRecord | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    listDocumentTemplates()
      .then((records) => {
        if (!active) {
          return;
        }

        setTemplates(records);

        if (records[0]) {
          setSelectedTemplateId(records[0].id);
          setDraft(cloneTemplate(records[0]));
        }
      })
      .catch(() => {
        if (active) {
          setTemplates([]);
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

    previewDocumentTemplate({
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

    return () => {
      active = false;
    };
  }, [draft]);

  const groups = useMemo(() => buildTemplateRegister(templates), [templates]);

  const tableHead = (
    <thead className="border-b border-line bg-surface-soft/70">
      <tr>
        <th className="px-4 py-3 text-left font-semibold text-muted">Template Name</th>
        <th className="px-4 py-3 text-left font-semibold text-muted">Document Type</th>
        <th className="px-4 py-3 text-left font-semibold text-muted">Language</th>
        <th className="px-4 py-3 text-left font-semibold text-muted">Default</th>
        <th className="px-4 py-3 text-left font-semibold text-muted">Last Updated</th>
        <th className="px-4 py-3 text-left font-semibold text-muted">Actions</th>
      </tr>
    </thead>
  );

  function selectTemplate(template: DocumentTemplateRecord) {
    setSelectedTemplateId(template.id);
    setDraft(cloneTemplate(template));
    setFeedback(null);
    setError(null);
  }

  function updateDraft(partial: Partial<DocumentTemplateRecord>) {
    setDraft((current) => (current ? { ...current, ...partial } : current));
  }

  async function handleSetDefault(template: DocumentTemplateRecord) {
    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const updated = await updateDocumentTemplate({
        ...template,
        isDefault: true,
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
    if (!draft || draft.id >= 900) {
      setFeedback("Fallback templates are for structure only. Connect backend templates to save changes.");
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

  function handleDuplicate(template: DocumentTemplateRecord) {
    const duplicate: DocumentTemplateRecord = {
      ...cloneTemplate(template),
      id: Date.now(),
      name: `${template.name} Copy`,
      isDefault: false,
    };

    setTemplates((current) => [duplicate, ...current]);
    setSelectedTemplateId(duplicate.id);
    setDraft(duplicate);
    setFeedback(`${template.name} duplicated.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Document Templates</h1>
          <p className="text-sm text-muted">Manage layouts by document type.</p>
        </div>
        {draft ? <Button variant="secondary" onClick={handleSave} disabled={saving}>{saving ? "Saving" : "Save"}</Button> : null}
      </div>

      {feedback ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{feedback}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_22rem]">
        <Card className="rounded-[1.25rem] bg-white/95 p-0 overflow-hidden">
          {loading ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                {tableHead}
                <tbody>
                  <tr>
                    <td className="px-4 py-4 text-sm text-muted" colSpan={6}>Loading templates...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                {tableHead}
                <tbody>
                  {groups.flatMap((group) => group.templates.map((template, index) => {
                    const active = selectedTemplateId === template.id;

                    return (
                      <tr key={`${group.documentType}-${template.id}-${index}`} className={active ? "bg-primary-soft/35" : "border-t border-line/70"}>
                        <td className="px-4 py-3">
                          <button type="button" className="text-left font-semibold text-ink hover:text-primary" onClick={() => selectTemplate(template)}>
                            {template.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-muted">{group.label}</td>
                        <td className="px-4 py-3 text-muted">{formatLocale(template.localeMode)}</td>
                        <td className="px-4 py-3">{template.isDefault ? <span className="rounded-full bg-primary-soft px-2 py-1 text-xs font-semibold text-primary">Default</span> : template.isActive ? <span className="rounded-full bg-surface-soft px-2 py-1 text-xs font-semibold text-muted">Active</span> : <span className="rounded-full bg-surface-soft px-2 py-1 text-xs font-semibold text-muted">Inactive</span>}</td>
                        <td className="px-4 py-3 text-muted">{formatUpdated(template.id)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button type="button" className="text-xs font-semibold text-primary" onClick={() => selectTemplate(template)}>Edit</button>
                            <button type="button" className="text-xs font-semibold text-primary" onClick={() => handleDuplicate(template)}>Duplicate</button>
                            <button type="button" className="text-xs font-semibold text-primary" onClick={() => selectTemplate(template)}>Preview</button>
                            <button type="button" className="text-xs font-semibold text-primary disabled:text-muted" onClick={() => handleSetDefault(template)} disabled={saving || template.isDefault}>Set Default</button>
                          </div>
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="rounded-[1.25rem] bg-white/95 p-4">
          {draft ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-ink">Template editor</h2>
                <p className="text-sm text-muted">Edit the selected template.</p>
              </div>
              <Input label="Template name" value={draft.name} onChange={(event) => updateDraft({ name: event.target.value })} />
              <div>
                <label htmlFor="template-language" className="mb-2 block text-sm font-semibold text-ink">Language</label>
                <select id="template-language" value={draft.localeMode} onChange={(event) => updateDraft({ localeMode: event.target.value })} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                  <option value="bilingual">Bilingual</option>
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
              <div>
                <label htmlFor="template-status" className="mb-2 block text-sm font-semibold text-ink">Status</label>
                <select id="template-status" value={draft.isActive ? "active" : "inactive"} onChange={(event) => updateDraft({ isActive: event.target.value === "active" })} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Document type</p>
                <div className="rounded-xl border border-line bg-surface-soft px-3 py-2.5 text-sm text-ink">{draft.documentTypes[0]?.replaceAll("_", " ") || "Unassigned"}</div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Preview</p>
                <div className="max-h-[22rem] overflow-auto rounded-xl border border-line bg-surface-soft p-3 text-xs text-muted">
                  {previewHtml ? <div dangerouslySetInnerHTML={{ __html: previewHtml }} /> : "Preview unavailable in current context."}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted">Select a template to edit.</div>
          )}
        </Card>
      </div>
    </div>
  );
}