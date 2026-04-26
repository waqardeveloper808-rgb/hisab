import { redirect } from "next/navigation";

export const metadata = {
  title: "Workspace V2 — Stock (redirect)",
};

export default function Page() {
  redirect("/workspace-v2/user/stock-movements");
}
