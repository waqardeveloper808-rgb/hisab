"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { Card } from "@/components/Card";
import { RegisterTableHeaderCell } from "@/components/workspace/RegisterTableHeaderCell";
import { useRegisterTableLayout, type RegisterColumnWidthDef } from "@/lib/workspace/register-table-layout";

const DEFAULT_COL_WIDTH = 120;

export type WorkspaceDataColumn<Row> = {
  /** Stable id for width persistence */
  id: string;
  header: string;
  defaultWidth?: number;
  render: (row: Row) => ReactNode;
  align?: "left" | "right";
  /** @deprecated Width is driven by register layout; kept for typing compatibility */
  width?: string;
  /** @deprecated All cells wrap */
  cellVariant?: "default" | "description";
};

export type WorkspaceDataTableProps<Row> = {
  /** localStorage key segment: table:<registerTableId>:columnWidths */
  registerTableId: string;
  title: string;
  caption: string;
  rows: Row[];
  columns: WorkspaceDataColumn<Row>[];
  emptyMessage: string;
  badge?: string;
  actions?: ReactNode;
};

export function WorkspaceDataTable<Row>({
  registerTableId,
  title,
  caption,
  rows,
  columns,
  emptyMessage,
  badge,
  actions,
}: WorkspaceDataTableProps<Row>) {
  const defs: RegisterColumnWidthDef[] = useMemo(
    () => columns.map((c) => ({ id: c.id, defaultWidth: c.defaultWidth ?? DEFAULT_COL_WIDTH })),
    [columns],
  );
  const visibleIds = useMemo(() => columns.map((c) => c.id), [columns]);
  const { wrapRef, colPercents, beginResizePair } = useRegisterTableLayout(registerTableId, defs, visibleIds);

  const percentById = useMemo(() => Object.fromEntries(colPercents.map((c) => [c.id, c.percent])), [colPercents]);

  return (
    <Card className="rounded-[1rem] bg-white/95 p-0 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-3 py-2">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="mt-0.5 text-xs leading-5 text-muted">{caption}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {badge ? <span className="rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-muted">{badge}</span> : null}
        </div>
      </div>
      <div ref={wrapRef} data-register-table="true" className="min-w-0 max-w-full overflow-x-hidden">
        <table className="w-full border-collapse text-xs [table-layout:fixed]">
          <colgroup>
            {columns.map((column) => (
              <col key={column.id} style={{ width: `${percentById[column.id] ?? 100 / columns.length}%` }} />
            ))}
          </colgroup>
          <thead className="border-b border-line bg-surface-soft/70">
            <tr>
              {columns.map((column, colIndex) => (
                <RegisterTableHeaderCell
                  key={column.id}
                  align={column.align === "right" ? "right" : "left"}
                  onResizePointerDown={
                    colIndex < columns.length - 1 ? (startX) => beginResizePair(colIndex, startX) : undefined
                  }
                  className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted"
                >
                  {column.header}
                </RegisterTableHeaderCell>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, index) => (
                <tr
                  key={index}
                  data-inspector-register-row="true"
                  className={["border-t border-line/70 text-ink", index % 2 === 0 ? "bg-white" : "bg-surface-soft/25"].join(" ")}
                >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={[
                        "register-table-cell min-w-0 px-3 py-1.5 align-top text-xs leading-5",
                        /debit/i.test(column.header) ? "bg-emerald-50/35" : "",
                        /credit/i.test(column.header) ? "bg-rose-50/30" : "",
                        column.align === "right" ? "text-right" : "text-left",
                      ].join(" ")}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr className="border-t border-line/70 text-ink">
                <td colSpan={columns.length} className="register-table-cell px-3 py-2 text-xs leading-5 text-muted">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
