-- Backfill null fromName values before applying NOT NULL constraint
UPDATE "ticket" SET "fromName" = 'Unknown' WHERE "fromName" IS NULL;

-- AlterTable
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "fromName" SET NOT NULL,
ADD CONSTRAINT "ticket_pkey" PRIMARY KEY ("id");
