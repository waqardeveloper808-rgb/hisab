"use client";

import { useState, useRef } from "react";
import type { Attachment, AttachmentDocumentTag } from "@/lib/accounting-engine";

type AttachmentUploaderProps = {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
};

const TAG_OPTIONS: AttachmentDocumentTag[] = [
  "invoice_pdf", "receipt", "contract_reference", "bank_statement", "delivery_note",
  "supplier_bill", "goods_receipt", "customs_document", "transport_document",
  "payroll_document", "signed_paper", "journal_support", "other",
];

export function AttachmentUploader({
  attachments,
  onChange,
  maxFiles = 10,
  maxSizeMB = 5,
}: AttachmentUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const remaining = maxFiles - attachments.length;
    const newAttachments: Attachment[] = [];

    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const f = files[i];
      if (f.size > maxSizeMB * 1024 * 1024) continue;
      newAttachments.push({
        id: Date.now() + i,
        fileName: f.name,
        mimeType: f.type || "application/octet-stream",
        fileSize: f.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: "current-user",
        url: "",
        documentTag: "other",
      });
    }
    if (newAttachments.length) onChange([...attachments, ...newAttachments]);
  }

  function removeAttachment(id: number) {
    onChange(attachments.filter((a) => a.id !== id));
  }

  function updateTag(id: number, tag: AttachmentDocumentTag) {
    onChange(attachments.map((a) => (a.id === id ? { ...a, documentTag: tag } : a)));
  }

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragOver ? "border-emerald-500 bg-emerald-50" : "border-gray-300 hover:border-gray-400"
        }`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
          accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv,.doc,.docx"
        />
        <p className="text-sm text-muted">
          Drop files here or <span className="text-emerald-700 font-medium">browse</span>
        </p>
        <p className="text-xs text-muted mt-1">
          Max {maxSizeMB}MB per file · {maxFiles - attachments.length} slots remaining
        </p>
      </div>

      {attachments.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="truncate flex-1 font-medium text-ink">{a.fileName}</span>
              <select
                value={a.documentTag}
                onChange={(e) => updateTag(a.id, e.target.value as Attachment["documentTag"])}
                className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white"
              >
                {TAG_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
              <span className="text-xs text-muted">{(a.fileSize / 1024).toFixed(0)} KB</span>
              <button
                type="button"
                onClick={() => removeAttachment(a.id)}
                className="text-red-500 hover:text-red-700 text-xs font-medium"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
