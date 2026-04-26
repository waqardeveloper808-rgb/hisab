"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Moon, Palette, Sun } from "lucide-react";
import {
  WSV2_THEMES,
  WSV2_THEME_LABELS,
  useWsV2Theme,
  type WsV2Theme,
} from "@/lib/workspace-v2/use-theme";

const THEME_ICONS: Record<WsV2Theme, React.ReactNode> = {
  light: <Sun size={13} />,
  comfort: <Palette size={13} />,
  dark: <Moon size={13} />,
};

export function WorkspaceV2ThemeSwitcher() {
  const { theme, setTheme } = useWsV2Theme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="wsv2-theme-switcher" ref={ref}>
      <button
        type="button"
        className="wsv2-icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change theme"
        title={`Theme: ${WSV2_THEME_LABELS[theme]}`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        {THEME_ICONS[theme]}
        <span className="wsv2-theme-switcher-label">{WSV2_THEME_LABELS[theme]}</span>
      </button>
      {open ? (
        <div className="wsv2-theme-menu" role="menu">
          {WSV2_THEMES.map((value) => {
            const active = value === theme;
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                data-active={active ? "true" : "false"}
                onClick={(event) => {
                  event.stopPropagation();
                  setTheme(value);
                  setOpen(false);
                }}
              >
                <span className="icon">{THEME_ICONS[value]}</span>
                <span className="label">{WSV2_THEME_LABELS[value]}</span>
                {active ? <Check size={13} className="check" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
