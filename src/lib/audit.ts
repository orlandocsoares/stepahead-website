/**
 * Registo de auditoria para acções críticas do sistema.
 *
 * Grava na tabela `audit_logs` quem fez o quê, quando e de onde.
 * Falhas de gravação nunca bloqueiam a acção principal — são apenas logadas
 * no console para não penalizar o utilizador por erros de BD secundários.
 *
 * Acções registadas:
 *   - login_success / login_fail
 *   - register
 *   - approve_formando / reject_formando
 *   - approve_formador / reject_formador
 *   - role_change
 *   - session_cleanup
 */

import { dbQuery } from "@/lib/db";

export type AuditAction =
  | "login_success"
  | "login_fail"
  | "register"
  | "approve_formando"
  | "reject_formando"
  | "approve_formador"
  | "reject_formador"
  | "role_change"
  | "password_reset_request"
  | "password_reset_complete"
  | "session_cleanup";

export async function auditLog(
  action: AuditAction,
  opts: {
    /** ID do utilizador que executa a acção (quem age) */
    actorId?: string;
    /** ID do utilizador alvo (sobre quem a acção recai) */
    targetId?: string;
    /** IP do pedido */
    ip?: string;
    /** Dados adicionais relevantes (sem passwords nem secrets) */
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
    // Nunca bloquear a acção principal por falha de auditoria
    console.error("[audit] failed to write log:", err.message, { action, ...opts });
  }
}
