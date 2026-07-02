import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";
import { dbQuery } from "@/lib/db";
import { auditLog } from "@/lib/audit";

// PATCH /api/arquivos/editar — editar metadados de um ficheiro
export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [session.id]);
  const role = profileRes.rows[0]?.role;

  const { id, label, area, visibilidade, turma_id, disponivel_de, disponivel_ate, grupos, site_publico, thumbnail_url } = await request.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

  // Verificar que o utilizador é dono ou admin
  const fileRes = await dbQuery(`SELECT uploader_id FROM arquivos WHERE id = $1 LIMIT 1`, [id]);
  const file = fileRes.rows[0];
  if (!file) return NextResponse.json({ error: "Ficheiro não encontrado." }, { status: 404 });
  const isAdmin = role === "admin" || role === "super-admin";
  if (!isAdmin && file.uploader_id !== session.id) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  // Actualizar metadados
  // thumbnail_url tem 3 estados possíveis vindos do cliente:
  //   undefined -> não foi tocado, mantém o valor actual
  //   ""        -> remover capa (voltar à miniatura automática)
  //   "url"     -> definir esta capa
  await dbQuery(
    `UPDATE arquivos SET
       label          = COALESCE($2, label),
       area           = COALESCE($3, area),
       visibilidade   = COALESCE($4, visibilidade),
       turma_id       = $5,
       disponivel_de  = $6,
       disponivel_ate = $7,
       site_publico   = COALESCE($8, site_publico),
       thumbnail_url  = CASE
         WHEN $9::text IS NULL THEN thumbnail_url
         WHEN $9::text = ''    THEN NULL
         ELSE $9::text
       END
     WHERE id = $1`,
    [
      id,
      label?.trim() || null,
      area || null,
      visibilidade || null,
      (visibilidade === "turma" || visibilidade === "formadores_turma") ? (turma_id || null) : null,
      disponivel_de || null,
      disponivel_ate || null,
      typeof site_publico === "boolean" ? site_publico : null,
      typeof thumbnail_url === "string" ? thumbnail_url : null,
    ]
  );

  // Actualizar grupos (substituir todos)
  if (Array.isArray(grupos)) {
    await dbQuery(`DELETE FROM arquivo_grupos WHERE arquivo_id = $1`, [id]);
    if (grupos.length > 0) {
      const vals = grupos.map((gid: string) => `('${id}', '${gid}')`).join(", ");
      await dbQuery(`INSERT INTO arquivo_grupos (arquivo_id, grupo_id) VALUES ${vals} ON CONFLICT DO NOTHING`, []);
    }
    // Manter coluna legada em sync com o primeiro grupo (ou null)
    await dbQuery(`UPDATE arquivos SET grupo_formacao_id = $2 WHERE id = $1`, [id, grupos[0] ?? null]);
  }

  await auditLog(
    typeof site_publico === "boolean" && site_publico !== file.site_publico
      ? "ficheiro_site_publico"
      : "ficheiro_edit",
    { actorId: session.id, targetId: id, details: { label: label?.trim(), area, site_publico } }
  );

  return NextResponse.json({ ok: true });
}
