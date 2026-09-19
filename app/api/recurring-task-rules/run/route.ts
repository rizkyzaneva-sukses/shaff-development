import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { AuthError, assertSameOrigin, jsonError, requireUser } from "@/lib/auth";

/** Constant-time comparison that never throws on length mismatch. */
function secretMatches(provided: string | null, expected: string | undefined) {
  if (!expected || !provided) return false;
  const providedBuffer = Buffer.from(provided, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

function isCronAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const customHeader = request.headers.get("x-cron-secret");
  // Both candidates are always compared so the comparison cost does not reveal which header matched.
  const bearerMatch = secretMatches(bearer, cronSecret);
  const headerMatch = secretMatches(customHeader, cronSecret);
  return bearerMatch || headerMatch;
}

function nextDate(date: Date, frequency: string) {
  const next = new Date(date);
  if (frequency === "DAILY") next.setUTCDate(next.getUTCDate() + 1);
  else if (frequency === "MONTHLY") next.setUTCMonth(next.getUTCMonth() + 1);
  else next.setUTCDate(next.getUTCDate() + 7);
  return next;
}

export async function POST(request: Request) {
  try {
    // Mutating endpoint: enforce same-origin before any auth or data work.
    assertSameOrigin(request);

    const isCronAuth = isCronAuthorized(request);

    // No valid shared secret and no authenticated ADMIN session => reject.
    const user = isCronAuth ? null : await requireUser(["ADMIN"]);
    if (!isCronAuth && !user) throw new AuthError();
    const actorId: string | null = user ? user.id : null;
    if (!isCronAuth && !actorId) throw new AuthError();

    const now = new Date();
    const rules = await prisma.recurringTaskRule.findMany({
      where: { isActive: true, nextDueDate: { lte: now } },
    });
    const created: string[] = [];

    for (const rule of rules) {
      await prisma.$transaction(async (tx) => {
        const claimed = await tx.recurringTaskRule.updateMany({
          where: { id: rule.id, isActive: true, nextDueDate: rule.nextDueDate },
          data: {
            nextDueDate: nextDate(rule.nextDueDate, rule.frequency),
            lastRunAt: now,
            isActive: rule.endDate ? nextDate(rule.nextDueDate, rule.frequency) <= rule.endDate : true,
          },
        });
        if (!claimed.count) return;

        const task = await tx.task.create({
          data: {
            programId: rule.programId,
            assigneeId: rule.assigneeId,
            title: rule.title,
            description: rule.description,
            priority: rule.priority,
            dueDate: rule.nextDueDate,
          },
        });
        created.push(task.id);

        await tx.auditLog.create({
          data: {
            actorId,
            action: "RECURRING_TASK_CREATED",
            objectType: "Task",
            objectId: task.id,
            changes: { ruleId: rule.id },
          },
        });
      });
    }

    return Response.json({ created: created.length, taskIds: created });
  } catch (error) {
    return jsonError(error);
  }
}
