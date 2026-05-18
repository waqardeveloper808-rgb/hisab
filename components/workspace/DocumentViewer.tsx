"use client";

// HTML/PDF zoom viewer for arbitrary uploads — not the schema canvas.
// Invoice layout styles (Standard / Modern / Compact) are documented in
// data/workspace/template-specs.md and rendered via WorkspaceDocumentRenderer.

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/Button";

type DocumentViewerProps = {
  htmlContent: string;
  fileName?: string;
  pdfUrl?: string;
  showToolbar?: boolean;
};

export function DocumentViewer({ htmlContent, fileName = "document", pdfUrl, showToolbar = true }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [fitMode, setFitMode] = useState<"zoom" | "width" | "page">("page");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const zoomIn = useCallback(() => {
    setZoom((current) => Math.min(current + 10, 200));
    setFitMode("zoom");
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((current) => Math.max(current - 10, 50));
    setFitMode("zoom");
  }, []);

  const fitToWidth = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const contentWidth = contentRef.current.scrollWidth || 794;
    const calculatedZoom = (containerWidth - 40) / contentWidth;
    setZoom(Math.round(calculatedZoom * 100));
    setFitMode("width");
  }, []);

  const fitToPage = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const contentWidth = contentRef.current.scrollWidth || 794;
    const contentHeight = contentRef.current.scrollHeight || 1123;

    const zoomWidth = (containerWidth - 40) / contentWidth;
    const zoomHeight = (containerHeight - 40) / contentHeight;
    const calculatedZoom = Math.min(zoomWidth, zoomHeight);
    setZoom(Math.round(calculatedZoom * 100));
    setFitMode("page");
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(100);
    setFitMode("zoom");
  }, []);

  const handlePrint = useCallback(() => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";

    document.body.appendChild(iframe);

    const printWindow = iframe.contentWindow;
    const printDocument = printWindow?.document;

    if (!printWindow || !printDocument) {
      iframe.remove();
      return;
    }

    printDocument.open();
    printDocument.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${fileName}</title>
  <style>
    @page { size: A4; margin: 0; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`);
    printDocument.close();

    let printed = false;
    const runPrint = () => {
      if (printed) {
        return;
      }
      printed = true;
      printWindow.focus();
      printWindow.print();
      window.setTimeout(() => iframe.remove(), 750);
    };

    iframe.onload = runPrint;
    window.setTimeout(runPrint, 300);
  }, [fileName, htmlContent]);

  const handleDownload = useCallback(async () => {
    if (!pdfUrl || downloading) {
      return;
    }

    setDownloading(true);
    setDownloadError(null);

    try {
      const headers = new Headers();
      headers.set("Accept", "application/pdf");

      if (pdfUrl.includes("mode=preview")) {
        headers.set("X-Workspace-Mode", "preview");
      }

      const response = await fetch(pdfUrl, {
        credentials: "include",
        cache: "no-store",
        headers,
      });

      if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(message || `PDF download failed with HTTP ${response.status}.`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.toLowerCase().includes("application/pdf")) {
        const message = await response.text().catch(() => "");
        throw new Error(message || `Expected PDF response, received ${contentType || "unknown content type"}.`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${fileName || "document"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "PDF download failed.";
      console.error("[DocumentViewer] PDF download failed:", error);
      setDownloadError(message);
    } finally {
      setDownloading(false);
    }
  }, [downloading, fileName, pdfUrl]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    
    const isZoomIn = e.deltaY < 0;
    if (isZoomIn) {
      zoomIn();
    } else {
      zoomOut();
    }
  }, [zoomIn, zoomOut]);

  return (
    <div className="flex h-full flex-col bg-surface-soft">
      {showToolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-white px-3 py-2 shadow-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="xs"
              variant="secondary"
              onClick={zoomOut}
              disabled={zoom <= 50}
              title="Zoom out (Ctrl + Mouse wheel)"
            >
              −
            </Button>
            <div className="min-w-[4rem] rounded-lg border border-line bg-surface-soft px-2 py-1 text-center text-xs font-semibold text-ink">
              {zoom}%
            </div>
            <Button
              size="xs"
              variant="secondary"
              onClick={zoomIn}
              disabled={zoom >= 200}
              title="Zoom in (Ctrl + Mouse wheel)"
            >
              +
            </Button>
            <div className="h-6 border-r border-line" />
            <Button
              size="xs"
              variant={fitMode === "width" ? "primary" : "secondary"}
              onClick={fitToWidth}
              title="Fit to width"
            >
              Fit width
            </Button>
            <Button
              size="xs"
              variant={fitMode === "page" ? "primary" : "secondary"}
              onClick={fitToPage}
              title="Fit entire page"
            >
              Fit page
            </Button>
            <Button
              size="xs"
              variant="secondary"
              onClick={resetZoom}
              title="Reset zoom to 100%"
            >
              Reset
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="xs"
              variant="secondary"
              onClick={handlePrint}
              title="Print document"
            >
              Print
            </Button>
            <Button
              size="xs"
              variant="secondary"
              onClick={handleDownload}
              disabled={!pdfUrl || downloading}
              title="Download as PDF"
            >
              {downloading ? "Downloading…" : "Download"}
            </Button>
          </div>
        </div>
      ) : null}

      {downloadError ? (
        <div className="border-b border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700">
          {downloadError}
        </div>
      ) : null}

      {/* Document Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-surface-soft p-4"
        onWheel={handleWheel}
        style={{ scrollBehavior: "smooth" }}
      >
        <div
          ref={contentRef}
          className="mx-auto"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
            transition: fitMode === "zoom" ? "none" : "transform 0.2s ease-out",
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
}
