import { redirect } from "next/navigation";

export const metadata = {
  title: "Workspace — Stock (redirect)",
};

export default function Page() {
  redirect("/workspace/user/stock-movements");
}
