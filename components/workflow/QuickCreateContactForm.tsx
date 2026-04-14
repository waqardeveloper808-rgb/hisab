"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import type { ContactKind, ContactRecord } from "@/components/workflow/types";

type QuickCreateContactFormProps = {
  kind: ContactKind;
  initialName: string;
  onSubmit: (payload: {
    kind: ContactKind;
    displayName: string;
    email: string;
    phone: string;
    city: string;
  }) => Promise<ContactRecord>;
  onComplete: (contact: ContactRecord) => void;
};

export function QuickCreateContactForm({ kind, initialName, onSubmit, onComplete }: QuickCreateContactFormProps) {
  const [displayName, setDisplayName] = useState(initialName);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Riyadh");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const contact = await onSubmit({ kind, displayName, email, phone, city });
    setSaving(false);
    onComplete(contact);
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
      <Input label={kind === "customer" ? "Customer name" : "Supplier name"} value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
      <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.sa" />
      <Input label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+966 5X XXX XXXX" />
      <Input label="City" value={city} onChange={(event) => setCity(event.target.value)} />
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" disabled={saving || !displayName.trim()}>
          {saving ? "Saving…" : kind === "customer" ? "Save customer" : "Save supplier"}
        </Button>
      </div>
    </form>
  );
}