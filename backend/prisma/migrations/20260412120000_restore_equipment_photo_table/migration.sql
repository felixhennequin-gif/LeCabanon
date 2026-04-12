-- Restore EquipmentPhoto table that was dropped in 20260411100000_fix_schema_drift.
-- The schema.prisma defines photos as an EquipmentPhoto[] relation, and application code
-- uses Prisma's include for photos — listEquipment was 500-ing because this table was missing.
-- Also drop the legacy Equipment.photos TEXT[] column that conflicts with the relation.

-- CreateTable
CREATE TABLE IF NOT EXISTS "EquipmentPhoto" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "equipmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentPhoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "EquipmentPhoto" ADD CONSTRAINT "EquipmentPhoto_equipmentId_fkey"
        FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Drop legacy text[] column
ALTER TABLE "Equipment" DROP COLUMN IF EXISTS "photos";
