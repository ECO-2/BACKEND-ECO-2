-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('watering', 'fertilizing', 'pruning', 'repotting', 'misting', 'cleaning');

-- CreateTable
CREATE TABLE "UserPlantTask" (
    "id" TEXT NOT NULL,
    "user_plant_id" TEXT NOT NULL,
    "task_type" "TaskType" NOT NULL,
    "next_due_at" TIMESTAMP(3) NOT NULL,
    "last_completed_at" TIMESTAMP(3),
    "frequency_days" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPlantTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareLog" (
    "id" TEXT NOT NULL,
    "user_plant_id" TEXT NOT NULL,
    "task_id" TEXT,
    "task_type" "TaskType" NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserPlantTask" ADD CONSTRAINT "UserPlantTask_user_plant_id_fkey" FOREIGN KEY ("user_plant_id") REFERENCES "UserPlant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareLog" ADD CONSTRAINT "CareLog_user_plant_id_fkey" FOREIGN KEY ("user_plant_id") REFERENCES "UserPlant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareLog" ADD CONSTRAINT "CareLog_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "UserPlantTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
