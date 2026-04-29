"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { AttachmentUploader } from "@/components/workspace/AttachmentUploader";
import { DocumentLinkTrigger } from "@/components/workspace/DocumentLinkTrigger";
import { DocumentLinkPreviewModal } from "@/components/workspace/DocumentLinkPreviewModal";
import { WorkspaceModeNotice } from "@/components/workspace/WorkspaceModeNotice";
import type { Attachment } from "@/lib/accounting-engine";
import { createInventoryAdjustment, createInventorySale, createInventoryStockRecord, getWorkspaceDirectory, listDocuments, listInventoryStock, type DocumentCenterRecord, type InventoryStockRecord } from "@/lib/workspace-api";

type StockRegisterProps = {
	inventoryFilter?: string;
	title?: string;
	detail?: string;
};

type StockDraft = {
	itemId: string;
	productName: string;
	material: string;
	inventoryType: string;
	size: string;
	source: "production" | "purchase";
	quantity: string;
	unitCost: string;
	reorderLevel: string;
	batchNumber: string;
	productionDate: string;
	recordedBy: string;
	attachments: Attachment[];
};

const emptyDraft: StockDraft = {
	itemId: "",
	productName: "",
	material: "",
	inventoryType: "raw_material",
	size: "",
	source: "purchase",
	quantity: "",
	unitCost: "",
	reorderLevel: "",
	batchNumber: "",
	productionDate: "",
	recordedBy: "Workspace User",
	attachments: [],
};

