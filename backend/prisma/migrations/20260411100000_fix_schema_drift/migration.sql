-- DropForeignKey
ALTER TABLE IF EXISTS "EquipmentPhoto" DROP CONSTRAINT IF EXISTS "EquipmentPhoto_equipmentId_fkey";

-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN IF NOT EXISTS "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "ReviewMedia" DROP COLUMN IF EXISTS "createdAt";

-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "bio";

-- DropTable
DROP TABLE IF EXISTS "EquipmentPhoto";
