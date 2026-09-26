/*
  Warnings:

  - You are about to drop the `CO2Reading` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CO2Reading" DROP CONSTRAINT "CO2Reading_userId_fkey";

-- DropTable
DROP TABLE "CO2Reading";

-- CreateTable
CREATE TABLE "Co2Reading" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "co2_ppm" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Co2Reading_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Co2Reading" ADD CONSTRAINT "Co2Reading_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
