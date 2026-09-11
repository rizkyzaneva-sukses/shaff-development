/**
 * Migrasi: konversi kolom summary/decisions (teks polos) ke summaryJson/decisionsJson (Tiptap JSON).
 * Idempotent: skip baris yang summaryJson-nya sudah terisi.
 *
 * Jalankan: npx tsx prisma/migrate-meeting-rich-text.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function textToTiptapDoc(text: string | null): { doc: Record<string, unknown>; plainText: string } | null {
  if (!text || !text.trim()) return null;
  const lines = text.split("\n");
  const content: Record<string, unknown>[] = [];

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) continue;

    // Bullet list: "- " prefix
    if (line.startsWith("- ")) {
      content.push({
        type: "bulletList",
        content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: line.slice(2) }] }] }],
      });
      continue;
    }

    // Ordered list: "1. ", "2. ", etc.
    const orderedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (orderedMatch) {
      content.push({
        type: "orderedList",
        content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: orderedMatch[2] }] }] }],
      });
      continue;
    }

    // Heading: "## " or "### "
    if (line.startsWith("### ")) {
      content.push({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: line.slice(4) }] });
      continue;
    }
    if (line.startsWith("## ")) {
      content.push({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: line.slice(3) }] });
      continue;
    }

    // Task list: "[ ] " or "[x] "
    const taskMatch = line.match(/^\[([ x])\]\s+(.*)/);
    if (taskMatch) {
      content.push({
        type: "taskList",
        content: [{
          type: "taskItem",
          attrs: { checked: taskMatch[1] === "x" },
          content: [{ type: "paragraph", content: [{ type: "text", text: taskMatch[2] }] }],
        }],
      });
      continue;
    }

    // Regular paragraph
    content.push({ type: "paragraph", content: [{ type: "text", text: line }] });
  }

  if (content.length === 0) return null;

  return {
    doc: { type: "doc", content },
    plainText: text.trim(),
  };
}

async function main() {
  console.log("Mencari MeetingNote yang perlu dimigrasi...");

  const meetings = await prisma.meetingNote.findMany({
    where: {
      OR: [
        { summaryJson: null, summary: { not: null } },
        { decisionsJson: null, decisions: { not: null } },
      ],
    },
    select: { id: true, summary: true, decisions: true, summaryJson: true, decisionsJson: true },
  });

  console.log(`Ditemukan ${meetings.length} meeting untuk dimigrasi.`);

  let migrated = 0;
  let skipped = 0;

  for (const meeting of meetings) {
    const updates: Record<string, unknown> = {};

    if (!meeting.summaryJson && meeting.summary) {
      const result = textToTiptapDoc(meeting.summary);
      if (result) {
        updates.summaryJson = result.doc;
        updates.summaryText = result.plainText;
      }
    }

    if (!meeting.decisionsJson && meeting.decisions) {
      const result = textToTiptapDoc(meeting.decisions);
      if (result) {
        updates.decisionsJson = result.doc;
        updates.decisionsText = result.plainText;
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.meetingNote.update({ where: { id: meeting.id }, data: updates });
      migrated++;
      console.log(`  ✓ ${meeting.id}`);
    } else {
      skipped++;
    }
  }

  console.log(`\nSelesai: ${migrated} dimigrasi, ${skipped} dilewati.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
