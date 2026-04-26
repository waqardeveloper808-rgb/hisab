import { redirect } from "next/navigation";

export const metadata = {
  title: "Workspace V2 — Payments (redirect)",
};

export default function Page() {
  redirect("/workspace/user/customer-payments");
}
