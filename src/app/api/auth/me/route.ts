import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";
import { dbQuery } from "@/lib/db";

const SUPER_ADMINS = [
  'programasabermais3ciclo@gmail.com',
  'arch.medius@gmail.com'
];

export async function GET() {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ profile: null });
    }

    // Buscar perfil completo da tabela profiles
    const result = await dbQuery(
      `SELECT p.id, u.email, p.first_name, p.last_name, p.role, p.status,
              p.avatar_url, p.provincia, p.escola, p.especialidade, p.biografia,
              p.specialization, p.genero, p.bi_number,
              p.nome_pai, p.nome_mae, p.data_nascimento, p.telemovel,
              p.naturalidade_provincia, p.naturalidade_municipio, p.municipio_residencia,
              p.habilitacoes_academicas, p.curso_concluido, p.agregacao_pedagogica,
              p.municipio_escola, p.ciclo_ensino, p.anos_servico_docente,
              p.disciplinas_lecciona, p.classes_lecciona, p.cargos_pedagogicos
       FROM profiles p
       JOIN auth_users u ON u.id = p.id
       WHERE p.id = $1
       LIMIT 1`,
      [sessionUser.id]
    );

    const profile = result.rows[0] ?? null;

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    // Super-admins por email
    const isMaster = SUPER_ADMINS.includes(profile.email || '');
    if (isMaster) {
      profile.role = 'super-admin';
      profile.status = 'activo';
      if (!profile.first_name) profile.first_name = 'Coordenação';
      if (!profile.last_name) profile.last_name = 'Saber Mais';
    }

    return NextResponse.json({ profile });

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro em /api/auth/me:", msg);
    return NextResponse.json({ error: "Erro Interno do Servidor" }, { status: 500 });
  }
}
