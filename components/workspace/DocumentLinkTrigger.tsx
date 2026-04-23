"use client";

import { useRef } from "react";
import { getDocumentEditHref } from "@/components/workspace/DocumentLinkPreviewModal";

type DocumentLink = {
  documentId?: number | null;
  documentNumber: string;
  documentType: string;
  status?: string | null;
};

type DocumentLinkTriggerProps = {
  link: DocumentLink;
  className?: string;
  onPreview: (link: DocumentLink) => void;
  onNavigate?: () => void;
};

export function DocumentLinkTrigger({ link, className, onPreview, onNavigate }: DocumentLinkTriggerProps) {
  const clickTimer = useRef<number | null>(null);

  function clearTimer() {
    if (clickTimer.current) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
  }

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    clearTimer();
    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null;

      if (link.documentId) {
        onNavigate?.();
        window.location.href = getDocumentEditHref(link.documentId, link.documentType);
        return;
      }

      onPreview(link);
    }, 180);
  }

  function handleDoubleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    clearTimer();
    onPreview(link);
  }

  return (
    <button type="button" onClick={handleClick} onDoubleClick={handleDoubleClick} className={className}>
      {link.documentNumber}
    </button>
  );
}