-- CreateEnum
CREATE TYPE "SdKind" AS ENUM ('FOUNDATION', 'LLD', 'HLD', 'HLD_CASE', 'LLD_CASE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "SdImportance" AS ENUM ('MUST', 'CORE', 'EXTRA');

-- CreateTable
CREATE TABLE "SdPart" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,

    CONSTRAINT "SdPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SdGroup" (
    "id" INTEGER NOT NULL,
    "partId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "SdGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SdArticle" (
    "id" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" "SdKind" NOT NULL,
    "importance" "SdImportance" NOT NULL,
    "summary" TEXT,
    "links" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "SdArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SdUserArticle" (
    "userId" TEXT NOT NULL,
    "articleId" INTEGER NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "lastReadAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SdUserArticle_pkey" PRIMARY KEY ("userId","articleId")
);

-- CreateIndex
CREATE INDEX "SdGroup_partId_idx" ON "SdGroup"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "SdArticle_slug_key" ON "SdArticle"("slug");

-- CreateIndex
CREATE INDEX "SdArticle_groupId_idx" ON "SdArticle"("groupId");

-- CreateIndex
CREATE INDEX "SdUserArticle_userId_done_idx" ON "SdUserArticle"("userId", "done");

-- CreateIndex
CREATE INDEX "SdUserArticle_userId_starred_idx" ON "SdUserArticle"("userId", "starred");

-- AddForeignKey
ALTER TABLE "SdGroup" ADD CONSTRAINT "SdGroup_partId_fkey" FOREIGN KEY ("partId") REFERENCES "SdPart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SdArticle" ADD CONSTRAINT "SdArticle_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SdGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SdUserArticle" ADD CONSTRAINT "SdUserArticle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SdUserArticle" ADD CONSTRAINT "SdUserArticle_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "SdArticle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

