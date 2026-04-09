-- CreateTable: ArtisanCommunity junction table
CREATE TABLE "ArtisanCommunity" (
    "artisanId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtisanCommunity_pkey" PRIMARY KEY ("artisanId","communityId")
);

-- Migrate existing artisan-community relations
INSERT INTO "ArtisanCommunity" ("artisanId", "communityId", "addedById")
SELECT "id", "communityId", "createdById" FROM "Artisan";

-- Add new columns to Artisan
ALTER TABLE "Artisan" ADD COLUMN "description" TEXT;
ALTER TABLE "Artisan" ADD COLUMN "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Artisan" ADD COLUMN "horaires" TEXT;
ALTER TABLE "Artisan" ADD COLUMN "ownPhotos" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Artisan" ADD COLUMN "claimed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Artisan" ADD COLUMN "claimedAt" TIMESTAMP(3);
ALTER TABLE "Artisan" ADD COLUMN "claimToken" TEXT;
ALTER TABLE "Artisan" ADD COLUMN "claimRequestedById" TEXT;
ALTER TABLE "Artisan" ADD COLUMN "ownerId" TEXT;

-- Drop old communityId FK and column
ALTER TABLE "Artisan" DROP CONSTRAINT "Artisan_communityId_fkey";
ALTER TABLE "Artisan" DROP COLUMN "communityId";

-- Make email unique (only non-null values)
CREATE UNIQUE INDEX "Artisan_email_key" ON "Artisan"("email");

-- Make ownerId unique
CREATE UNIQUE INDEX "Artisan_ownerId_key" ON "Artisan"("ownerId");

-- Add FK for ownerId
ALTER TABLE "Artisan" ADD CONSTRAINT "Artisan_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ArtisanCommunity FKs
ALTER TABLE "ArtisanCommunity" ADD CONSTRAINT "ArtisanCommunity_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "Artisan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtisanCommunity" ADD CONSTRAINT "ArtisanCommunity_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtisanCommunity" ADD CONSTRAINT "ArtisanCommunity_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: ReviewReply
CREATE TABLE "ReviewReply" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewId" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "ReviewReply_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ReviewReply" ADD CONSTRAINT "ReviewReply_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewReply" ADD CONSTRAINT "ReviewReply_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "Artisan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewReply" ADD CONSTRAINT "ReviewReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rename Visibility enum value: PRIVATE -> COMMUNITY
ALTER TYPE "Visibility" RENAME VALUE 'PRIVATE' TO 'COMMUNITY';

-- Rename the Artisan relation name from default to ArtisanCreator
-- (no SQL needed, Prisma handles relation names at client level)
