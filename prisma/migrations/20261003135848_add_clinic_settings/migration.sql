-- CreateTable
CREATE TABLE "public"."ClinicSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'Shiva Dental Clinic',
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "prescriptionFooter" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicSettings_pkey" PRIMARY KEY ("id")
);
