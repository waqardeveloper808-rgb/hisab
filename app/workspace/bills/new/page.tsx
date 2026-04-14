import { TransactionForm } from "@/components/workflow/TransactionForm";

export default async function NewBillPage({
  searchParams,
}: {
  searchParams: Promise<{ documentType?: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const documentType = Array.isArray(resolvedSearchParams.documentType)
    ? resolvedSearchParams.documentType[0]
    : resolvedSearchParams.documentType;

  return <TransactionForm kind="bill" initialDocumentType={documentType} />;
}