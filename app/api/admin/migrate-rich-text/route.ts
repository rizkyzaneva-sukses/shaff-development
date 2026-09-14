import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";

function textToTiptapDoc(text: string | null): { doc: Record<string, unknown>; plainText: string } | null {
  if (!text || !text.trim()) return null;
  const lines = text.split("\n");
  const content: Record<string, unknown>[] = [];
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) continue;
    if (line.startsWith("- ")) { content.push({ type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: line.slice(2) }] }] }] }); continue; }
    const orderedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (orderedMatch) { content.push({ type: "orderedList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: orderedMatch[2] }] }] }] }); continue; }
    if (line.startsWith("### ")) { content.push({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: line.slice(4) }] }); continue; }
    if (line.startsWith("## ")) { content.push({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: line.slice(3) }] }); continue; }
    const taskMatch = line.match(/^\[([ x])\]\s+(.*)/);
    if (taskMatch) { content.push({ type: "taskList", content: [{ type: "taskItem", attrs: { checked: taskMatch[1] === "x" }, content: [{ type: "paragraph", content: [{ type: "text", text: taskMatch[2] }] }] }] }); continue; }
    content.push({ type: "paragraph", content: [{ type: "text", text: line }] });
  }
  if (content.length === 0) return null;
  return { doc: { type: "doc", content }, plainText: text.trim() };
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireUser(["ADMIN"]);
    const meetings = await prisma.meetingNote.findMany({
      where: { OR: [{ summaryJson: { equals: Prisma.DbNull }, summary: { not: null } }, { decisionsJson: { equals: Prisma.DbNull }, decisions: { not: null } }] },
      select: { id: true, summary: true, decisions: true },
    });

    let migrated = 0;
    for (const meeting of meetings) {
      const updates: Record<string, unknown> = {};
      if (meeting.summary) { const r = textToTiptapDoc(meeting.summary); if (r) { updates.summaryJson = r.doc; updates.summaryText = r.plainText; } }
      if (meeting.decisions) { const r = textToTiptapDoc(meeting.decisions); if (r) { updates.decisionsJson = r.doc; updates.decisionsText = r.plainText; } }
      if (Object.keys(updates).length > 0) { await prisma.meetingNote.update({ where: { id: meeting.id }, data: updates as any }); migrated++; }
    }

    return Response.json({ total: meetings.length, migrated });
  } catch (error) { return jsonError(error); }
}
