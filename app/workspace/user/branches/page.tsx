import { BranchesRegister } from "@/components/workspace/BranchesRegister";

export default function UserBranchesPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="branches" data-inspector-real-register="branches">
      <BranchesRegister />
    </div>
  );
}