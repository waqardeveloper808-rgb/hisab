import { redirect } from "next/navigation";

export const metadata = {
  title: "Workspace — Products (redirect)",
};

export default function Page() {
  redirect("/workspace/user/products-services");
}
