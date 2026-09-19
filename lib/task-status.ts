// Pure task status-transition rules (PRD §9 "Aturan status, waktu, dan konsistensi").
// Kept dependency-free and free of side effects so the rules can be unit-tested without a database.
export type TaskStatusValue = "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "CANCELLED";

// TODO -> IN_PROGRESS|BLOCKED|CANCELLED; IN_PROGRESS -> DONE|BLOCKED|CANCELLED|TODO; BLOCKED -> IN_PROGRESS|TODO|CANCELLED;
// DONE -> IN_PROGRESS (reopen, butuh alasan); CANCELLED -> TODO (reopen, butuh alasan).
export const TASK_STATUS_TRANSITIONS: Record<TaskStatusValue, TaskStatusValue[]> = {
  TODO: ["IN_PROGRESS", "BLOCKED", "CANCELLED"],
  IN_PROGRESS: ["DONE", "BLOCKED", "CANCELLED", "TODO"],
  BLOCKED: ["IN_PROGRESS", "TODO", "CANCELLED"],
  DONE: ["IN_PROGRESS"],
  CANCELLED: ["TODO"]
};

// DONE/CANCELLED hanya dapat dibuka kembali oleh Lead/Admin dan wajib menyertakan alasan.
export const REOPEN_FROM: TaskStatusValue[] = ["DONE", "CANCELLED"];

export const TASK_REOPEN_REASON_MAX = 500;

export function isTaskStatus(value: unknown): value is TaskStatusValue {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(TASK_STATUS_TRANSITIONS, value);
}

export function isAllowedTaskTransition(from: TaskStatusValue, to: TaskStatusValue) {
  return from === to || TASK_STATUS_TRANSITIONS[from].includes(to);
}

export function requiresReopenReason(from: TaskStatusValue, to: TaskStatusValue) {
  return from !== to && REOPEN_FROM.includes(from);
}
