import { redirect } from "next/navigation";

/** Canonical document template studio lives under the V2-backed user workspace. */
export default function TemplatesPage() {
  redirect("/workspace/user/templates/studio");
}
