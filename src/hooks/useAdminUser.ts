"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type AdminUser = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  status?: string;
  avatar_url?: string;
  specialization?: string;
  province?: string;
  biografia?: string;
};

export function useAdminUser() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(({ profile }) => {
        if (!profile) {
          router.push("/");
        } else {
          setUser(profile);
        }
      })
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return { user, loading, logout };
}
