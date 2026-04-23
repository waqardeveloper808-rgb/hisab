import { TransactionForm } from "@/components/workflow/TransactionForm";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ documentType?: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const documentType = Array.isArray(resolvedSearchParams.documentType)
    ? resolvedSearchParams.documentType[0]
    : resolvedSearchParams.documentType;

  return <TransactionForm kind="invoice" initialDocumentType={documentType} displayMode="overlay" />;
}