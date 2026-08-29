-- AlterTable
ALTER TABLE "User" ADD COLUMN "email" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;

UPDATE "User"
SET "email" = lower("id") || '@migrated.jib.local'
WHERE "email" IS NULL;

ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;

DROP INDEX "User_phone_key";
ALTER TABLE "User" DROP COLUMN "phone";

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

DROP TABLE "OtpChallenge";
