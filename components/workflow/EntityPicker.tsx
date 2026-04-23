"use client";

import { useDeferredValue, useEffect, useId, useRef, useState } from "react";
import type { PickerOption } from "@/components/workflow/types";

type EntityPickerProps = {
  label: string;
  placeholder: string;
  selectedOption: PickerOption | null;
  onSearch: (query: string) => Promise<PickerOption[]>;
  onSelect: (option: PickerOption) => void;
  createLabel: string;
  onCreateNew: (query: string) => void;
  validationMessage?: string;
  disabled?: boolean;
  browseLabel?: string;
};

export function EntityPicker({
  label,
  placeholder,
  selectedOption,
  onSearch,
  onSelect,
  createLabel,
  onCreateNew,
  validationMessage,
  disabled = false,
  browseLabel,
}: EntityPickerProps) {
  const listId = useId();
  const triggerId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<PickerOption[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const visibleOptions = open ? options : [];
  const currentLabel = selectedOption?.label ?? placeholder;

  useEffect(() => {
    if (! open) {
      return;
    }

    let active = true;
    const runSearch = async () => {
      setLoading(true);
      const nextOptions = await onSearch(deferredQuery);

      if (! active) {
        return;
      }

      setOptions(nextOptions);
      setActiveIndex(0);
      setLoading(false);
    };

    void runSearch();

    return () => {
      active = false;
    };
  }, [deferredQuery, onSearch, open]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (! rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) {
      return;
    }

    if (! open && ["ArrowDown", "Enter"].includes(event.key)) {
      setOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, Math.max(options.length - 1, 0)));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === "Enter" && open) {
      event.preventDefault();

      const activeOption = options[activeIndex];
      if (activeOption) {
        onSelect(activeOption);
        setQuery("");
        setOpen(false);
        return;
      }

      onCreateNew(query);
      setOpen(false);
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-2.5 block text-sm font-semibold text-ink">{label}</label>
      <div className={[
        "flex overflow-hidden rounded-xl border bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
        validationMessage ? "border-red-300 ring-4 ring-red-100" : "border-line-strong hover:border-primary/35",
      ].join(" ")}>
        <button
          id={triggerId}
          type="button"
          disabled={disabled}
          aria-label={label}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => {
            if (!disabled) {
              setOpen(true);
            }
          }}
          className="flex min-w-0 flex-1 items-center justify-between px-3 py-2.5 text-left disabled:cursor-not-allowed disabled:opacity-70"
        >
          <div className="min-w-0">
            <p className={selectedOption ? "truncate text-sm font-semibold text-ink" : "truncate text-sm text-muted"}>
              {currentLabel}
            </p>
            {selectedOption?.caption ? <p className="mt-1 truncate text-xs text-muted">{selectedOption.caption}</p> : null}
          </div>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setQuery("");
            setOpen(true);
          }}
          className="border-l border-line bg-surface-soft px-3 text-sm font-semibold text-muted disabled:cursor-not-allowed disabled:opacity-70"
          aria-label={browseLabel ?? `Browse all ${label.toLowerCase()}s`}
        >
          ⌄
        </button>
      </div>
      {validationMessage ? <p className="mt-2 text-xs text-red-600">{validationMessage}</p> : null}

      {open && !disabled ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-xl border border-line bg-white shadow-[0_18px_36px_-22px_rgba(17,32,24,0.24)]">
          <div className="border-b border-line px-3 py-3">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              aria-labelledby={triggerId}
              aria-controls={listId}
              className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div className="max-h-72 overflow-y-auto py-1.5" role="listbox" id={listId}>
            {loading ? <div className="px-3 py-3 text-sm text-muted">Loading...</div> : null}
            {! loading && visibleOptions.length === 0 ? (
              <div className="px-3 py-3 text-sm text-muted">
                {query.trim() ? "No matching records." : "Start typing, use the arrow to browse all records, or create a new one."}
              </div>
            ) : null}
            {! loading && visibleOptions.map((option, index) => (
              <div key={`${option.group ?? "row"}-${option.id}-${index}`}>
                {option.group && (index === 0 || visibleOptions[index - 1]?.group !== option.group) ? (
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{option.group}</div>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    onSelect(option);
                    setQuery("");
                    setOpen(false);
                  }}
                  className={[
                    "flex w-full items-center justify-between px-3 py-2 text-left",
                    activeIndex === index ? "bg-primary-soft/70" : "hover:bg-surface-soft",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{option.label}</p>
                    {option.caption ? <p className="truncate text-xs text-muted">{option.caption}</p> : null}
                  </div>
                  {option.meta ? <span className="ml-3 shrink-0 text-[11px] font-semibold text-muted">{option.meta}</span> : null}
                </button>
              </div>
            ))}
          </div>
          <div className="border-t border-line bg-surface-soft px-2 py-2">
            <button
              type="button"
              onClick={() => {
                onCreateNew(query);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-left text-sm font-semibold text-ink hover:bg-primary-soft hover:text-primary"
            >
              <span>{createLabel}</span>
              <span className="text-primary">Add now</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}