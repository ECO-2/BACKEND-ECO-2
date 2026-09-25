-- CreateTable
CREATE TABLE "CO2Reading" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "co2Ppm" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CO2Reading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CO2Reading_userId_recordedAt_idx" ON "CO2Reading"("userId", "recordedAt");

-- AddForeignKey
ALTER TABLE "CO2Reading" ADD CONSTRAINT "CO2Reading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;