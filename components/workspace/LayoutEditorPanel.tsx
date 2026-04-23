"use client";

import { useCallback, useState } from "react";
import { useLayoutEditor } from "@/components/workspace/LayoutEditorProvider";
import type { LayoutOverride } from "@/lib/layout-engine";

/* ----------------------------------------------------------------
   SMALL INPUT HELPERS
   ---------------------------------------------------------------- */

function PanelField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="shrink-0 text-[10px] font-semibold text-muted w-20 truncate">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "auto"}
        className="h-6 w-full rounded border border-line bg-white px-1.5 text-[11px] text-ink outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/10"
      />
    </div>
  );
}

function PanelSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="shrink-0 text-[10px] font-semibold text-muted w-20 truncate">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-full rounded border border-line bg-white px-1 text-[11px] text-ink outline-none focus:border-primary/60"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function PanelToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] font-semibold text-muted">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={["h-5 w-9 rounded-full transition", checked ? "bg-primary" : "bg-gray-200"].join(" ")}
      >
        <span className={["block h-4 w-4 rounded-full bg-white shadow transition", checked ? "translate-x-4" : "translate-x-0.5"].join(" ")} />
      </button>
    </div>
  );
}

function PanelSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line/60 pb-2">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink">
        <span>{title}</span>
        <span className="text-[11px] text-muted">{open ? "▾" : "▸"}</span>
      </button>
      {open ? <div className="mt-1 space-y-1.5">{children}</div> : null}
    </div>
  );
}

/* ----------------------------------------------------------------
   MAIN PANEL
   ---------------------------------------------------------------- */

