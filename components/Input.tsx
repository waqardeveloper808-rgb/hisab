import type { InputHTMLAttributes } from "react";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
};

function createInputId(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function Input({
  label,
  hint,
  error,
  id,
  className = "",
  labelClassName = "",
  inputClassName = "",
  type = "text",
  ...props
}: InputProps) {
  const inputId = id ?? createInputId(label);
  const describedBy = [
    hint ? `${inputId}-hint` : null,
    error ? `${inputId}-error` : null,
  ].filter(Boolean).join(" ");

  return (
    <div className={className}>
      <label htmlFor={inputId} className={["mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink", labelClassName].filter(Boolean).join(" ")}>
        {label}
        {props.required ? <span className="ml-1 text-red-600">*</span> : null}
      </label>
      <input
        id={inputId}
        type={type}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        className={[
          "block h-[var(--control-input)] w-full rounded-[var(--radius-sm)] border bg-white px-2.5 text-sm text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none placeholder:text-muted/70 focus:bg-white focus:ring-2",
          error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-line-strong focus:border-brand/45 focus:ring-brand/10",
          inputClassName,
        ].filter(Boolean).join(" ")}
        {...props}
      />
      {error ? <p id={`${inputId}-error`} className="mt-0.5 text-[10px] text-red-600">{error}</p> : null}
      {!error && hint ? <p id={`${inputId}-hint`} className="mt-0.5 text-[10px] text-muted">{hint}</p> : null}
    </div>
  );
}