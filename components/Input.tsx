import type { InputHTMLAttributes } from "react";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  hint?: string;
  className?: string;
};

function createInputId(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function Input({
  label,
  hint,
  id,
  className = "",
  type = "text",
  ...props
}: InputProps) {
  const inputId = id ?? createInputId(label);

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-2.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        className="block w-full rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-sm text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none placeholder:text-muted/70 focus:border-brand/45 focus:bg-white focus:ring-4 focus:ring-brand/10"
        {...props}
      />
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}