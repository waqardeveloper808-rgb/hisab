// Workspace — browser download helpers.
// Pure-V2 module; no engine imports.

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke after the click has been handled.
  window.setTimeout(() => URL.revokeObjectURL(url), 200);
}

export function downloadText(
  contents: string,
  filename: string,
  mime: string = "text/plain;charset=utf-8",
): void {
  downloadBlob(new Blob([contents], { type: mime }), filename);
}

export function downloadXml(contents: string, filename: string): void {
  downloadText(contents, filename, "application/xml;charset=utf-8");
}

export function downloadBytes(
  bytes: Uint8Array,
  filename: string,
  mime: string,
): void {
  // Force a fresh ArrayBuffer to avoid SharedArrayBuffer typings; copy bytes.
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  downloadBlob(new Blob([copy.buffer], { type: mime }), filename);
}
