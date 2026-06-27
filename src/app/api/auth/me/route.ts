import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";

// A lista de super-admins deve ser gerida no servidor para maior segurança.
const SUPER_ADMINS = [
  'programasabermais3ciclo@gmail.com', 
  'arch.medius@gmail.com'
];

export async function GET() {
  try {
    // getSessionUser() é a sua função de servidor que lê o cookie de sessão
    // e retorna o perfil do utilizador da sua base de dados local.
    const sessionProfile = await getSessionUser();

    if (!sessionProfile) {
      // Se não houver sessão, retorna um perfil nulo.
      return NextResponse.json({ profile: null });
    }

    let finalProfile = { ...sessionProfile };

    // A lógica de SUPER_ADMIN que estava no hook é movida para o servidor.
    const isMaster = SUPER_ADMINS.includes(finalProfile.email || '');
    if (isMaster) {
      finalProfile.role = 'super-admin';
      finalProfile.status = 'aprovado'; // ou 'activo'
      finalProfile.first_name = finalProfile.first_name || 'Coordenação';
      finalProfile.last_name = finalProfile.last_name || 'Saber Mais';
    }

    return NextResponse.json({ profile: finalProfile });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    console.error("Erro em /api/auth/me:", errorMessage);
    return NextResponse.json({ error: "Erro Interno do Servidor" }, { status: 500 });
  }
}