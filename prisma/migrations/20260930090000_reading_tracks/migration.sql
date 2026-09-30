-- Reading sheets become multi-track: a `track` column tells System Design rows apart from
-- JavaScript rows, `kind` becomes free text so each track can define its own kinds, and
-- `lastDay` flags the night-before-interview short list.

-- AlterTable
ALTER TABLE "SdPart" ADD COLUMN "track" TEXT NOT NULL DEFAULT 'system-design';

-- AlterTable
ALTER TABLE "SdGroup" ADD COLUMN "track" TEXT NOT NULL DEFAULT 'system-design';

-- AlterTable: keep every existing kind value, just widen the type.
ALTER TABLE "SdArticle" ADD COLUMN "lastDay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "track" TEXT NOT NULL DEFAULT 'system-design';
ALTER TABLE "SdArticle" ALTER COLUMN "kind" TYPE TEXT USING "kind"::text;

-- DropEnum
DROP TYPE "SdKind";

-- CreateIndex
CREATE INDEX "SdPart_track_idx" ON "SdPart"("track");

-- CreateIndex
CREATE INDEX "SdGroup_track_idx" ON "SdGroup"("track");

-- CreateIndex
CREATE INDEX "SdArticle_track_idx" ON "SdArticle"("track");
