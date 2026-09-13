"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, EmptyState, FormField, Icon, MetricCard, PageHeader, SearchField, TabButton, inputClass } from "@/components/ops-ui";
import { TiptapEditor, TiptapViewer } from "@/components/tiptap-editor";

type Program = { id: string; name: string; clientId: string; client: { id: string; businessName: string }; status: string };
type Meeting = {
  id: string; title: string; meetingAt: string; participants?: string | null;
  summary?: string | null; summaryJson?: Record<string, unknown> | null; summaryText?: string | null;
  decisions?: string | null; decisionsJson?: Record<string, unknown> | null; decisionsText?: string | null;
  status: "DRAFT" | "FINAL"; client: { id: string; businessName: string }; program: { id: string; name: string };
  actionItems: Array<{ id: string; description: string; taskId?: string | null; noTaskReason?: string | null }>;
};

const statusLabel = { DRAFT: "Draft", FINAL: "Final" } as const;
const statusTone = { DRAFT: "amber", FINAL: "sage" } as const;
const formatDate = (value: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

function parsePlainTextToDoc(text: string | null | undefined): Record<string, unknown> | null {
  if (!text || !text.trim()) return null;
  const lines = text.split("\n");
  const content: Record<string, unknown>[] = [];
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) continue;
    if (line.startsWith("- ")) {
      content.push({ type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: line.slice(2) }] }] }] });
      continue;
    }
    const orderedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (orderedMatch) {
      content.push({ type: "orderedList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: orderedMatch[2] }] }] }] });
      continue;
    }
    if (line.startsWith("### ")) {
      content.push({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: line.slice(4) }] });
      continue;
    }
    if (line.startsWith("## ")) {
      content.push({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: line.slice(3) }] });
      continue;
    }
    if (line.startsWith("# ")) {
      content.push({ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: line.slice(2) }] });
      continue;
    }
    content.push({ type: "paragraph", content: [{ type: "text", text: line }] });
  }
  if (content.length === 0) return null;
  return { type: "doc", content };
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "upcoming" | "final">("all");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // New meeting form state
  const [newSummaryJson, setNewSummaryJson] = useState<Record<string, unknown> | null>(null);
  const [newSummaryText, setNewSummaryText] = useState("");

  // Autosave state
  const [editSummaryJson, setEditSummaryJson] = useState<Record<string, unknown> | null>(null);
  const [editSummaryText, setEditSummaryText] = useState("");
  const [editDecisionsJson, setEditDecisionsJson] = useState<Record<string, unknown> | null>(null);
  const [editDecisionsText, setEditDecisionsText] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUnsavedRef = useRef(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [meetingResponse, programResponse] = await Promise.all([
        fetch("/api/meetings", { cache: "no-store" }),
        fetch("/api/programs", { cache: "no-store" }),
      ]);
      if (!meetingResponse.ok || !programResponse.ok) throw new Error("Data meeting tidak dapat dimuat");
      const [meetingData, programData] = await Promise.all([meetingResponse.json(), programResponse.json()]);
      setMeetings(meetingData.meetings ?? []);
      setPrograms(programData.programs ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Data tidak dapat dimuat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  // Warn on unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const filtered = useMemo(() => meetings.filter((meeting) => {
    const text = [meeting.title, meeting.client.businessName, meeting.program.name].join(" ").toLowerCase();
    const matchesTab = tab === "all" || (tab === "upcoming" ? new Date(meeting.meetingAt) >= new Date() : meeting.status === "FINAL");
    return text.includes(query.toLowerCase()) && matchesTab;
  }), [meetings, query, tab]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: offset + total }, (_, index) => (index < offset ? null : new Date(year, month, index - offset + 1)));
  }, [calendarMonth]);

  const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(calendarMonth);

  const closeForm = () => {
    setShowForm(false);
    setNewSummaryJson(null);
    setNewSummaryText("");
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const program = programs.find((item) => item.id === form.get("programId"));
    if (!program) return;

    const response = await fetch("/api/meetings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        programId: program.id,
        clientId: program.clientId,
        title: form.get("title"),
        meetingAt: new Date(String(form.get("meetingAt"))).toISOString(),
        participants: form.get("participants"),
        summary: newSummaryText || null,
        summaryJson: newSummaryJson,
        summaryText: newSummaryText || null,
        decisions: null,
        status: "DRAFT",
        actionItems: [],
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return notify(payload.error ?? "Meeting gagal disimpan");
    closeForm();
    notify("Meeting tersimpan sebagai draft");
    await load();
  };

  const selectMeeting = (meeting: Meeting) => {
    setSelected(meeting);
    setEditSummaryJson(meeting.summaryJson ?? parsePlainTextToDoc(meeting.summary));
    setEditSummaryText(meeting.summaryText ?? meeting.summary ?? "");
    setEditDecisionsJson(meeting.decisionsJson ?? parsePlainTextToDoc(meeting.decisions));
    setEditDecisionsText(meeting.decisionsText ?? meeting.decisions ?? "");
    setSaveStatus("idle");
    hasUnsavedRef.current = false;
  };

  const doSave = async (
    meetingId: string,
    summaryJson: Record<string, unknown> | null,
    summaryText: string,
    decisionsJson: Record<string, unknown> | null,
    decisionsText: string,
  ) => {
    setSaveStatus("saving");
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          summaryJson,
          summaryText,
          summary: summaryText,
          decisionsJson,
          decisionsText,
          decisions: decisionsText,
        }),
      });
      if (!response.ok) throw new Error("Gagal menyimpan");
      setSaveStatus("saved");
      hasUnsavedRef.current = false;
      await load();
    } catch {
      setSaveStatus("error");
    }
  };

  const scheduleSave = (
    meetingId: string,
    summaryJson: Record<string, unknown> | null,
    summaryText: string,
    decisionsJson: Record<string, unknown> | null,
    decisionsText: string,
  ) => {
    hasUnsavedRef.current = true;
    setSaveStatus("idle");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => doSave(meetingId, summaryJson, summaryText, decisionsJson, decisionsText), 1500);
  };

  const onSummaryChange = (json: Record<string, unknown>, text: string) => {
    setEditSummaryJson(json);
    setEditSummaryText(text);
    if (selected) scheduleSave(selected.id, json, text, editDecisionsJson, editDecisionsText);
  };

  const onDecisionsChange = (json: Record<string, unknown>, text: string) => {
    setEditDecisionsJson(json);
    setEditDecisionsText(text);
    if (selected) scheduleSave(selected.id, editSummaryJson, editSummaryText, json, text);
  };

  const onSummaryBlur = () => {
    if (selected && hasUnsavedRef.current) doSave(selected.id, editSummaryJson, editSummaryText, editDecisionsJson, editDecisionsText);
  };

  const onDecisionsBlur = () => {
    if (selected && hasUnsavedRef.current) doSave(selected.id, editSummaryJson, editSummaryText, editDecisionsJson, editDecisionsText);
  };

  const finalize = async () => {
    if (!selected) return;
    // Save current content first
    await doSave(selected.id, editSummaryJson, editSummaryText, editDecisionsJson, editDecisionsText);
    const response = await fetch(`/api/meetings/${selected.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "FINAL" }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return notify(payload.error ?? "Meeting gagal difinalkan");
    setSelected(null);
    notify("Meeting difinalkan");
    await load();
  };

  return (
    <div className="ops-page">
      <PageHeader
        eyebrow="Dokumentasi layanan"
        title="Meeting & konsultasi"
        description="Jaga setiap percakapan tetap punya keputusan dan tindak lanjut yang jelas."
        action={() => setShowForm(true)}
        actionLabel="Catat meeting"
      />
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total meeting" value={String(meetings.length)} detail="dari database" tone="sage" icon="calendar" />
        <MetricCard label="Mendatang" value={String(meetings.filter((item) => new Date(item.meetingAt) >= new Date()).length)} detail="perlu persiapan" tone="terracotta" icon="clock" />
        <MetricCard label="Belum final" value={String(meetings.filter((item) => item.status === "DRAFT").length)} detail="perlu dirapikan" tone="amber" icon="file" />
        <MetricCard label="Action item" value={String(meetings.reduce((sum, item) => sum + item.actionItems.length, 0))} detail="tercatat" tone="red" icon="arrow" />
      </section>
      <section className="surface mt-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-5 overflow-x-auto border-b border-[var(--border)] lg:border-0">
            <TabButton active={tab === "all"} onClick={() => setTab("all")} count={meetings.length}>Semua</TabButton>
            <TabButton active={tab === "upcoming"} onClick={() => setTab("upcoming")} count={meetings.filter((item) => new Date(item.meetingAt) >= new Date()).length}>Mendatang</TabButton>
            <TabButton active={tab === "final"} onClick={() => setTab("final")} count={meetings.filter((item) => item.status === "FINAL").length}>Final</TabButton>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex rounded-xl border border-[var(--border)] p-1">
              <button
                type="button"
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${view === "list" ? "bg-[#eef3ec] text-[#506545]" : "text-[var(--muted)]"}`}
                onClick={() => setView("list")}
              >
                Daftar
              </button>
              <button
                type="button"
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${view === "calendar" ? "bg-[#eef3ec] text-[#506545]" : "text-[var(--muted)]"}`}
                onClick={() => setView("calendar")}
              >
                Kalender
              </button>
            </div>
            <SearchField value={query} onChange={setQuery} placeholder="Cari meeting, client..." />
          </div>
        </div>
        {loading ? (
          <div className="empty-state mt-5">
            <Icon name="clock" size={22} />
            <strong>Memuat meeting...</strong>
          </div>
        ) : error ? (
          <div className="empty-state mt-5">
            <Icon name="spark" size={22} />
            <strong>Meeting belum tersedia</strong>
            <span>{error}</span>
            <button className="button button-quiet" onClick={() => void load()}>Coba lagi</button>
          </div>
        ) : view === "calendar" ? (
          <div className="mt-5">
            <div className="mb-4 flex items-center justify-between">
              <button type="button" className="button button-quiet" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}>←</button>
              <h3 className="text-base font-semibold capitalize text-[#334035]">{monthLabel}</h3>
              <button type="button" className="button button-quiet" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}>→</button>
            </div>
            <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-[var(--border)]">
              <div className="col-span-7 grid grid-cols-7 bg-[#fbfcfa]">
                {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
                  <div key={day} className="border-b border-[var(--border)] px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{day}</div>
                ))}
              </div>
              {calendarDays.map((day, index) => {
                const dayMeetings = day
                  ? filtered.filter((meeting) => {
                      const date = new Date(meeting.meetingAt);
                      return date.getFullYear() === day.getFullYear() && date.getMonth() === day.getMonth() && date.getDate() === day.getDate();
                    })
                  : [];
                return (
                  <div key={day?.toISOString() ?? `empty-${index}`} className="min-h-28 border-b border-r border-[var(--border)] p-2 last:border-r-0">
                    <p className={day ? "text-xs font-semibold text-[#4b584d]" : "text-xs text-transparent"}>{day ? day.getDate() : "0"}</p>
                    <div className="mt-2 grid gap-1">
                      {dayMeetings.slice(0, 3).map((meeting) => (
                        <button
                          type="button"
                          key={meeting.id}
                          onClick={() => selectMeeting(meeting)}
                          className="truncate rounded-lg bg-[#eef3ec] px-2 py-1 text-left text-[10px] font-medium text-[#506545] hover:bg-[#d3e8dc]"
                        >
                          {meeting.title}
                        </button>
                      ))}
                      {dayMeetings.length > 3 && <span className="text-[10px] text-[var(--muted)]">+{dayMeetings.length - 3} lagi</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="calendar" title="Belum ada meeting" description="Catat meeting pertama Anda." />
        ) : (
          <div className="mt-5 grid gap-3">
            {filtered.map((meeting) => (
              <button
                type="button"
                key={meeting.id}
                onClick={() => selectMeeting(meeting)}
                className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-white p-4 text-left transition-colors hover:border-[#d2e3da] hover:bg-[#fbfcfa]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge tone={statusTone[meeting.status]} dot>{statusLabel[meeting.status]}</Badge>
                    <span className="text-xs text-[var(--muted)]">{formatDate(meeting.meetingAt)}</span>
                  </div>
                  <h3 className="mt-1 truncate font-semibold text-[#334035]">{meeting.title}</h3>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">{meeting.client.businessName} · {meeting.program.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[var(--muted)]">{meeting.actionItems.length} action</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Catat Konsultasi Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#283529]/30 p-4 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl sm:p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">Meeting baru</p>
                <h2 className="mt-1 text-xl font-semibold text-[#334035]">Catat konsultasi</h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Tutup"
                className="grid h-8 w-8 place-items-center rounded-lg text-lg text-[var(--muted)] hover:bg-[var(--line)] hover:text-[var(--ink)]"
              >
                ×
              </button>
            </div>
            <form className="mt-6 grid gap-4" onSubmit={submit}>
              <FormField label="Judul meeting">
                <input name="title" className={inputClass} required placeholder="Review progres minggu kedua" />
              </FormField>
              <FormField label="Program">
                <select name="programId" className={inputClass} required defaultValue="">
                  <option value="" disabled>Pilih program</option>
                  {programs
                    .filter((item) => !["COMPLETED", "CANCELLED"].includes(item.status))
                    .map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.client.businessName} · {program.name}
                      </option>
                    ))}
                </select>
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Waktu">
                  <input name="meetingAt" type="datetime-local" className={inputClass} required />
                </FormField>
                <FormField label="Peserta">
                  <input name="participants" className={inputClass} placeholder="Nama internal / client" />
                </FormField>
              </div>
              <FormField label="Agenda / konteks">
                <TiptapEditor
                  content={newSummaryJson}
                  placeholder="Tulis agenda, konteks meeting... Gunakan toolbar di atas untuk tebal, miring, garis bawah, poin, nomor, judul, to-do, dll."
                  onChange={(json, text) => {
                    setNewSummaryJson(json);
                    setNewSummaryText(text);
                  }}
                  minHeight="min-h-[140px]"
                />
              </FormField>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeForm} className="button button-quiet">
                  Batal
                </button>
                <button className="button button-primary">Simpan draft</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Meeting Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#283529]/30 p-4" role="dialog" aria-modal="true">
          <div className="mx-auto my-8 w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <Badge tone={statusTone[selected.status]} dot>{statusLabel[selected.status]}</Badge>
                <h2 className="mt-3 text-xl font-semibold text-[#334035]">{selected.title}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{selected.client.businessName} · {selected.program.name}</p>
                <p className="text-xs text-[var(--muted)]">{formatDate(selected.meetingAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (hasUnsavedRef.current) {
                    if (window.confirm("Ada perubahan belum tersimpan. Tutup?")) {
                      setSelected(null);
                      hasUnsavedRef.current = false;
                    }
                  } else setSelected(null);
                }}
                aria-label="Tutup"
                className="grid h-8 w-8 place-items-center rounded-lg text-lg text-[var(--muted)] hover:bg-[var(--line)] hover:text-[var(--ink)]"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="eyebrow">Agenda / konteks</span>
                  {saveStatus === "saving" && <span className="text-xs text-[var(--muted)]">Menyimpan...</span>}
                  {saveStatus === "saved" && <span className="text-xs text-[#506545]">Tersimpan</span>}
                  {saveStatus === "error" && (
                    <button
                      type="button"
                      onClick={() => doSave(selected.id, editSummaryJson, editSummaryText, editDecisionsJson, editDecisionsText)}
                      className="text-xs text-[#bf6d4e] hover:underline"
                    >
                      Gagal menyimpan — coba lagi
                    </button>
                  )}
                </div>
                <TiptapEditor
                  key={`summary-${selected.id}`}
                  content={editSummaryJson}
                  placeholder="Tulis agenda... gunakan toolbar untuk tebal, miring, garis bawah, nomor, poin, dll."
                  onChange={onSummaryChange}
                  onBlur={onSummaryBlur}
                  minHeight="min-h-[140px]"
                />
              </div>
              <div>
                <span className="eyebrow mb-2 block">Keputusan</span>
                <TiptapEditor
                  key={`decisions-${selected.id}`}
                  content={editDecisionsJson}
                  placeholder="Tulis keputusan meeting..."
                  onChange={onDecisionsChange}
                  onBlur={onDecisionsBlur}
                  minHeight="min-h-[120px]"
                />
              </div>
            </div>

            {selected.actionItems.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Tindak lanjut</p>
                <ul className="mt-2 grid gap-2">
                  {selected.actionItems.map((item) => (
                    <li key={item.id} className="flex items-start gap-2 text-sm text-[#4b584d]">
                      <Icon name="check" size={14} />
                      <span>
                        {item.description}
                        {item.taskId && <span className="ml-1 text-xs text-[var(--muted)]">(sudah jadi task)</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (hasUnsavedRef.current) {
                    if (window.confirm("Ada perubahan belum tersimpan. Tutup?")) {
                      setSelected(null);
                      hasUnsavedRef.current = false;
                    }
                  } else setSelected(null);
                }}
                className="button button-quiet"
              >
                Tutup
              </button>
              {selected.status === "DRAFT" && (
                <button type="button" onClick={() => void finalize()} className="button button-primary">
                  Finalkan meeting
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-[#334035] px-4 py-3 text-sm font-medium text-white shadow-lg" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
