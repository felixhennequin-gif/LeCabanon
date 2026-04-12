-- DropForeignKey
ALTER TABLE "EquipmentPhoto" DROP CONSTRAINT "EquipmentPhoto_equipmentId_fkey";

-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "ReviewMedia" DROP COLUMN "createdAt";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "bio";

-- DropTable
DROP TABLE "EquipmentPhoto";
