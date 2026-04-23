import Link from "next/link";
import { Card } from "@/components/Card";

export default function WorkspaceNotFound() {
  return (
    <Card className="rounded-xl border border-line bg-white/95 p-6 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Workspace page not found</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">This workspace page is not available.</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
        The signed-in workspace shell is active, but this route is not a valid destination. Return to a verified workspace entry point.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link href="/workspace/user" className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
          Open user workspace
        </Link>
        <Link href="/workspace/help" className="inline-flex items-center justify-center rounded-2xl border border-primary-border bg-primary-soft px-4 py-2.5 text-sm font-semibold text-ink hover:border-primary/40 hover:bg-white">
          Open workspace help
        </Link>
      </div>
    </Card>
  );
}