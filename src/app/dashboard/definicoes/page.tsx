"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DefinicoesPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/perfil"); }, [router]);
  return null;
}
