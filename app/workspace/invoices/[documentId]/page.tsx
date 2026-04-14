import { InvoiceDocumentPage } from "@/components/workspace/InvoiceDocumentPage";

export default async function InvoiceDraftPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  return <InvoiceDocumentPage documentId={Number(documentId)} />;
}