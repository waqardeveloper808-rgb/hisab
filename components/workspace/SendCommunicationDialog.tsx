"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { createCommunication, listCommunicationTemplates, type CommunicationRecord, type CommunicationTemplateOptionRecord } from "@/lib/workspace-api";

type SendCommunicationDialogProps = {
  open: boolean;
  documentId: number | null;
  documentType: string;
  defaultEmail?: string;
  onClose: () => void;
  onSent: (communication: CommunicationRecord) => void;
};

export function SendCommunicationDialog({ open, documentId, documentType, defaultEmail = "", onClose, onSent }: SendCommunicationDialogProps) {
  const [templates, setTemplates] = useState<CommunicationTemplateOptionRecord[]>([]);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    setEmail(defaultEmail);
    setSubject("");
    setError(null);

    listCommunicationTemplates()
      .then((records) => {
        if (!active) {
          return;
        }

        const emailTemplates = records.filter((entry) => entry.channel === "email" && (!entry.sourceType || entry.sourceType === "document"));
        setTemplates(emailTemplates);
        setTemplateId(emailTemplates.find((entry) => entry.isDefault)?.id ?? emailTemplates[0]?.id ?? null);
      })
      .catch((err: unknown) => {
        console.error('[SendCommunicationDialog] failed to load templates:', err);
        if (active) {
          setTemplates([]);
        }
      });

    return () => {
      active = false;
    };
  }, [defaultEmail, open]);

  async function handleSubmit() {
    if (!documentId) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      const created = await createCommunication({
        channel: "email",
        sourceType: "document",
        sourceId: documentId,
        sourceRecordType: documentType,
        templateId,
        email,
        subject,
      });
      onSent(created);
      onClose();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Communication could not be sent.");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-4">
      <Card className="w-full max-w-xl space-y-4 border-line-strong bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Communication</p>
            <h3 className="text-lg font-semibold text-ink">Send document</h3>
            <p className="text-sm text-muted">This send goes through the Communication module and records delivery attempts.</p>
          </div>
          <Button size="xs" variant="tertiary" onClick={onClose}>Close</Button>
        </div>

        {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink" htmlFor="communication-template">Template</label>
            <select
              id="communication-template"
              className="block h-[var(--control-input)] w-full rounded-[var(--radius-sm)] border border-line-strong bg-white px-2.5 text-sm text-ink outline-none focus:border-brand/45 focus:ring-2 focus:ring-brand/10"
              value={templateId ?? ""}
              onChange={(event) => setTemplateId(event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">Default template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </div>
          <Input label="Recipient email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>

        <Input label="Subject override" value={subject} onChange={(event) => setSubject(event.target.value)} hint="Leave blank to use the template or document default subject." />

        <div className="flex justify-end gap-2">
          <Button variant="tertiary" onClick={onClose}>Cancel</Button>
          <Button disabled={sending || !email.trim()} onClick={() => void handleSubmit()}>{sending ? "Sending..." : "Send via Communication"}</Button>
        </div>
      </Card>
    </div>
  );
}