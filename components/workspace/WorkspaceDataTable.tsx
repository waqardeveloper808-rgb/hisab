import type { ReactNode } from "react";
import { Card } from "@/components/Card";

type WorkspaceColumn<Row> = {
  header: string;
  render: (row: Row) => ReactNode;
  align?: "left" | "right";
  /** Fixed column width, e.g. "120px" — pairs with table-layout: fixed */
  width?: string;
  /** Use for long description text: wrap instead of single-line ellipsis */
  cellVariant?: "default" | "description";
};

type WorkspaceDataTableProps<Row> = {
  title: string;
  caption: string;
  rows: Row[];
  columns: WorkspaceColumn<Row>[];
  emptyMessage: string;
  badge?: string;
  actions?: ReactNode;
};

export function WorkspaceDataTable<Row>({ title, caption, rows, columns, emptyMessage, badge, actions }: WorkspaceDataTableProps<Row>) {
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-xs [table-layout:fixed]">
          <thead className="border-b border-line bg-surface-soft/70">
            <tr>
              {columns.map((column, colIndex) => (
                <th
                  key={`${column.header}-${colIndex}`}
                  style={column.width ? { width: column.width, maxWidth: column.width } : undefined}
                  className={[
                    "min-w-0 px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted",
                    column.align === "right" ? "text-right" : "text-left",
                    column.cellVariant === "description"
                      ? "whitespace-normal break-words [word-break:break-word]"
                      : "overflow-hidden text-ellipsis whitespace-nowrap",
                  ].join(" ")}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row, index) => (
              <tr key={index} data-inspector-register-row="true" className={[
                "border-t border-line/70 text-ink",
                index % 2 === 0 ? "bg-white" : "bg-surface-soft/25",
              ].join(" ")}>
                {columns.map((column, colIndex) => (
                  <td
                    key={`${column.header}-${colIndex}`}
                    style={column.width ? { width: column.width, maxWidth: column.width } : undefined}
                    className={[
                      "min-w-0 px-3 py-1.5 align-top text-xs leading-5",
                      /debit/i.test(column.header) ? "bg-emerald-50/35" : "",
                      /credit/i.test(column.header) ? "bg-rose-50/30" : "",
                      column.align === "right" ? "text-right" : "text-left",
                      column.cellVariant === "description"
                        ? "whitespace-normal break-words [word-break:break-word]"
                        : "overflow-hidden text-ellipsis whitespace-nowrap",
                    ].join(" ")}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            )) : (
              <tr className="border-t border-line/70 text-ink">
                <td colSpan={columns.length} className="px-3 py-2 text-xs leading-5 text-muted">
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