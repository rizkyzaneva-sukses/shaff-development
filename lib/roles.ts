import type { UserRole } from "@prisma/client";

/**
 * The workspace has five roles: ADMIN, LEAD, FINANCE, CMO, COO.
 *
 * CMO and COO are both "pelaksana" (program executors): they take tasks, log
 * meetings, upload documents, and only see clients/programs they belong to.
 * They differ only in extra permissions layered on top (CMO may create clients
 * and programs, COO may activate a prospect into a client).
 *
 * Use `isExecutorRole` instead of comparing against a single role so a new
 * executor role never silently loses access to tasks, meetings or documents.
 */
export const EXECUTOR_ROLES: UserRole[] = ["CMO", "COO"];

export function isExecutorRole(role: string | null | undefined): boolean {
  return role === "CMO" || role === "COO";
}

/** True for CMO or COO — the two program-executor roles. */
export function isExecutor(role: string | null | undefined): boolean {
  return role === "CMO" || role === "COO";
}

/** All internal roles, for endpoints every signed-in user may reach. */
export const ALL_ROLES: UserRole[] = ["ADMIN", "LEAD", "FINANCE", "CMO", "COO"];

/** Roles that may work on tasks, meetings and documents. */
export const WORKER_ROLES: UserRole[] = ["ADMIN", "LEAD", "CMO", "COO"];
