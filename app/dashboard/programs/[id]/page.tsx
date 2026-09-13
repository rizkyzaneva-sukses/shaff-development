"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, formatDate } from "@/lib/api-client";
import { Badge, EmptyState, FormField, Icon, inputClass } from "@/components/ops-ui";

type Program = {
  id: string;
  clientId: string;
  name: string;
  serviceType: string;
  objective: string;
  deliverables: string | null;
  startDate: string;
  targetDate: string;
  status: string;
  healthScore: number | null;
  risk: "HEALTHY" | "ATTENTION" | "CRITICAL";
  riskNote: string | null;
  client: { id: string; businessName: string };
  members: { user: { id: string; name: string; role: string } }[];
  tasks: { id: string; title: string; status: string; priority: string; dueDate: string; assignee?: { name: string } }[];
};

const serviceLabels: Record<string, string> = {
  BUSINESS_MENTORING: "Pendampingan bisnis",
  SYSTEM_DIGITALIZATION: "Digitalisasi sistem",
  COMBINED: "Pendampingan & digitalisasi",
};

const statusLabels: Record<string, string> = {
  PLANNED: "Direncanakan",
  ACTIVE: "Aktif",
  ON_HOLD: "Ditahan",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export default function ProgramDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [program, setProgram] = useState<Program | null>(null);
  const [error, setError] = useState("");
  const [healthSaving, setHealthSaving] = useState(false);

  // Health modal states
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [healthRisk, setHealthRisk] = useState<"HEALTHY" | "ATTENTION" | "CRITICAL">("HEALTHY");
  const [healthScoreInput, setHealthScoreInput] = useState("");
  const [healthNoteInput, setHealthNoteInput] = useState("");

  useEffect(() => {
    if (!id) return;
    apiFetch<{ program: Program }>(`/api/programs/${id}`)
      .then((payload) => setProgram(payload.program))
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Program gagal dimuat"));
  }, [id]);

  const progress = useMemo(
    () =>
      program?.tasks.length
        ? Math.round((program.tasks.filter((task) => task.status === "DONE").length / program.tasks.length) * 100)
        : 0,
    [program]
  );

  function openHealthModal() {
    if (!program) return;
    setHealthRisk(program.risk);
    setHealthScoreInput(program.healthScore != null ? String(program.healthScore) : "");
    setHealthNoteInput(program.riskNote ?? "");
    setHealthModalOpen(true);
  }

  async function submitHealth(e: React.FormEvent) {
    e.preventDefault();
    if (!program) return;
    setHealthSaving(true);
    const score = healthScoreInput === "" ? null : Math.min(100, Math.max(0, Number(healthScoreInput)));
    try {
      const payload = await apiFetch<{ program: Pick<Program, "healthScore" | "risk" | "riskNote"> }>(
        `/api/programs/${program.id}/health`,
        {
          method: "PATCH",
          body: JSON.stringify({
            risk: healthRisk,
            healthScore: score,
            riskNote: healthNoteInput.trim() || null,
          }),
        }
      );
      setProgram((current) => (current ? { ...current, ...payload.program } : current));
      setHealthModalOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Health program gagal disimpan");
    } finally {
      setHealthSaving(false);
    }
  }

  if (!program && !error) {
    return (
      <div className="ops-page">
        <div className="grid min-h-[420px] place-items-center text-sm text-[var(--muted)]">Memuat program…</div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="ops-page">
        <Link href="/dashboard/programs" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-[#506545]">
          ← Semua program
        </Link>
        <EmptyState icon="layers" title="Program tidak tersedia" description={error || "Data program tidak ditemukan."} />
      </div>
    );
  }

  return (
    <div className="ops-page page-enter">
      <Link
        href="/dashboard/programs"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#506545] hover:text-[#bf6d4e]"
      >
        ← Semua program
      </Link>

      <section className="mt-5 flex flex-col justify-between gap-5 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">{program.client.businessName}</p>
          <h1 className="mt-1 text-[clamp(1.65rem,3vw,2.35rem)] font-semibold tracking-[-0.045em] text-[#263328]">
            {program.name}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {serviceLabels[program.serviceType] ?? program.serviceType} · target {formatDate(program.targetDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={program.status === "ACTIVE" ? "sage" : program.status === "ON_HOLD" ? "amber" : "slate"} dot>
            {statusLabels[program.status] ?? program.status}
          </Badge>
          <Link
            href="/dashboard/tasks"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#bf6d4e] px-3.5 text-xs font-semibold text-white hover:bg-[#a95f42]"
          >
            <Icon name="plus" size={15} /> Tambah task
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="surface p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Kesehatan program</p>
              <h2 className="mt-1 text-lg font-semibold text-[#334035]">{progress}% task selesai</h2>
            </div>
            <span className="text-sm font-semibold text-[#506545]">
              {program.tasks.filter((task) => task.status === "DONE").length}/{program.tasks.length}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge
              tone={
                program.risk === "HEALTHY" ? "sage" : program.risk === "CRITICAL" ? "terracotta" : "amber"
              }
              dot
            >
              {program.risk} {program.healthScore === null ? "" : `· ${program.healthScore}/100`}
            </Badge>
            <button
              type="button"
              onClick={openHealthModal}
              disabled={healthSaving}
              className="button button-quiet"
            >
              Update health
            </button>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#edf1eb]">
            <span className="block h-full rounded-full bg-[#738b69] transition-all" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-[var(--muted)]">Mulai</p>
              <strong className="mt-1 block text-sm text-[#4b584d]">{formatDate(program.startDate)}</strong>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Target selesai</p>
              <strong className="mt-1 block text-sm text-[#4b584d]">{formatDate(program.targetDate)}</strong>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Blocked</p>
              <strong className="mt-1 block text-sm text-[#a45338]">
                {program.tasks.filter((task) => task.status === "BLOCKED").length}
              </strong>
            </div>
          </div>

          {program.riskNote && (
            <div className="mt-5 rounded-xl bg-[#fff9ee] p-4 border border-[#ebd7a7]">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#8d681e]">Catatan Risiko</p>
              <p className="mt-1 text-sm text-[#6f5b2a]">{program.riskNote}</p>
            </div>
          )}

          <div className="mt-5 border-t border-[var(--border)] pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Tujuan</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#4b584d]">{program.objective}</p>
            {program.deliverables && (
              <>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Deliverable</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#4b584d]">{program.deliverables}</p>
              </>
            )}
          </div>
        </article>

        <article className="surface p-5 sm:p-6">
          <p className="eyebrow">Tim program</p>
          <h2 className="mt-1 text-lg font-semibold text-[#334035]">{program.members.length} anggota aktif</h2>
          <div className="mt-5 grid gap-3">
            {program.members.map((member) => (
              <div key={member.user.id} className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#d7e3d2] text-xs font-bold text-[#506545]">
                  {member.user.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#4b584d]">{member.user.name}</p>
                  <p className="text-xs text-[var(--muted)]">{member.user.role}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="surface mt-5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Pekerjaan program</p>
            <h2 className="mt-1 text-lg font-semibold text-[#334035]">{program.tasks.length} task</h2>
          </div>
          <Link href="/dashboard/tasks" className="text-xs font-semibold text-[#506545]">
            Buka board →
          </Link>
        </div>

        {program.tasks.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon="checkSquare"
              title="Belum ada task"
              description="Tambahkan pekerjaan agar progress program dapat dipantau."
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-2">
            {program.tasks.map((task) => (
              <Link
                key={task.id}
                href={`/dashboard/tasks/${task.id}`}
                className="flex flex-col gap-2 rounded-xl border border-[var(--border)] p-4 transition hover:border-[#b8c8b1] sm:flex-row sm:items-center"
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    task.status === "DONE"
                      ? "bg-[#738b69]"
                      : task.status === "BLOCKED"
                      ? "bg-[#bf6d4e]"
                      : "bg-[#d8a84e]"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm text-[#334035]">{task.title}</strong>
                  <span className="text-xs text-[var(--muted)]">{task.assignee?.name ?? "Assignee"}</span>
                </span>
                <span className="text-xs text-[var(--muted)]">{formatDate(task.dueDate)}</span>
                <Badge
                  tone={task.status === "DONE" ? "sage" : task.status === "BLOCKED" ? "terracotta" : "amber"}
                >
                  {task.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Health Update Modal */}
      {healthModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#283529]/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">Evaluasi Program</p>
                <h2 className="mt-1 text-xl font-semibold text-[#334035]">Update Kesehatan Program</h2>
              </div>
              <button
                type="button"
                onClick={() => setHealthModalOpen(false)}
                className="text-xl text-[var(--muted)] hover:text-black"
                aria-label="Tutup"
              >
                ×
              </button>
            </div>

            <form onSubmit={submitHealth} className="mt-5 grid gap-4">
              <FormField label="Level Risiko">
                <select
                  value={healthRisk}
                  onChange={(e) => setHealthRisk(e.target.value as "HEALTHY" | "ATTENTION" | "CRITICAL")}
                  className={inputClass}
                >
                  <option value="HEALTHY">HEALTHY (Aman)</option>
                  <option value="ATTENTION">ATTENTION (Perlu Perhatian)</option>
                  <option value="CRITICAL">CRITICAL (Kritis / Macet)</option>
                </select>
              </FormField>

              <FormField label="Health Score (0 - 100, opsional)">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={healthScoreInput}
                  onChange={(e) => setHealthScoreInput(e.target.value)}
                  placeholder="Contoh: 85"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Catatan Risiko / Evaluasi">
                <textarea
                  value={healthNoteInput}
                  onChange={(e) => setHealthNoteInput(e.target.value)}
                  placeholder="Jelaskan faktor risiko atau evaluasi terkini..."
                  className={`${inputClass} min-h-[80px] resize-none`}
                  rows={3}
                />
              </FormField>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setHealthModalOpen(false)}
                  disabled={healthSaving}
                  className="button button-quiet"
                >
                  Batal
                </button>
                <button type="submit" disabled={healthSaving} className="button button-primary">
                  {healthSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
