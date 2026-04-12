-- Restore columns that were erroneously dropped in 20260411100000_fix_schema_drift.
-- Both fields exist in schema.prisma and are used by the application code.

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT;

-- AlterTable
ALTER TABLE "ReviewMedia" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
