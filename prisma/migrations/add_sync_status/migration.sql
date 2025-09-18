-- CreateTable
CREATE TABLE "sync_status" (
    "id" SERIAL NOT NULL,
    "last_successful_sync" TIMESTAMP(3),
    "last_attempted_sync" TIMESTAMP(3),
    "is_healthy" BOOLEAN NOT NULL DEFAULT false,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_status_pkey" PRIMARY KEY ("id")
);