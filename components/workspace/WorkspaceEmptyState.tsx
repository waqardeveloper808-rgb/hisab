import { Inbox } from "lucide-react";

type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function WorkspaceEmptyState({ title, description, action }: Props) {
  return (
    <div className="wsv2-empty">
      <Inbox size={26} color="var(--wsv2-ink-subtle)" />
      <div className="title">{title}</div>
      {description ? <div>{description}</div> : null}
      {action ? <div style={{ marginTop: 6 }}>{action}</div> : null}
    </div>
  );
}
