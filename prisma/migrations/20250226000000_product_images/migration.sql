-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "alt" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- Add imagesLegacy column and migrate data
ALTER TABLE "Product" ADD COLUMN "imagesLegacy" TEXT;
UPDATE "Product" SET "imagesLegacy" = "images";
ALTER TABLE "Product" ALTER COLUMN "imagesLegacy" DROP NOT NULL;

-- Drop old images column
ALTER TABLE "Product" DROP COLUMN "images";

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