export function LayoutEditorPanel() {
  const editor = useLayoutEditor();
  const [presetName, setPresetName] = useState("");

  const region = editor.selectedRegion;
  const override = region ? editor.getRegionOverride(region.id) ?? {} : {};

  const update = useCallback((key: keyof LayoutOverride, value: string) => {
    if (!region) return;
    editor.updateOverride(region.id, { [key]: value || undefined });
  }, [editor, region]);

  if (!editor.active) return null;

  return (
    <aside className="fixed right-0 top-0 z-50 flex h-screen w-[28vw] min-w-[280px] max-w-[400px] flex-col border-l border-line bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">Layout Editor</p>
          <p className="text-[11px] text-muted">{region ? region.label : "Select a region"}</p>
        </div>
        <button type="button" onClick={() => editor.setActive(false)} className="rounded border border-line px-2 py-0.5 text-[10px] font-semibold text-muted hover:bg-surface-soft">
          Close
        </button>
      </div>

      {/* Scrollable controls */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {region ? (
          <>
            {/* Region info */}
            <div className="rounded border border-line/60 bg-surface-soft/50 px-2 py-1.5 text-[10px]">
              <div className="flex justify-between"><span className="text-muted">Region</span><span className="font-semibold text-ink">{region.id}</span></div>
              <div className="flex justify-between"><span className="text-muted">Tag</span><span className="font-semibold text-ink">{region.tag}</span></div>
            </div>

            {/* A. Layout */}
            <PanelSection title="Layout">
              <PanelField label="Width" value={override.width ?? ""} onChange={(v) => update("width", v)} placeholder="auto" />
              <PanelField label="Min Width" value={override.minWidth ?? ""} onChange={(v) => update("minWidth", v)} />
              <PanelField label="Max Width" value={override.maxWidth ?? ""} onChange={(v) => update("maxWidth", v)} />
              <PanelField label="Height" value={override.height ?? ""} onChange={(v) => update("height", v)} />
              <PanelField label="Min Height" value={override.minHeight ?? ""} onChange={(v) => update("minHeight", v)} />
              <PanelField label="Max Height" value={override.maxHeight ?? ""} onChange={(v) => update("maxHeight", v)} />
            </PanelSection>

            {/* B. Spacing */}
            <PanelSection title="Spacing">
              <PanelField label="Margin T" value={override.marginTop ?? ""} onChange={(v) => update("marginTop", v)} placeholder="0" />
              <PanelField label="Margin R" value={override.marginRight ?? ""} onChange={(v) => update("marginRight", v)} placeholder="0" />
              <PanelField label="Margin B" value={override.marginBottom ?? ""} onChange={(v) => update("marginBottom", v)} placeholder="0" />
              <PanelField label="Margin L" value={override.marginLeft ?? ""} onChange={(v) => update("marginLeft", v)} placeholder="0" />
              <PanelField label="Padding T" value={override.paddingTop ?? ""} onChange={(v) => update("paddingTop", v)} placeholder="0" />
              <PanelField label="Padding R" value={override.paddingRight ?? ""} onChange={(v) => update("paddingRight", v)} placeholder="0" />
              <PanelField label="Padding B" value={override.paddingBottom ?? ""} onChange={(v) => update("paddingBottom", v)} placeholder="0" />
              <PanelField label="Padding L" value={override.paddingLeft ?? ""} onChange={(v) => update("paddingLeft", v)} placeholder="0" />
              <PanelField label="Gap" value={override.gap ?? ""} onChange={(v) => update("gap", v)} placeholder="0" />
            </PanelSection>

            {/* C. Box Style */}
            <PanelSection title="Box Style">
              <PanelField label="Border Radius" value={override.borderRadius ?? ""} onChange={(v) => update("borderRadius", v)} />
              <PanelField label="Border Width" value={override.borderWidth ?? ""} onChange={(v) => update("borderWidth", v)} />
              <PanelField label="Border Color" value={override.borderColor ?? ""} onChange={(v) => update("borderColor", v)} type="color" />
              <PanelField label="BG Color" value={override.backgroundColor ?? ""} onChange={(v) => update("backgroundColor", v)} type="color" />
              <PanelSelect
                label="Shadow"
                value={override.boxShadow ?? ""}
                onChange={(v) => update("boxShadow", v)}
                options={[
                  { label: "None", value: "" },
                  { label: "XS", value: "0 1px 2px rgba(0,0,0,0.05)" },
                  { label: "SM", value: "0 1px 3px rgba(0,0,0,0.1)" },
                  { label: "MD", value: "0 4px 6px rgba(0,0,0,0.1)" },
                  { label: "LG", value: "0 10px 15px rgba(0,0,0,0.1)" },
                ]}
              />
            </PanelSection>

            {/* D. Typography */}
            <PanelSection title="Typography">
              <PanelField label="Font Size" value={override.fontSize ?? ""} onChange={(v) => update("fontSize", v)} placeholder="inherit" />
              <PanelSelect
                label="Weight"
                value={override.fontWeight ?? ""}
                onChange={(v) => update("fontWeight", v)}
                options={[
                  { label: "Inherit", value: "" },
                  { label: "Normal (400)", value: "400" },
                  { label: "Medium (500)", value: "500" },
                  { label: "Semibold (600)", value: "600" },
                  { label: "Bold (700)", value: "700" },
                  { label: "Extra Bold (800)", value: "800" },
                ]}
              />
              <PanelField label="Line Height" value={override.lineHeight ?? ""} onChange={(v) => update("lineHeight", v)} />
              <PanelField label="Letter Sp." value={override.letterSpacing ?? ""} onChange={(v) => update("letterSpacing", v)} />
              <PanelField label="Color" value={override.color ?? ""} onChange={(v) => update("color", v)} type="color" />
              <PanelSelect
                label="Align"
                value={override.textAlign ?? ""}
                onChange={(v) => update("textAlign", v)}
                options={[{ label: "Inherit", value: "" }, { label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" }]}
              />
              <PanelSelect
                label="Transform"
                value={override.textTransform ?? ""}
                onChange={(v) => update("textTransform", v)}
                options={[{ label: "None", value: "" }, { label: "Uppercase", value: "uppercase" }, { label: "Capitalize", value: "capitalize" }, { label: "Lowercase", value: "lowercase" }]}
              />
            </PanelSection>

            {/* E. Content Density (via presets) */}
            <PanelSection title="Density / Presets">
              <div className="space-y-1">
                {[...editor.presets, ...editor.customPresets].map((preset) => (
                  <div key={preset.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => editor.applyPreset(preset.id, "region")}
                      className="flex-1 rounded border border-line px-2 py-1 text-left text-[10px] font-semibold text-ink hover:bg-primary-soft hover:text-primary"
                    >
                      {preset.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.applyPreset(preset.id, "page")}
                      className="rounded border border-line px-1.5 py-1 text-[9px] font-semibold text-muted hover:bg-surface-soft"
                      title="Apply to page"
                    >
                      Page
                    </button>
                    {preset.id.startsWith("custom-") ? (
                      <button type="button" onClick={() => editor.removePreset(preset.id)} className="text-[10px] text-red-400 hover:text-red-600" title="Delete">×</button>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-1">
                <input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset name..."
                  className="h-6 flex-1 rounded border border-line bg-white px-1.5 text-[10px] outline-none focus:border-primary/60"
                />
                <button
                  type="button"
                  onClick={() => { if (presetName.trim()) { editor.savePreset(presetName.trim(), "region"); setPresetName(""); } }}
                  className="rounded bg-primary px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-primary/90"
                >
                  Save
                </button>
              </div>
            </PanelSection>

            {/* F. Visibility */}
            <PanelSection title="Visibility">
              <PanelSelect
                label="Display"
                value={override.display ?? ""}
                onChange={(v) => update("display", v)}
                options={[{ label: "Default", value: "" }, { label: "Block", value: "block" }, { label: "Flex", value: "flex" }, { label: "Grid", value: "grid" }, { label: "Hidden", value: "none" }, { label: "Inline Flex", value: "inline-flex" }]}
              />
              <PanelToggle label="Hide on Mobile" checked={!!override.hideOnMobile} onChange={() => update("hideOnMobile" as keyof LayoutOverride, override.hideOnMobile ? "" : "true")} />
              <PanelToggle label="Hide on Desktop" checked={!!override.hideOnDesktop} onChange={() => update("hideOnDesktop" as keyof LayoutOverride, override.hideOnDesktop ? "" : "true")} />
            </PanelSection>

            {/* G. Text Override */}
            <PanelSection title="Text Override" defaultOpen={false}>
              <PanelField label="Text" value={override.textOverride ?? ""} onChange={(v) => update("textOverride" as keyof LayoutOverride, v)} placeholder="Override text..." />
            </PanelSection>

            {/* H. Actions */}
            <PanelSection title="Actions">
              <div className="flex flex-wrap gap-1">
                <button type="button" onClick={() => editor.resetRegion(region.id)} className="rounded border border-line px-2 py-1 text-[10px] font-semibold text-muted hover:bg-red-50 hover:text-red-600">Reset Region</button>
                <button type="button" onClick={editor.resetPage} className="rounded border border-line px-2 py-1 text-[10px] font-semibold text-muted hover:bg-red-50 hover:text-red-600">Reset Page</button>
                <button type="button" onClick={editor.resetAll} className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-100">Reset All</button>
              </div>
            </PanelSection>
          </>
        ) : (
          <div className="py-6 text-center">
            <p className="text-xs font-semibold text-ink">No region selected</p>
            <p className="mt-1 text-[11px] text-muted">Click any outlined region on the page to inspect and edit its layout properties.</p>
            <div className="mt-4 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Quick Density</p>
              {editor.presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => editor.applyPreset(preset.id, "global")}
                  className="block w-full rounded border border-line px-2 py-1.5 text-left text-[11px] font-semibold text-ink hover:bg-primary-soft hover:text-primary"
                >
                  {preset.name} <span className="text-muted">(global)</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-line px-3 py-2 text-[10px] text-muted">
        Layout changes persist across refresh · {Object.keys(editor.overrides).length} override{Object.keys(editor.overrides).length === 1 ? "" : "s"} active
      </div>
    </aside>
  );
}
