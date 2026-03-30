-- CreateIndex
CREATE INDEX "AuditLog_tenantId_category_idx" ON "AuditLog"("tenantId", "category");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "ConsentRecord_status_idx" ON "ConsentRecord"("status");

-- CreateIndex
CREATE INDEX "ConsentRecord_applicationId_status_idx" ON "ConsentRecord"("applicationId", "status");

-- CreateIndex
CREATE INDEX "ConsentRecord_grantedAt_idx" ON "ConsentRecord"("grantedAt");

-- CreateIndex
CREATE INDEX "RightsRequest_tenantId_status_idx" ON "RightsRequest"("tenantId", "status");

-- CreateIndex
CREATE INDEX "RightsRequest_dueDate_idx" ON "RightsRequest"("dueDate");

-- CreateIndex
CREATE INDEX "RightsRequest_assignedTo_idx" ON "RightsRequest"("assignedTo");

-- CreateIndex
CREATE INDEX "Session_userId_isCurrentSession_idx" ON "Session"("userId", "isCurrentSession");

-- CreateIndex
CREATE INDEX "Session_lastActivity_idx" ON "Session"("lastActivity");
