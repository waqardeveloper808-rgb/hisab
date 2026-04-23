"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Card } from "@/components/Card";
import type { DocumentCenterRecord } from "@/lib/workspace-api";

const qrCodeCache = new Map<string, string>();

type ZatcaQrPanelProps = {
  invoice: DocumentCenterRecord;
  compact?: boolean;
};

function encodeTlvField(tag: number, value: string) {
  const valueBytes = new TextEncoder().encode(value);
  return new Uint8Array([tag, valueBytes.length, ...valueBytes]);
}

function toBase64(bytes: Uint8Array) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

function buildPayload(invoice: DocumentCenterRecord) {
  const timestamp = `${invoice.issueDate || new Date().toISOString().slice(0, 10)}T09:30:00`;
  const sellerName = String(invoice.customFields.seller_name_en ?? invoice.customFields.seller_name ?? "Gulf Hisab");
  const sellerVatNumber = String(invoice.customFields.seller_vat_number ?? invoice.customFields.vat_number ?? "");
  const fields = [
    encodeTlvField(1, sellerName),
    encodeTlvField(2, sellerVatNumber),
    encodeTlvField(3, timestamp),
    encodeTlvField(4, invoice.grandTotal.toFixed(2)),
    encodeTlvField(5, invoice.taxTotal.toFixed(2)),
  ];
  const totalLength = fields.reduce((sum, field) => sum + field.length, 0);
  const payload = new Uint8Array(totalLength);
  let offset = 0;

  fields.forEach((field) => {
    payload.set(field, offset);
    offset += field.length;
  });

  return toBase64(payload);
}

export function ZatcaQrPanel({ invoice, compact = false }: ZatcaQrPanelProps) {
  const payload = buildPayload(invoice);
  const cachedQrSrc = qrCodeCache.get(payload) ?? "";
  const [qrSrc, setQrSrc] = useState(cachedQrSrc);
  const timestamp = `${invoice.issueDate || new Date().toISOString().slice(0, 10)}T09:30:00`;
  const qrSize = compact ? 128 : 152;
  const sellerName = String(invoice.customFields.seller_name_en ?? invoice.customFields.seller_name ?? "Gulf Hisab");
  const sellerVatNumber = String(invoice.customFields.seller_vat_number ?? invoice.customFields.vat_number ?? "Not available");

  useEffect(() => {
    let active = true;

    if (cachedQrSrc) {
      return () => {
        active = false;
      };
    }

    QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: qrSize,
    }).then((nextSrc) => {
      if (active) {
        qrCodeCache.set(payload, nextSrc);
        setQrSrc(nextSrc);
      }
    }).catch((err: unknown) => {
      console.error('[ZatcaQrPanel] QR code generation failed:', err);
      active = false;
    });

    return () => {
      active = false;
    };
  }, [cachedQrSrc, payload, qrSize]);

  const visibleQrSrc = cachedQrSrc || qrSrc;

  return (
    <Card className={["rounded-[1.35rem] bg-white/95", compact ? "p-3" : "p-4"].join(" ")} data-zatca-panel="true">
      <div className={["flex gap-4", compact ? "flex-col" : "flex-col md:flex-row md:items-start md:justify-between"].join(" ")}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">ZATCA</p>
          <h2 className={["mt-1.5 font-semibold text-ink", compact ? "text-base" : "text-lg"].join(" ")}>Invoice QR exposure</h2>
          <div className={["mt-3 grid gap-1.5 text-muted", compact ? "text-[13px] leading-5" : "text-sm"].join(" ")}>
            <p>Company: {sellerName} |</p>
            <p>VAT Number: {sellerVatNumber}</p>
            <p>Timestamp: {timestamp}</p>
            <p>Invoice Total: {invoice.grandTotal.toFixed(2)}</p>
            <p>VAT Total: {invoice.taxTotal.toFixed(2)}</p>
          </div>
        </div>
        <div className={["rounded-[1.1rem] border border-line bg-surface-soft p-2.5", compact ? "self-start" : ""].join(" ")}>
          {visibleQrSrc ? (
            <Image
              src={visibleQrSrc}
              alt="ZATCA QR Code"
              width={qrSize}
              height={qrSize}
              unoptimized
              data-zatca-qr="true"
              data-zatca-payload={payload}
            />
          ) : (
            <div className="flex items-center justify-center text-sm text-muted" style={{ height: qrSize, width: qrSize }}>Generating QR…</div>
          )}
        </div>
      </div>
    </Card>
  );
}