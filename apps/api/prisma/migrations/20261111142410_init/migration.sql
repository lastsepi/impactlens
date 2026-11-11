-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SymbolKind" AS ENUM ('CLASS', 'METHOD', 'FUNCTION', 'INTERFACE', 'ENUM', 'PROPERTY', 'FIELD', 'VARIABLE', 'CONSTRUCTOR', 'MODULE', 'TYPE_ALIAS');

-- CreateEnum
CREATE TYPE "DependencyType" AS ENUM ('CALLS', 'IMPORTS', 'EXTENDS', 'IMPLEMENTS', 'REFERENCES', 'READS', 'WRITES', 'USES');

-- CreateEnum
CREATE TYPE "ImpactLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "repositoryUrl" TEXT,
    "primaryLanguage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceFile" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "path" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "contentHash" TEXT,
    "lastAnalyzedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisRun" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "analyzerVersion" TEXT NOT NULL,
    "filesScanned" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeSymbol" (
    "id" UUID NOT NULL,
    "analysisRunId" UUID NOT NULL,
    "sourceFileId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "qualifiedName" TEXT,
    "kind" "SymbolKind" NOT NULL,
    "startLine" INTEGER NOT NULL,
    "endLine" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeSymbol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dependency" (
    "id" UUID NOT NULL,
    "analysisRunId" UUID NOT NULL,
    "sourceSymbolId" UUID NOT NULL,
    "targetSymbolId" UUID NOT NULL,
    "type" "DependencyType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactResult" (
    "id" UUID NOT NULL,
    "analysisRunId" UUID NOT NULL,
    "changedSymbolId" UUID NOT NULL,
    "affectedSymbolId" UUID NOT NULL,
    "level" "ImpactLevel" NOT NULL,
    "reason" TEXT NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 1,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImpactResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SourceFile_projectId_idx" ON "SourceFile"("projectId");

-- CreateIndex
CREATE INDEX "SourceFile_contentHash_idx" ON "SourceFile"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "SourceFile_projectId_path_key" ON "SourceFile"("projectId", "path");

-- CreateIndex
CREATE INDEX "AnalysisRun_projectId_createdAt_idx" ON "AnalysisRun"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalysisRun_status_idx" ON "AnalysisRun"("status");

-- CreateIndex
CREATE INDEX "CodeSymbol_analysisRunId_sourceFileId_idx" ON "CodeSymbol"("analysisRunId", "sourceFileId");

-- CreateIndex
CREATE INDEX "CodeSymbol_qualifiedName_idx" ON "CodeSymbol"("qualifiedName");

-- CreateIndex
CREATE INDEX "CodeSymbol_kind_idx" ON "CodeSymbol"("kind");

-- CreateIndex
CREATE INDEX "Dependency_analysisRunId_idx" ON "Dependency"("analysisRunId");

-- CreateIndex
CREATE INDEX "Dependency_targetSymbolId_idx" ON "Dependency"("targetSymbolId");

-- CreateIndex
CREATE UNIQUE INDEX "Dependency_analysisRunId_sourceSymbolId_targetSymbolId_type_key" ON "Dependency"("analysisRunId", "sourceSymbolId", "targetSymbolId", "type");

-- CreateIndex
CREATE INDEX "ImpactResult_analysisRunId_level_idx" ON "ImpactResult"("analysisRunId", "level");

-- CreateIndex
CREATE INDEX "ImpactResult_affectedSymbolId_idx" ON "ImpactResult"("affectedSymbolId");

-- CreateIndex
CREATE UNIQUE INDEX "ImpactResult_analysisRunId_changedSymbolId_affectedSymbolId_key" ON "ImpactResult"("analysisRunId", "changedSymbolId", "affectedSymbolId");

-- AddForeignKey
ALTER TABLE "SourceFile" ADD CONSTRAINT "SourceFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisRun" ADD CONSTRAINT "AnalysisRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeSymbol" ADD CONSTRAINT "CodeSymbol_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeSymbol" ADD CONSTRAINT "CodeSymbol_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "SourceFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dependency" ADD CONSTRAINT "Dependency_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dependency" ADD CONSTRAINT "Dependency_sourceSymbolId_fkey" FOREIGN KEY ("sourceSymbolId") REFERENCES "CodeSymbol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dependency" ADD CONSTRAINT "Dependency_targetSymbolId_fkey" FOREIGN KEY ("targetSymbolId") REFERENCES "CodeSymbol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactResult" ADD CONSTRAINT "ImpactResult_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactResult" ADD CONSTRAINT "ImpactResult_changedSymbolId_fkey" FOREIGN KEY ("changedSymbolId") REFERENCES "CodeSymbol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactResult" ADD CONSTRAINT "ImpactResult_affectedSymbolId_fkey" FOREIGN KEY ("affectedSymbolId") REFERENCES "CodeSymbol"("id") ON DELETE CASCADE ON UPDATE CASCADE;
