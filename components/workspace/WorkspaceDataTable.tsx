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
    <Card className="rounded-[1.8rem] bg-white/92 p-6">
      <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted">{caption}</p>
        </div>
        {badge ? <span className="rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-muted">{badge}</span> : null}
      </div>

      {rows.length ? (
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.header}
                    className={[
                      "px-3 pb-1 text-left font-semibold text-muted",
                      column.align === "right" ? "text-right" : "text-left",
                    ].join(" ")}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="rounded-2xl bg-surface-soft text-ink">
                  {columns.map((column) => (
                    <td
                      key={column.header}
                      className={[
                        "px-3 py-3 align-top",
                        column.align === "right" ? "text-right" : "text-left",
                      ].join(" ")}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-5 rounded-[1.4rem] border border-dashed border-line bg-surface-soft px-4 py-6 text-sm leading-6 text-muted">
          {emptyMessage}
        </div>
      )}
    </Card>
  );
}