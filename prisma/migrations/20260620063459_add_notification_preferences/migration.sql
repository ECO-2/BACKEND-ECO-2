-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reminder_end_hour" INTEGER NOT NULL DEFAULT 21,
ADD COLUMN     "reminder_start_hour" INTEGER NOT NULL DEFAULT 8;
