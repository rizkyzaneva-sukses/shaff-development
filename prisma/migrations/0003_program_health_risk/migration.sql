-- Add lightweight operational health tracking for program reviews.
CREATE TYPE "ProgramRisk" AS ENUM ('HEALTHY', 'ATTENTION', 'CRITICAL');

ALTER TABLE "Program"
  ADD COLUMN "healthScore" INTEGER,
  ADD COLUMN "risk" "ProgramRisk" NOT NULL DEFAULT 'HEALTHY',
  ADD COLUMN "riskNote" TEXT;

ALTER TABLE "Program"
  ADD CONSTRAINT "Program_healthScore_check" CHECK ("healthScore" IS NULL OR ("healthScore" >= 0 AND "healthScore" <= 100));
