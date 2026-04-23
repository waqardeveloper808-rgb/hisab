import { ExpensesRegister } from "@/components/workspace/ExpensesRegister";

export default function UserExpensesPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="expenses" data-inspector-real-register="expenses">
      <ExpensesRegister />
    </div>
  );
}