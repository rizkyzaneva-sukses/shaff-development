"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, ApiError, formatDate } from "@/lib/api-client";
import { Badge, EmptyState, FormField, Icon, inputClass } from "@/components/ops-ui";

type Task = {
  id: string;
  programId: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  blockedReason: string | null;
  completionNote: string | null;
  version: number;
  program: { id: string; name: string; client: { id: string; businessName: string } };
  assignee: { id: string; name: string; role?: string };
  checklist: { id: string; label: string; isDone: boolean }[];
  comments: { id: string; body: string; createdAt: string; author: { id: string; name: string } }[];
};

const priorityTone: Record<Task["priority"], "sage" | "terracotta" | "amber" | "slate" | "red"> = {
  LOW: "slate",
  MEDIUM: "amber",
  HIGH: "terracotta",
  URGENT: "red",
};

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState("");

  // Modals for blocked & done
  const [modalType, setModalType] = useState<"BLOCKED" | "DONE" | null>(null);
  const [modalText, setModalText] = useState("");

  // Checklist input state
  const [newChecklistLabel, setNewChecklistLabel] = useState("");
  const [checklistLoading, setChecklistLoading] = useState(false);

  // Comment input state
  const [newCommentBody, setNewCommentBody] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiFetch<{ task: Task }>(`/api/tasks/${id}`)
      .then((payload) => setTask(payload.task))
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Task gagal dimuat"));
  }, [id]);

  function openStatusModal(targetStatus: "BLOCKED" | "DONE") {
    if (!task) return;
    setModalType(targetStatus);
    setModalText(targetStatus === "BLOCKED" ? (task.blockedReason ?? "") : (task.completionNote ?? ""));
  }

  async function submitStatusModal() {
    if (!task || !modalType || !modalText.trim()) return;
    setSaving(true);
    setMutationError("");
    try {
      const payload = await apiFetch<{ task: Task }>(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: modalType,
          version: task.version,
          ...(modalType === "BLOCKED" ? { blockedReason: modalText.trim() } : {}),
          ...(modalType === "DONE" ? { completionNote: modalText.trim() } : {}),
        }),
      });
      setTask(payload.task);
      setModalType(null);
      setModalText("");
    } catch (cause) {
      setMutationError(cause instanceof ApiError ? cause.message : "Perubahan task gagal disimpan");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(status: Task["status"]) {
    if (!task || status === task.status) return;
    if (status === "BLOCKED" || status === "DONE") {
      openStatusModal(status);
      return;
    }
    setSaving(true);
    setMutationError("");
    try {
      const payload = await apiFetch<{ task: Task }>(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, version: task.version }),
      });
      setTask(payload.task);
    } catch (cause) {
      setMutationError(cause instanceof ApiError ? cause.message : "Perubahan task gagal disimpan");
    } finally {
      setSaving(false);
    }
  }

  async function toggleChecklistItem(itemId: string, isDone: boolean) {
    if (!task) return;
    // Optimistic UI update
    setTask({
      ...task,
      checklist: task.checklist.map((item) => (item.id === itemId ? { ...item, isDone } : item)),
    });
    try {
      await apiFetch<{ item: { id: string; isDone: boolean } }>(`/api/tasks/${task.id}/checklist`, {
        method: "PATCH",
        body: JSON.stringify({ itemId, isDone }),
      });
    } catch {
      // Revert if failed
      setTask((current) =>
        current
          ? {
              ...current,
              checklist: current.checklist.map((item) =>
                item.id === itemId ? { ...item, isDone: !isDone } : item
              ),
            }
          : current
      );
    }
  }

  async function addChecklistItem(e: React.FormEvent) {
    e.preventDefault();
    if (!task || !newChecklistLabel.trim()) return;
    setChecklistLoading(true);
    try {
      const payload = await apiFetch<{ item: { id: string; label: string; isDone: boolean } }>(
        `/api/tasks/${task.id}/checklist`,
        {
          method: "POST",
          body: JSON.stringify({ label: newChecklistLabel.trim() }),
        }
      );
      setTask({
        ...task,
        checklist: [...task.checklist, payload.item],
      });
      setNewChecklistLabel("");
    } catch (cause) {
      setMutationError(cause instanceof ApiError ? cause.message : "Gagal menambah checklist");
    } finally {
      setChecklistLoading(false);
    }
  }

  async function deleteChecklistItem(itemId: string) {
    if (!task) return;
    setTask({
      ...task,
      checklist: task.checklist.filter((item) => item.id !== itemId),
    });
    try {
      await apiFetch(`/api/tasks/${task.id}/checklist?itemId=${itemId}`, {
        method: "DELETE",
      });
    } catch {
      // reload task on error
      apiFetch<{ task: Task }>(`/api/tasks/${task.id}`).then((p) => setTask(p.task));
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!task || !newCommentBody.trim()) return;
    setCommentLoading(true);
    try {
      const payload = await apiFetch<{
        comment: { id: string; body: string; createdAt: string; author: { id: string; name: string } };
      }>(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: newCommentBody.trim() }),
      });
      setTask({
        ...task,
        comments: [...task.comments, payload.comment],
      });
      setNewCommentBody("");
    } catch (cause) {
      setMutationError(cause instanceof ApiError ? cause.message : "Gagal mengirim komentar");
    } finally {
      setCommentLoading(false);
    }
  }

  if (!task && !error) {
    return (
      <div className="ops-page">
        <div className="grid min-h-[420px] place-items-center text-sm text-[var(--muted)]">
          Memuat pekerjaan…
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="ops-page">
        <Link href="/dashboard/tasks" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-[#506545]">
          ← Semua pekerjaan
        </Link>
        <EmptyState icon="checkSquare" title="Task tidak tersedia" description={error || "Data task tidak ditemukan."} />
      </div>
    );
  }

  return (
    <div className="ops-page page-enter">
      <Link
        href="/dashboard/tasks"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#506545] hover:text-[#bf6d4e]"
      >
        ← Semua pekerjaan
      </Link>

      <section className="mt-5 flex flex-col justify-between gap-5 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">
            {task.program.client.businessName} · {task.program.name}
          </p>
          <h1 className="mt-1 max-w-3xl text-[clamp(1.65rem,3vw,2.35rem)] font-semibold tracking-[-0.045em] text-[#263328]">
            {task.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Ditugaskan kepada {task.assignee.name} · deadline {formatDate(task.dueDate)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
          <Badge tone={task.status === "DONE" ? "sage" : task.status === "BLOCKED" ? "terracotta" : "amber"} dot>
            {task.status}
          </Badge>
          {task.status !== "DONE" && (
            <button
              disabled={saving}
              type="button"
              onClick={() => updateStatus("DONE")}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#506545] px-3.5 text-xs font-semibold text-white transition hover:bg-[#3f5037] disabled:opacity-60"
            >
              <Icon name="check" size={15} /> Tandai selesai
            </button>
          )}
          {task.status !== "BLOCKED" && task.status !== "DONE" && (
            <button
              disabled={saving}
              type="button"
              onClick={() => updateStatus("BLOCKED")}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#d9aaa0] bg-white px-3.5 text-xs font-semibold text-[#a45338] transition hover:bg-[#fbf4f2] disabled:opacity-60"
            >
              Tandai blocked
            </button>
          )}
          {task.status === "BLOCKED" && (
            <button
              disabled={saving}
              type="button"
              onClick={() => updateStatus("IN_PROGRESS")}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#b8c8b1] bg-white px-3.5 text-xs font-semibold text-[#506545] transition hover:bg-[#f5f8f3] disabled:opacity-60"
            >
              Lanjutkan kembali
            </button>
          )}
        </div>
      </section>

      {mutationError && (
        <div className="mt-5 rounded-xl bg-[#fae9e7] p-3 text-xs font-medium text-[#a5423a]" role="alert">
          {mutationError}
        </div>
      )}

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="surface p-5 sm:p-6">
          <p className="eyebrow">Konteks pekerjaan</p>
          <h2 className="mt-1 text-lg font-semibold text-[#334035]">Deskripsi dan hasil</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#4b584d]">
            {task.description || "Belum ada deskripsi."}
          </p>
          {task.blockedReason && (
            <div className="mt-5 rounded-xl bg-[#fff6df] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#8d681e]">Alasan blocked</p>
              <p className="mt-1 text-sm leading-6 text-[#6f5b2a]">{task.blockedReason}</p>
            </div>
          )}
          {task.completionNote && (
            <div className="mt-5 rounded-xl bg-[#eef3ec] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#506545]">Ringkasan hasil</p>
              <p className="mt-1 text-sm leading-6 text-[#4b584d]">{task.completionNote}</p>
            </div>
          )}
        </article>

        <article className="surface p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Checklist</p>
              <h2 className="mt-1 text-lg font-semibold text-[#334035]">
                {task.checklist.filter((i) => i.isDone).length}/{task.checklist.length} selesai
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-2.5">
            {task.checklist.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Belum ada item checklist.</p>
            ) : (
              task.checklist.map((item) => (
                <div
                  className="group flex items-center justify-between gap-3 rounded-lg p-1.5 transition hover:bg-[#f6f9f5]"
                  key={item.id}
                >
                  <button
                    type="button"
                    onClick={() => toggleChecklistItem(item.id, !item.isDone)}
                    className="flex flex-1 items-center gap-3 text-left text-sm"
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${
                        item.isDone
                          ? "border-[#738b69] bg-[#738b69] text-white"
                          : "border-[#b8c8b1] bg-white group-hover:border-[#738b69]"
                      }`}
                    >
                      {item.isDone && <Icon name="check" size={13} />}
                    </span>
                    <span className={item.isDone ? "text-[var(--muted)] line-through" : "text-[#334035]"}>
                      {item.label}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteChecklistItem(item.id)}
                    className="opacity-0 transition group-hover:opacity-100 text-[var(--muted)] hover:text-[#a5423a] p-1"
                    title="Hapus checklist"
                  >
                    <Icon name="close" size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={addChecklistItem} className="mt-4 flex gap-2 border-t border-[var(--border)] pt-4">
            <input
              type="text"
              className={`${inputClass} flex-1 text-xs`}
              placeholder="Tambah item checklist..."
              value={newChecklistLabel}
              onChange={(e) => setNewChecklistLabel(e.target.value)}
              disabled={checklistLoading}
            />
            <button
              type="submit"
              disabled={checklistLoading || !newChecklistLabel.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#506545] px-3 text-xs font-semibold text-white transition hover:bg-[#3f5037] disabled:opacity-50"
            >
              <Icon name="plus" size={14} /> Tambah
            </button>
          </form>

          <div className="mt-6 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted)]">
            <p>Versi data: {task.version}</p>
            <p className="mt-1">Perubahan disimpan dengan kontrol konflik.</p>
          </div>
        </article>
      </section>

      <section className="surface mt-5 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Activity</p>
            <h2 className="mt-1 text-lg font-semibold text-[#334035]">Catatan & Komentar ({task.comments.length})</h2>
          </div>
        </div>

        {/* Comment Input Form */}
        <form onSubmit={submitComment} className="mt-5">
          <div className="rounded-xl border border-[var(--border)] bg-white p-3 focus-within:border-[#738b69]">
            <textarea
              className="w-full resize-none border-0 bg-transparent text-sm text-[#334035] focus:outline-none"
              rows={2}
              placeholder="Tulis update atau catatan untuk task ini..."
              value={newCommentBody}
              onChange={(e) => setNewCommentBody(e.target.value)}
              disabled={commentLoading}
            />
            <div className="mt-2 flex justify-end border-t border-[var(--border)] pt-2">
              <button
                type="submit"
                disabled={commentLoading || !newCommentBody.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#506545] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3f5037] disabled:opacity-50"
              >
                {commentLoading ? "Mengirim..." : "Kirim komentar"}
              </button>
            </div>
          </div>
        </form>

        {task.comments.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon="note"
              title="Belum ada komentar"
              description="Jadikan section ini tempat koordinasi dan update berkala untuk task ini."
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {task.comments.map((comment) => (
              <div className="rounded-xl border border-[var(--border)] p-4 bg-white" key={comment.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[#d7e3d2] text-[10px] font-bold text-[#506545]">
                      {comment.author.name.slice(0, 2).toUpperCase()}
                    </span>
                    <strong className="text-sm text-[#4b584d]">{comment.author.name}</strong>
                  </div>
                  <span className="text-xs text-[var(--muted)]">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#4b584d] whitespace-pre-wrap">{comment.body}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal Dialog for BLOCKED / DONE status */}
      {modalType && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#283529]/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl sm:p-7">
            <p className="eyebrow">
              {modalType === "BLOCKED" ? "Status Terblokir" : "Pekerjaan Selesai"}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#334035]">
              {modalType === "BLOCKED" ? "Mengapa pekerjaan terblokir?" : "Ringkasan hasil pekerjaan"}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {modalType === "BLOCKED"
                ? "Jelaskan kendala atau dependensi yang menghambat penyelesaian task ini."
                : "Tuliskan hasil akhir atau bukti bahwa deliverable task sudah selesai."}
            </p>
            <div className="mt-4">
              <FormField label={modalType === "BLOCKED" ? "Alasan Kendala" : "Ringkasan Hasil"}>
                <textarea
                  className={`${inputClass} min-h-[90px] resize-none`}
                  rows={3}
                  value={modalText}
                  onChange={(e) => setModalText(e.target.value)}
                  placeholder={
                    modalType === "BLOCKED"
                      ? "Contoh: Menunggu approval dokumen dari PIC client..."
                      : "Contoh: Laporan asesmen telah diserahkan dan disetujui..."
                  }
                  required
                />
              </FormField>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalType(null);
                  setModalText("");
                }}
                disabled={saving}
                className="button button-quiet"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitStatusModal}
                disabled={saving || !modalText.trim()}
                className="button button-primary"
              >
                {saving ? "Menyimpan..." : "Simpan status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
