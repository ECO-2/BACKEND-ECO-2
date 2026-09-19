-- CreateTable
CREATE TABLE "MissingSpeciesSuggestion" (
    "id" TEXT NOT NULL,
    "scientific_name" TEXT NOT NULL,
    "common_name" TEXT,
    "times_requested" INTEGER NOT NULL DEFAULT 1,
    "last_requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissingSpeciesSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MissingSpeciesSuggestion_scientific_name_key" ON "MissingSpeciesSuggestion"("scientific_name");
