import { dbQuery } from "@/lib/db";

export type AuditAction =
  // Auth
  | "login_success" | "login_fail" | "logout" | "register"
  | "password_reset_request" | "password_reset_complete" | "password_change"
  | "session_cleanup"
  // Ficheiros
  | "ficheiro_upload" | "ficheiro_edit" | "ficheiro_delete" | "ficheiro_site_publico"
  // Utilizadores
  | "user_create" | "user_approve" | "user_reject" | "user_delete"
  | "user_role_change" | "user_status_change"
  // Mensagens
  | "mensagem_send" | "mensagem_broadcast" | "mensagem_delete"
  // Tarefas
  | "tarefa_create" | "tarefa_delete" | "tarefa_status_change"
  // Turmas
  | "turma_create" | "turma_delete" | "turma_membro_add" | "turma_membro_remove"
  // Comunidade
  | "post_create" | "post_delete" | "comentario_create" | "comentario_delete"
  // Agenda
  | "evento_create" | "evento_delete"
  // Anúncios
  | "anuncio_create" | "anuncio_delete"
  // Config
  | "disciplina_create" | "disciplina_update" | "disciplina_delete"
  | "grupo_formacao_create" | "grupo_formacao_update" | "grupo_formacao_delete"
  // Legado (aprovações via rotas antigas)
  | "approve_formando" | "reject_formando" | "approve_formador" | "reject_formador"
  | "role_change";

export async function auditLog(
  action: AuditAction,
  opts: {
    actorId?: string;
    targetId?: string;
    ip?: string;
    details?: Record<string, unknown>;
  } = {}
): Promise<void> {
  try {
    await dbQuery(
      `INSERT INTO audit_logs (action, actor_id, target_id, ip, details, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        action,
        opts.actorId ?? null,
        opts.targetId ?? null,
        opts.ip ?? null,
        opts.details ? JSON.stringify(opts.details) : null,
      ]
    );
  } catch (err: any) {
    console.error("[audit] failed to write log:", err.message, { action, ...opts });
  }
}
