import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";

function nextDate(date: Date, frequency: string) {
  const next = new Date(date);
  if (frequency === "DAILY") next.setUTCDate(next.getUTCDate() + 1);
  else if (frequency === "MONTHLY") next.setUTCMonth(next.getUTCMonth() + 1);
  else next.setUTCDate(next.getUTCDate() + 7);
  return next;
}

export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    const customHeader = request.headers.get("x-cron-secret");
    const isCronAuth =
      Boolean(cronSecret) &&
      (customHeader === cronSecret || authHeader === `Bearer ${cronSecret}`);

    let actorId = "system-cron";

    if (!isCronAuth) {
      assertSameOrigin(request);
      const user = await requireUser(["ADMIN"]);
      actorId = user.id;
    }

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
