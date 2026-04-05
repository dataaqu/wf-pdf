-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable: rename email to username
ALTER TABLE "User" RENAME COLUMN "email" TO "username";

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
