"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <Button variant="secondary" onClick={handleLogout} disabled={loading}>
      {loading ? "Signing out" : "Sign out"}
    </Button>
  );
}