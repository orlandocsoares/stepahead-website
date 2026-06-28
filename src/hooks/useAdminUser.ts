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
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) { router.push("/"); return; }
        if (!r.ok) { setLoading(false); return; } // erro de servidor — não faz logout
        const { profile } = await r.json();
        if (!profile) router.push("/");
        else setUser(profile);
        setLoading(false);
      })
      .catch(() => setLoading(false)); // erro de rede — não faz logout
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return { user, loading, logout };
}
