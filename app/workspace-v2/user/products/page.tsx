import { redirect } from "next/navigation";

export const metadata = {
  title: "Workspace V2 — Products (redirect)",
};

export default function Page() {
  redirect("/workspace-v2/user/products-services");
}
