-- CreateTable: CompanyEmailConfig
-- Each company can configure their own SMTP email provider
-- Password is AES-256 encrypted at application level

CREATE TABLE "CompanyEmailConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'system',
    "smtpHost" TEXT,
    "smtpPort" INTEGER DEFAULT 587,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT false,
    "smtpUser" TEXT,
    "smtpPass" TEXT,
    "fromName" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastTestedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyEmailConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique per company
CREATE UNIQUE INDEX "CompanyEmailConfig_companyId_key" ON "CompanyEmailConfig"("companyId");

-- AddForeignKey
ALTER TABLE "CompanyEmailConfig" ADD CONSTRAINT "CompanyEmailConfig_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
