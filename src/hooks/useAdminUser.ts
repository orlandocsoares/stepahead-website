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
  specialization?: string; // JSON string[] de áreas/disciplinas seleccionadas no perfil
  province?: string;
  biografia?: string;
  genero?: string;
  bi_number?: string;
  nome_pai?: string;
  nome_mae?: string;
  data_nascimento?: string;
  telemovel?: string;
  naturalidade_provincia?: string;
  naturalidade_municipio?: string;
  municipio_residencia?: string;
  habilitacoes_academicas?: string;
  curso_concluido?: string;
  agregacao_pedagogica?: boolean;
  municipio_escola?: string;
  ciclo_ensino?: string;
  anos_servico_docente?: number;
  disciplinas_lecciona?: string;
  classes_lecciona?: string;
  cargos_pedagogicos?: string;
  must_change_password?: boolean;
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
