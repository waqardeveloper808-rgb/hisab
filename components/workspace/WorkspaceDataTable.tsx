import type { ReactNode } from "react";
import { Card } from "@/components/Card";

type WorkspaceColumn<Row> = {
  header: string;
  render: (row: Row) => ReactNode;
  align?: "left" | "right";
};

type WorkspaceDataTableProps<Row> = {
  title: string;
  caption: string;
  rows: Row[];
  columns: WorkspaceColumn<Row>[];
  emptyMessage: string;
  badge?: string;
};

export function WorkspaceDataTable<Row>({ title, caption, rows, columns, emptyMessage, badge }: WorkspaceDataTableProps<Row>) {
  return (
    <Card className="rounded-[1rem] bg-white/95 p-0 overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-line px-3 py-2">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="mt-0.5 text-xs leading-5 text-muted">{caption}</p>
        </div>
        {badge ? <span className="rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-muted">{badge}</span> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="border-b border-line bg-surface-soft/70">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  className={[
                    "px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted",
                    column.align === "right" ? "text-right" : "text-left",
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
                {columns.map((column) => (
                  <td
                    key={column.header}
                    className={[
                      "px-3 py-1.5 align-top text-xs leading-5",
                      /debit/i.test(column.header) ? "bg-emerald-50/35" : "",
                      /credit/i.test(column.header) ? "bg-rose-50/30" : "",
                      column.align === "right" ? "text-right" : "text-left",
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