import { TransactionForm } from "@/components/workflow/TransactionForm";

export default async function InvoiceDraftPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  return <TransactionForm kind="invoice" documentId={Number(documentId)} />;
}