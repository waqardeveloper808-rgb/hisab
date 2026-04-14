import { TransactionForm } from "@/components/workflow/TransactionForm";

export default async function BillDraftPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  return <TransactionForm kind="bill" documentId={Number(documentId)} />;
}