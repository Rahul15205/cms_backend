-- AlterTable
ALTER TABLE "CookieBanner" ADD COLUMN     "backdropBlur" INTEGER DEFAULT 0,
ADD COLUMN     "backdropOpacity" INTEGER DEFAULT 50,
ADD COLUMN     "backgroundColor" TEXT DEFAULT '#ffffff',
ADD COLUMN     "borderRadius" INTEGER DEFAULT 12,
ADD COLUMN     "buttonTextColor" TEXT DEFAULT '#ffffff',
ADD COLUMN     "fontSize" INTEGER DEFAULT 14,
ADD COLUMN     "maxWidth" INTEGER DEFAULT 1200,
ADD COLUMN     "padding" INTEGER DEFAULT 24,
ADD COLUMN     "textColor" TEXT DEFAULT '#111827';
