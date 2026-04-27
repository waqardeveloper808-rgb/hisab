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
};

export function DocumentViewer({ htmlContent, fileName = "document", pdfUrl }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [fitMode, setFitMode] = useState<"zoom" | "width" | "page">("page");
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
    window.print();
  }, []);

  const handleDownload = useCallback(() => {
    if (!pdfUrl) {
      return;
    }
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${fileName}.pdf`;
    link.click();
  }, [fileName, pdfUrl]);

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
      {/* Toolbar */}
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
            disabled={!pdfUrl}
            title="Download as PDF"
          >
            Download
          </Button>
        </div>
      </div>

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
