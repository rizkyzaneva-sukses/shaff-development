CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "Document"
  ADD COLUMN "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "reviewedById" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewNote" TEXT;

ALTER TABLE "Invoice"
  ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "approvedById" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3);

UPDATE "Invoice" SET "approvalStatus" = 'APPROVED' WHERE "status" = 'ISSUED';

CREATE TABLE "ProgramTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "serviceType" "ServiceType" NOT NULL,
  "objective" TEXT NOT NULL,
  "deliverables" TEXT,
  "defaultTasks" JSONB NOT NULL,
  "createdById" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProgramTemplate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProgramTemplate_isActive_createdAt_idx" ON "ProgramTemplate"("isActive", "createdAt");
ALTER TABLE "ProgramTemplate" ADD CONSTRAINT "ProgramTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "RecurringTaskRule" (
  "id" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "assigneeId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
  "frequency" TEXT NOT NULL,
  "nextDueDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastRunAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecurringTaskRule_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RecurringTaskRule_isActive_nextDueDate_idx" ON "RecurringTaskRule"("isActive", "nextDueDate");
CREATE INDEX "RecurringTaskRule_programId_idx" ON "RecurringTaskRule"("programId");
ALTER TABLE "RecurringTaskRule" ADD CONSTRAINT "RecurringTaskRule_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecurringTaskRule" ADD CONSTRAINT "RecurringTaskRule_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Document" ADD CONSTRAINT "Document_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
