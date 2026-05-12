-- CreateEnum
CREATE TYPE "WidgetDisplayMode" AS ENUM ('POPUP', 'INLINE', 'SIDEBAR', 'BOTTOM_BAR', 'FLOATING');

-- CreateEnum
CREATE TYPE "WidgetTrigger" AS ENUM ('PAGE_LOAD', 'BUTTON_CLICK', 'FORM_SUBMIT', 'MANUAL', 'SCROLL');

-- CreateEnum
CREATE TYPE "WidgetStatus" AS ENUM ('WIDGET_ACTIVE', 'WIDGET_DRAFT', 'WIDGET_ARCHIVED');

-- CreateTable
CREATE TABLE "ConsentWidgetConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "displayMode" "WidgetDisplayMode" NOT NULL DEFAULT 'POPUP',
    "trigger" "WidgetTrigger" NOT NULL DEFAULT 'MANUAL',
    "position" TEXT NOT NULL DEFAULT 'center',
    "themeColor" TEXT NOT NULL DEFAULT '#10b981',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "textColor" TEXT NOT NULL DEFAULT '#111827',
    "buttonTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "borderRadius" INTEGER NOT NULL DEFAULT 12,
    "fontSize" INTEGER NOT NULL DEFAULT 14,
    "logoUrl" TEXT,
    "heading" TEXT NOT NULL DEFAULT 'We value your privacy',
    "description" TEXT,
    "collectName" BOOLEAN NOT NULL DEFAULT false,
    "collectEmail" BOOLEAN NOT NULL DEFAULT true,
    "collectPhone" BOOLEAN NOT NULL DEFAULT false,
    "requireAllPurposes" BOOLEAN NOT NULL DEFAULT false,
    "showPrivacyLink" BOOLEAN NOT NULL DEFAULT true,
    "privacyPolicyUrl" TEXT,
    "acceptAllText" TEXT NOT NULL DEFAULT 'Accept All',
    "rejectAllText" TEXT NOT NULL DEFAULT 'Reject All',
    "savePrefsText" TEXT NOT NULL DEFAULT 'Save Preferences',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "supportedLanguages" TEXT[],
    "customCss" TEXT,
    "status" "WidgetStatus" NOT NULL DEFAULT 'WIDGET_DRAFT',
    "tenantId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentWidgetConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsentWidgetConfig_applicationId_status_idx" ON "ConsentWidgetConfig"("applicationId", "status");

-- CreateIndex
CREATE INDEX "ConsentWidgetConfig_tenantId_idx" ON "ConsentWidgetConfig"("tenantId");

-- AddForeignKey
ALTER TABLE "ConsentWidgetConfig" ADD CONSTRAINT "ConsentWidgetConfig_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentWidgetConfig" ADD CONSTRAINT "ConsentWidgetConfig_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ConsentTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentWidgetConfig" ADD CONSTRAINT "ConsentWidgetConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
