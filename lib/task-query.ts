import type { Prisma } from "@prisma/client";

// Keep mutation responses in the same shape as the task board and detail reads.
export const taskBoardInclude = {
  program: {
    select: {
      id: true,
      name: true,
      client: { select: { id: true, businessName: true } },
    },
  },
  assignee: { select: { id: true, name: true, role: true } },
  checklist: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.TaskInclude;

export const taskDetailInclude = {
  ...taskBoardInclude,
  comments: {
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.TaskInclude;