function slugify(value: string) {
	return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function getInventoryAccount(inventoryType: string) {
	if (inventoryType === "consumables") {
		return { code: "690", name: "Miscellaneous Expense" };
	}

	return { code: "113", name: "Inventory — Trading" };
}

export function StockRegister({ inventoryFilter = "", title = "Stock Register", detail = "Inventory intake records persist only through backend inventory APIs. If no stock exists yet, this register stays empty instead of showing sample rows." }: StockRegisterProps) {
	const [stock, setStock] = useState<InventoryStockRecord[]>([]);
	const [itemOptions, setItemOptions] = useState<Array<{ id: string; name: string; purchasePrice: number }>>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [typeFilter, setTypeFilter] = useState<string>("");
	const [showCreate, setShowCreate] = useState(false);
	const [step, setStep] = useState(1);
	const [draft, setDraft] = useState<StockDraft>(emptyDraft);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [previewRecord, setPreviewRecord] = useState<InventoryStockRecord | null>(null);
	const [lastStockMovement, setLastStockMovement] = useState<{ before: number; after: number; reference: string; type: string } | null>(null);
	const [salesDocs, setSalesDocs] = useState<DocumentCenterRecord[]>([]);
	const [linkPreview, setLinkPreview] = useState<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null } | null>(null);
	const [adjustmentDraft, setAdjustmentDraft] = useState({ quantityDelta: "", reason: "", reference: "" });
	const [saleDraft, setSaleDraft] = useState({ quantity: "", unitPrice: "", proformaDocumentId: "", taxDocumentId: "", deliveryNote: "", customerName: "", paymentStatus: "Not Received" });

	useEffect(() => {
		Promise.all([listInventoryStock(), getWorkspaceDirectory(), listDocuments({ group: "sales" })])
			.then(([stockRows, directory, documents]) => {
				setStock(stockRows);
				setItemOptions((directory?.items ?? []).map((item) => ({ id: item.id, name: item.name, purchasePrice: item.purchasePrice })));
				setSalesDocs(documents);
			})
			.finally(() => setLoading(false));
	}, []);

	const generatedCode = useMemo(() => {
		const productSegment = slugify(draft.productName || draft.material || "ITEM");
		const typeSegment = slugify(draft.inventoryType || "TYPE");
		const sizeSegment = slugify(draft.size || "SIZE");
		const batchSegment = slugify(draft.batchNumber || "GEN");
		return [productSegment, typeSegment, sizeSegment, batchSegment].filter(Boolean).join("-").slice(0, 80);
	}, [draft.batchNumber, draft.inventoryType, draft.material, draft.productName, draft.size]);

	const filtered = useMemo(() => {
		let result = stock;
		if (inventoryFilter) {
			result = result.filter((row) => row.inventoryType === inventoryFilter);
		}
		if (search) {
			result = result.filter((row) =>
				row.code.toLowerCase().includes(search.toLowerCase()) ||
				`${row.productName} ${row.material}`.toLowerCase().includes(search.toLowerCase()),
			);
		}
		if (typeFilter) {
			result = result.filter((row) => row.inventoryType === typeFilter);
		}
		return result;
	}, [inventoryFilter, search, stock, typeFilter]);

	const lowStock = filtered.filter((row) => row.available <= row.reorderLevel);

	function getLinkedDocumentsForSale() {
		const links = [] as Array<{ documentId?: number | null; documentNumber: string; documentType: string; status?: string | null }>;
		const proforma = salesDocs.find((doc) => String(doc.id) === saleDraft.proformaDocumentId);
		const taxInvoice = salesDocs.find((doc) => String(doc.id) === saleDraft.taxDocumentId);
		if (proforma) {
			links.push({ documentId: proforma.id, documentNumber: proforma.number, documentType: proforma.type, status: proforma.status });
		}
		if (taxInvoice) {
			links.push({ documentId: taxInvoice.id, documentNumber: taxInvoice.number, documentType: taxInvoice.type, status: taxInvoice.status });
		}
		if (saleDraft.deliveryNote.trim()) {
			links.push({ documentId: null, documentNumber: saleDraft.deliveryNote.trim(), documentType: "delivery_note", status: "linked" });
		}
		return links;
	}

	async function handleCreate() {
		if (!draft.productName.trim()) {
			setError("Product is required.");
			return;
		}

		if (!draft.material.trim()) {
			setError("Material is required.");
			return;
		}

		if (!draft.size.trim()) {
			setError("Size is required.");
			return;
		}

		if (!draft.quantity || Number(draft.quantity) <= 0) {
			setError("Quantity must be greater than zero.");
			return;
		}

		if (!draft.unitCost || Number(draft.unitCost) <= 0) {
			setError("Unit cost must be greater than zero.");
			return;
		}

		if (draft.source === "production" && (!draft.productionDate || !draft.batchNumber.trim())) {
			setError("Production source requires production date and batch number.");
			return;
		}

		setSaving(true);
		setError(null);

		try {
			const inventoryAccount = getInventoryAccount(draft.inventoryType);
			const created = await createInventoryStockRecord({
				itemId: draft.itemId ? Number(draft.itemId) : null,
				productName: draft.productName.trim(),
				material: draft.material.trim(),
				inventoryType: draft.inventoryType,
				size: draft.size.trim(),
				source: draft.source,
				code: generatedCode,
				quantity: Number(draft.quantity),
				unitCost: Number(draft.unitCost),
				reorderLevel: Number(draft.reorderLevel || 0),
				batchNumber: draft.batchNumber.trim() || undefined,
				productionDate: draft.productionDate || undefined,
				recordedBy: draft.recordedBy.trim() || "Workspace User",
				journalEntryNumber: `JV-INV-${Date.now().toString().slice(-6)}`,
				inventoryAccountCode: inventoryAccount.code,
				inventoryAccountName: inventoryAccount.name,
				attachments: draft.attachments,
			});

			setStock((current) => [created, ...current]);
			setDraft(emptyDraft);
			setShowCreate(false);
			setStep(1);
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError.message : "Inventory record could not be created.");
		} finally {
			setSaving(false);
		}
	}

	async function handleAdjustment() {
		if (!previewRecord || !adjustmentDraft.quantityDelta) {
			return;
		}

		const created = await createInventoryAdjustment({
			inventoryItemId: previewRecord.id,
			quantityDelta: Number(adjustmentDraft.quantityDelta),
			reason: adjustmentDraft.reason || "Inventory adjustment",
			reference: adjustmentDraft.reference || `ADJ-${previewRecord.code}`,
		});

		setPreviewRecord((current) => current ? {
			...current,
			onHand: current.onHand + Number(adjustmentDraft.quantityDelta),
			available: current.available + Number(adjustmentDraft.quantityDelta),
			journalEntryNumber: created.journalEntryNumber,
			recordedBy: created.recordedBy,
			lastUpdated: created.date,
		} : current);
		setLastStockMovement({ before: previewRecord.onHand, after: previewRecord.onHand + Number(adjustmentDraft.quantityDelta), reference: created.reference, type: "adjustment" });
		setStock((current) => current.map((row) => row.id === previewRecord.id ? {
			...row,
			onHand: row.onHand + Number(adjustmentDraft.quantityDelta),
			available: row.available + Number(adjustmentDraft.quantityDelta),
			journalEntryNumber: created.journalEntryNumber,
			recordedBy: created.recordedBy,
			lastUpdated: created.date,
		} : row));
		setAdjustmentDraft({ quantityDelta: "", reason: "", reference: "" });
	}

	async function handleSale() {
		if (!previewRecord || !saleDraft.quantity || !saleDraft.unitPrice) {
			return;
		}

		const linkedDocuments = getLinkedDocumentsForSale();
		const created = await createInventorySale({
			inventoryItemId: previewRecord.id,
			quantity: Number(saleDraft.quantity),
			unitPrice: Number(saleDraft.unitPrice),
			unitCost: previewRecord.onHand > 0 ? previewRecord.onHand === 0 ? 0 : undefined : undefined,
			reference: `SAL-${previewRecord.code}`,
			proformaInvoice: linkedDocuments.find((link) => link.documentType === "proforma_invoice")?.documentNumber,
			taxInvoice: linkedDocuments.find((link) => link.documentType === "tax_invoice")?.documentNumber,
			deliveryNote: linkedDocuments.find((link) => link.documentType === "delivery_note")?.documentNumber,
			documentLinks: linkedDocuments,
		});

		setPreviewRecord((current) => current ? {
			...current,
			onHand: current.onHand - Number(saleDraft.quantity),
			available: current.available - Number(saleDraft.quantity),
			journalEntryNumber: created.journalEntryNumber,
			recordedBy: created.recordedBy,
			documentLinks: created.documentLinks,
			lastUpdated: created.date,
		} : current);
		setLastStockMovement({ before: previewRecord.onHand, after: previewRecord.onHand - Number(saleDraft.quantity), reference: created.reference, type: "delivery" });
		setStock((current) => current.map((row) => row.id === previewRecord.id ? {
			...row,
			onHand: row.onHand - Number(saleDraft.quantity),
			available: row.available - Number(saleDraft.quantity),
			journalEntryNumber: created.journalEntryNumber,
			recordedBy: created.recordedBy,
			documentLinks: created.documentLinks,
			lastUpdated: created.date,
		} : row));
		setSaleDraft({ quantity: "", unitPrice: "", proformaDocumentId: "", taxDocumentId: "", deliveryNote: "", customerName: "", paymentStatus: "Not Received" });
	}

	return (
		<div className="space-y-4" data-inspector-real-register="inventory-stock">
			<WorkspaceModeNotice
				title="Live inventory register"
				detail={detail}
			/>

			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 min-w-0">
					<h1 className="text-sm font-semibold text-ink">{title}</h1>
					<span className="rounded bg-surface-soft px-1.5 py-0.5 text-[10px] font-semibold text-muted">{filtered.length} items</span>
					{lowStock.length > 0 ? (
						<span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">{lowStock.length} below reorder</span>
					) : null}
				</div>
				<div className="flex gap-1.5">
					<Button size="xs" variant="muted" onClick={() => setFiltersOpen((current) => !current)}>
						{filtersOpen ? "Hide Filters" : "Filters"}
					</Button>
					<Button size="xs" variant="primary" onClick={() => setShowCreate((current) => !current)}>{showCreate ? "Close Intake" : "Add Inventory"}</Button>
					<Button size="xs" variant="secondary" href="/workspace/user/inventory-adjustments">Adjust Stock</Button>
					<Button size="xs" variant="secondary">Export</Button>
				</div>
			</div>

			{showCreate ? (
				<Card className="rounded-2xl bg-white/95 p-5 shadow-[0_24px_80px_-48px_rgba(17,32,24,0.45)]" data-inspector-inventory-intake="true">
					<div className="mb-5 flex flex-wrap items-center justify-between gap-4">
						<div>
							<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Inventory Flow</p>
							<h2 className="text-lg font-semibold text-ink">Step {step} of {draft.source === "production" ? 3 : 2}</h2>
						</div>
						<div className="grid gap-1 rounded-xl border border-line bg-surface-soft/60 px-3 py-2 text-[11px] font-semibold text-muted">
							<span>Code: {generatedCode}</span>
							<span>Recorder: {draft.recordedBy || "Workspace User"}</span>
						</div>
					</div>

					{step === 1 ? (
						<div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
							<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="mb-2 block text-sm font-semibold text-ink" htmlFor="inventory-product">Product</label>
								<select
									id="inventory-product"
									value={draft.itemId}
									onChange={(event) => {
										const selected = itemOptions.find((item) => item.id === event.target.value);
										setDraft((current) => ({
											...current,
											itemId: event.target.value,
											productName: selected?.name ?? current.productName,
											unitCost: selected?.purchasePrice ? String(selected.purchasePrice) : current.unitCost,
										}));
									}}
									className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
								>
									<option value="">Select saved product</option>
									{itemOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
								</select>
							</div>
							<Input label="Product name" value={draft.productName} onChange={(event) => setDraft((current) => ({ ...current, productName: event.target.value }))} />
							<Input label="Material" value={draft.material} onChange={(event) => setDraft((current) => ({ ...current, material: event.target.value }))} />
							<div>
								<label className="mb-2 block text-sm font-semibold text-ink" htmlFor="inventory-type">Type</label>
								<select id="inventory-type" value={draft.inventoryType} onChange={(event) => setDraft((current) => ({ ...current, inventoryType: event.target.value }))} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
									<option value="raw_material">Raw material</option>
									<option value="finished_good">Finished good</option>
									<option value="trading">Trading</option>
									<option value="spare_parts">Spare parts</option>
									<option value="consumables">Consumables</option>
								</select>
							</div>
							<Input label="Size" value={draft.size} onChange={(event) => setDraft((current) => ({ ...current, size: event.target.value }))} />
							</div>
							<div className="rounded-2xl border border-line bg-surface-soft/35 p-4">
								<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Audit + Documents</p>
								<div className="mt-3 grid gap-4">
									<Input label="Recorded by" value={draft.recordedBy} onChange={(event) => setDraft((current) => ({ ...current, recordedBy: event.target.value }))} />
									<AttachmentUploader attachments={draft.attachments} onChange={(attachments) => setDraft((current) => ({ ...current, attachments }))} maxFiles={6} />
								</div>
							</div>
						</div>
					) : null}

					{step === 2 ? (
						<div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
							<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							<div>
								<label className="mb-2 block text-sm font-semibold text-ink" htmlFor="inventory-source">Source</label>
								<select id="inventory-source" value={draft.source} onChange={(event) => setDraft((current) => ({ ...current, source: event.target.value as "production" | "purchase" }))} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
									<option value="purchase">Purchase</option>
									<option value="production">Production</option>
								</select>
							</div>
							<Input label="Quantity" type="number" min="0" step="1" value={draft.quantity} onChange={(event) => setDraft((current) => ({ ...current, quantity: event.target.value }))} />
							<Input label="Unit cost" type="number" min="0" step="0.01" value={draft.unitCost} onChange={(event) => setDraft((current) => ({ ...current, unitCost: event.target.value }))} />
							<Input label="Reorder level" type="number" min="0" step="1" value={draft.reorderLevel} onChange={(event) => setDraft((current) => ({ ...current, reorderLevel: event.target.value }))} />
							</div>
							<div className="rounded-2xl border border-line bg-surface-soft/35 p-4 text-sm text-muted">
								<p className="font-semibold text-ink">Suggested accounting link</p>
								<p className="mt-2">{getInventoryAccount(draft.inventoryType).code} · {getInventoryAccount(draft.inventoryType).name}</p>
								<p className="mt-2">Receipt value: {(Number(draft.quantity || 0) * Number(draft.unitCost || 0)).toFixed(2)} SAR</p>
								<p className="mt-2 text-xs">A matching journal reference will be generated and carried into the stock and adjustment registers.</p>
							</div>
						</div>
					) : null}

					{step === 3 ? (
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							<Input label="Production date" type="date" value={draft.productionDate} onChange={(event) => setDraft((current) => ({ ...current, productionDate: event.target.value }))} />
							<Input label="Batch number" value={draft.batchNumber} onChange={(event) => setDraft((current) => ({ ...current, batchNumber: event.target.value.toUpperCase() }))} />
						</div>
					) : null}

					{error ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

					<div className="mt-4 flex gap-2">
						{step > 1 ? <Button size="xs" variant="secondary" onClick={() => setStep((current) => current - 1)}>Back</Button> : null}
						{step === 1 ? <Button size="xs" onClick={() => setStep(2)}>Next</Button> : null}
						{step === 2 && draft.source === "production" ? <Button size="xs" onClick={() => setStep(3)}>Next</Button> : null}
						{(step === 2 && draft.source === "purchase") || step === 3 ? <Button size="xs" onClick={() => void handleCreate()} disabled={saving}>{saving ? "Saving" : "Create inventory"}</Button> : null}
					</div>
				</Card>
			) : null}

			{filtersOpen ? (
				<div className="rounded-md border border-line bg-surface-soft/30 px-2.5 py-2 flex gap-2 flex-wrap">
					<input
						type="text"
						placeholder="Search by code or name..."
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						className="rounded border border-line px-2 py-1 text-xs"
					/>
					<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded border border-line px-2 py-1 text-xs">
						<option value="">All Types</option>
						<option value="raw_material">Raw Material</option>
						<option value="finished_good">Finished Good</option>
						<option value="trading">Trading</option>
						<option value="spare_parts">Spare Parts</option>
						<option value="consumables">Consumables</option>
					</select>
				</div>
			) : null}

			<div className="rounded-md border border-line bg-white overflow-hidden">
				<div className="grid grid-cols-[0.8fr_1fr_0.9fr_0.8fr_0.5fr_0.5fr_0.8fr_0.8fr_1fr_0.75fr] gap-1 px-2 py-1 border-b border-line bg-surface-soft/30 text-[9px] font-bold uppercase tracking-wider text-muted">
					<span>Code</span>
					<span>Product</span>
					<span>Material / Size</span>
					<span>Type</span>
					<span className="text-right">On Hand</span>
					<span className="text-right">Available</span>
					<span>Journal</span>
					<span>Recorded By</span>
					<span>Customer / Documents</span>
					<span>Updated</span>
				</div>
				{filtered.map((item) => {
					const isLow = item.available <= item.reorderLevel;
					return (
						<div
							key={item.id}
							role="button"
							tabIndex={0}
							data-inspector-register-row="true"
							data-inspector-inventory-row={item.code}
							onDoubleClick={() => setPreviewRecord(item)}
							onKeyDown={(event) => {
								if (event.key === "Enter" || event.key === " ") {
									event.preventDefault();
									setPreviewRecord(item);
								}
							}}
							className={`grid w-full grid-cols-[0.8fr_1fr_0.9fr_0.8fr_0.5fr_0.5fr_0.8fr_0.8fr_1fr_0.75fr] gap-1 px-2 py-1.5 border-b border-line text-left transition hover:bg-surface-soft/35 focus:outline-none focus:ring-2 focus:ring-primary/20 ${isLow ? "bg-red-50/50" : ""}`}
						>
							<span className="text-xs font-semibold text-primary">{item.code}</span>
							<span className="text-[11px] text-ink truncate">{item.productName}</span>
							<span className="text-[10px] text-muted">{item.material} / {item.size}</span>
							<span className="text-[10px] text-muted capitalize">{item.inventoryType.replace("_", " ")}</span>
							<span className="text-[11px] text-right font-medium text-ink">{item.onHand}</span>
							<span className={`text-[11px] text-right font-medium ${isLow ? "text-red-700" : "text-ink"}`}>{item.available}</span>
							<span className="text-[10px] text-muted">{item.journalEntryNumber}</span>
							<span className="text-[10px] text-muted truncate">{item.recordedBy}</span>
							<span className="flex flex-wrap gap-1 text-[10px] text-muted">{(item.documentLinks ?? []).slice(0, 3).map((link) => <DocumentLinkTrigger key={`${item.id}-${link.documentNumber}`} link={link} onPreview={setLinkPreview} className="cursor-pointer text-primary underline-offset-2 hover:underline" />)}</span>
							<span className="text-[10px] text-muted">{item.lastUpdated ? item.lastUpdated.slice(0, 10) : "—"}</span>
						</div>
					);
				})}
				{loading ? <p className="px-3 py-4 text-center text-xs text-muted">Loading stock records...</p> : null}
				{!loading && filtered.length === 0 ? <p className="px-3 py-4 text-center text-xs text-muted">No stock items found.</p> : null}
			</div>

			{previewRecord ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4 py-6" role="dialog" aria-modal="true">
					<div className="max-h-[85vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-5 shadow-[0_30px_90px_-40px_rgba(17,32,24,0.55)]">
						<div className="flex items-start justify-between gap-4 border-b border-line pb-4">
							<div>
								<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Inventory Preview</p>
								<h2 className="text-lg font-semibold text-ink">{previewRecord.productName}</h2>
								<p className="text-sm text-muted">Double-click from the register to inspect inventory, linked accounting, and uploaded support.</p>
							</div>
							<Button size="xs" variant="secondary" onClick={() => setPreviewRecord(null)}>Close</Button>
						</div>
						<div className="mt-4 grid gap-4 md:grid-cols-2">
							<div className="rounded-xl border border-line bg-surface-soft/25 p-4 text-sm text-muted">
								<p><strong>Code:</strong> {previewRecord.code}</p>
								<p><strong>Material:</strong> {previewRecord.material}</p>
								<p><strong>Size:</strong> {previewRecord.size}</p>
								<p><strong>Source:</strong> {previewRecord.source}</p>
								<p><strong>Recorded by:</strong> {previewRecord.recordedBy}</p>
								<p><strong>Production date:</strong> {previewRecord.productionDate || "-"}</p>
								<p><strong>Batch:</strong> {previewRecord.batchNumber || "-"}</p>
							</div>
							<div className="rounded-xl border border-line bg-surface-soft/25 p-4 text-sm text-muted">
								<p><strong>On hand:</strong> {previewRecord.onHand}</p>
								<p><strong>Committed:</strong> {previewRecord.committed}</p>
								<p><strong>Available:</strong> {previewRecord.available}</p>
								<p><strong>Reorder level:</strong> {previewRecord.reorderLevel}</p>
								<p><strong>Journal:</strong> {previewRecord.journalEntryNumber}</p>
								<p><strong>Account:</strong> {previewRecord.inventoryAccountCode} · {previewRecord.inventoryAccountName}</p>
								{lastStockMovement ? <p><strong>Last {lastStockMovement.type}:</strong> {lastStockMovement.before} -&gt; {lastStockMovement.after} ({lastStockMovement.reference})</p> : null}
							</div>
						</div>
						<div className="mt-4 rounded-xl border border-line bg-white p-4">
							<p className="text-sm font-semibold text-ink">Attached documents</p>
							{previewRecord.documentLinks.length ? (
								<ul className="mt-3 space-y-2 text-sm text-muted">
									{previewRecord.documentLinks.map((link) => (
										<li key={`${link.documentType}-${link.documentNumber}`} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
											<DocumentLinkTrigger link={link} onPreview={setLinkPreview} className="truncate text-left text-primary underline-offset-2 hover:underline" />
											<span>{link.documentType.replace(/_/g, " ")}</span>
										</li>
									))}
								</ul>
							) : previewRecord.attachments.length ? (
								<ul className="mt-3 space-y-2 text-sm text-muted">
									{previewRecord.attachments.map((attachment) => (
										<li key={attachment.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
											<span className="truncate">{attachment.fileName}</span>
											<span>{attachment.documentTag.replace(/_/g, " ")}</span>
										</li>
									))}
								</ul>
							) : <p className="mt-3 text-sm text-muted">No documents uploaded for this inventory record.</p>}
						</div>
						<div className="mt-4 grid gap-4 md:grid-cols-2">
							<div className="rounded-xl border border-line bg-surface-soft/25 p-4">
								<p className="text-sm font-semibold text-ink">Adjust inventory</p>
								<div className="mt-3 grid gap-3">
									<Input label="Quantity delta" type="number" value={adjustmentDraft.quantityDelta} onChange={(event) => setAdjustmentDraft((current) => ({ ...current, quantityDelta: event.target.value }))} />
									<Input label="Reason" value={adjustmentDraft.reason} onChange={(event) => setAdjustmentDraft((current) => ({ ...current, reason: event.target.value }))} />
									<Input label="Reference" value={adjustmentDraft.reference} onChange={(event) => setAdjustmentDraft((current) => ({ ...current, reference: event.target.value }))} />
									<Button size="xs" onClick={() => void handleAdjustment()}>Post adjustment</Button>
								</div>
							</div>
							<div className="rounded-xl border border-line bg-surface-soft/25 p-4">
								<p className="text-sm font-semibold text-ink">Release goods / delivery</p>
								<div className="mt-3 grid gap-3">
									<Input label="Customer / receiver" value={saleDraft.customerName} onChange={(event) => setSaleDraft((current) => ({ ...current, customerName: event.target.value }))} />
									<Input label="Quantity sold" type="number" value={saleDraft.quantity} onChange={(event) => setSaleDraft((current) => ({ ...current, quantity: event.target.value }))} />
									<Input label="Unit price" type="number" value={saleDraft.unitPrice} onChange={(event) => setSaleDraft((current) => ({ ...current, unitPrice: event.target.value }))} />
									<div>
										<label className="mb-2 block text-sm font-semibold text-ink">Proforma invoice</label>
										<select value={saleDraft.proformaDocumentId} onChange={(event) => setSaleDraft((current) => ({ ...current, proformaDocumentId: event.target.value }))} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
											<option value="">None</option>
											{salesDocs.filter((doc) => doc.type === "proforma_invoice").map((doc) => <option key={doc.id} value={doc.id}>{doc.number}</option>)}
										</select>
									</div>
									<div>
										<label className="mb-2 block text-sm font-semibold text-ink">Tax invoice</label>
										<select value={saleDraft.taxDocumentId} onChange={(event) => setSaleDraft((current) => ({ ...current, taxDocumentId: event.target.value }))} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
											<option value="">None</option>
											{salesDocs.filter((doc) => doc.type === "tax_invoice").map((doc) => <option key={doc.id} value={doc.id}>{doc.number}</option>)}
										</select>
									</div>
									<Input label="Delivery note" value={saleDraft.deliveryNote} onChange={(event) => setSaleDraft((current) => ({ ...current, deliveryNote: event.target.value }))} />
									<div>
										<label className="mb-2 block text-sm font-semibold text-ink">Payment status</label>
										<select value={saleDraft.paymentStatus} onChange={(event) => setSaleDraft((current) => ({ ...current, paymentStatus: event.target.value }))} className="block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10">
											<option value="Not Received">Not Received</option>
											<option value="Partially Received">Partially Received</option>
											<option value="Fully Received">Fully Received</option>
										</select>
									</div>
									<Button size="xs" onClick={() => void handleSale()}>Post delivery release</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
			) : null}

			<DocumentLinkPreviewModal link={linkPreview} onClose={() => setLinkPreview(null)} />
		</div>
	);
}
