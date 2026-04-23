export const validatedControlEvidence = {
  accountingPeriodValidation: {
    automatedTest: "SalesTaxInvoiceFlowTest::test_locked_period_blocks_document_finalization",
    source: "backend/tests/Feature/SalesTaxInvoiceFlowTest.php",
    coverage: "Locked periods block document finalization through the posting workflow.",
  },
} as const;