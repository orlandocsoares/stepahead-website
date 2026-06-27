"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConteudosPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/ficheiros"); }, [router]);
  return null;
}
