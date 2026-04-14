"use client";

import { Button } from "@/components/Button";

type QuickCreateDialogProps = {
  title: string;
  description: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function QuickCreateDialog({ title, description, open, onClose, children }: QuickCreateDialogProps) {
  if (! open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_30px_70px_-32px_rgba(17,32,24,0.28)]">
        <div className="flex items-start justify-between gap-6 border-b border-line bg-surface-soft px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-primary">Add and continue</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink">{title}</h2>
            <p className="mt-2 text-sm text-muted">{description}</p>
          </div>
          <Button variant="tertiary" onClick={onClose} aria-label="Close form">
            Close
          </Button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}