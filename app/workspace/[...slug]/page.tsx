import { notFound } from "next/navigation";

export default async function WorkspaceCatchAllPage({ params }: { params: Promise<{ slug: string[] }> }) {
  await params;
  notFound();
}