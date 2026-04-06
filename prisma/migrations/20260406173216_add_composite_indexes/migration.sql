-- CreateIndex
CREATE INDEX "PdfHistory_userId_createdAt_idx" ON "PdfHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PdfHistory_type_createdAt_idx" ON "PdfHistory"("type", "createdAt");
