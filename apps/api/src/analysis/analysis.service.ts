
import {
    Injectable,
    Logger,
    NotFoundException
} from "@nestjs/common";

import { PrismaService } from "../prisma.service.js";
import { StorageService } from "../storage/storage.service.js";

import { SymbolExtractorService } from "../analyzer/symbol-extractor.service.js";
import { DependencyExtractorService } from "../analyzer/dependency-extractor.service.js";

import {
    DependencySourceFile
} from "../analyzer/analyzer.types.js";

@Injectable()
export class AnalysisService {
    private readonly logger = new Logger(AnalysisService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        private readonly symbolExtractor: SymbolExtractorService,
        private readonly dependencyExtractor: DependencyExtractorService
    ) {}

    async analyzeProject(projectId: string) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            throw new NotFoundException("Project not found.");
        }

        const analysisRun = await this.prisma.analysisRun.create({
            data: {
                projectId,
                analyzerVersion: "0.2.0",
                status: "PENDING"
            }
        });

        const startedRun = await this.prisma.analysisRun.update({
            where: {
                id: analysisRun.id
            },
            data: {
                status: "RUNNING",
                startedAt: new Date()
            }
        });

        try {
            const sourceFiles = await this.prisma.sourceFile.findMany({
                where: {
                    projectId,
                    storageKey: {
                        not: null
                    }
                },
                orderBy: {
                    path: "asc"
                }
            });

            let filesScanned = 0;

            const dependencyFiles: DependencySourceFile[] = [];

            this.logger.log(
                `Starting analysis of project: ${project.name}`
            );

            this.logger.log(
                `Found ${sourceFiles.length} source files.`
            );

            // Phase 1: Extract and persist symbols.
            for (const sourceFile of sourceFiles) {
                if (!sourceFile.storageKey) {
                    continue;
                }

                try {
                    const fileBuffer = await this.storage.read(
                        projectId,
                        sourceFile.storageKey
                    );

                    const sourceCode = fileBuffer.toString("utf-8");

                    dependencyFiles.push({
                        path: sourceFile.path,
                        sourceCode
                    });

                    const extractionResult = this.symbolExtractor.extract(
                        sourceCode,
                        sourceFile.path
                    );

                    this.logger.log(
                        `Analyzing: ${sourceFile.path}`
                    );

                    this.logger.log(
                        `Symbols found: ${extractionResult.symbols.length}`
                    );

                    if (extractionResult.errors.length > 0) {
                        this.logger.warn(
                            `Analyzer errors in ${sourceFile.path}: ${extractionResult.errors.join("; ")}`
                        );
                    }

                    if (extractionResult.symbols.length > 0) {
                        await this.prisma.codeSymbol.createMany({
                            data: extractionResult.symbols.map(symbol => ({
                                analysisRunId: startedRun.id,
                                sourceFileId: sourceFile.id,
                                name: symbol.name,
                                qualifiedName: symbol.qualifiedName,
                                kind: symbol.kind,
                                startLine: symbol.startLine,
                                endLine: symbol.endLine
                            }))
                        });
                    }

                    await this.prisma.sourceFile.update({
                        where: {
                            id: sourceFile.id
                        },
                        data: {
                            lastAnalyzedAt: new Date()
                        }
                    });

                    filesScanned++;
                } catch (error) {
                    const message = error instanceof Error
                        ? error.message
                        : "Unknown error";

                    this.logger.error(
                        `Failed to analyze ${sourceFile.path}: ${message}`
                    );

                    throw error;
                }
            }

            // Phase 2: Load persisted symbols with their file paths.
            const storedSymbols = await this.prisma.codeSymbol.findMany({
                where: {
                    analysisRunId: startedRun.id
                },
                include: {
                    sourceFile: {
                        select: {
                            path: true
                        }
                    }
                }
            });

            this.logger.log(
                `Loaded ${storedSymbols.length} symbols for dependency analysis.`
            );

            // Phase 3: Extract dependencies.
            const dependencies = this.dependencyExtractor.extract(
                dependencyFiles,
                storedSymbols
            );

            this.logger.log(
                `Dependencies found: ${dependencies.length}`
            );

            // Phase 4: Persist dependencies.
            if (dependencies.length > 0) {
                await this.prisma.dependency.createMany({
                    data: dependencies.map(dependency => ({
                        analysisRunId: startedRun.id,
                        sourceSymbolId: dependency.sourceSymbolId,
                        targetSymbolId: dependency.targetSymbolId,
                        type: dependency.type
                    })),
                    skipDuplicates: true
                });
            }

            // Phase 5: Complete analysis run.
            const completedRun = await this.prisma.analysisRun.update({
                where: {
                    id: startedRun.id
                },
                data: {
                    status: "COMPLETED",
                    filesScanned,
                    finishedAt: new Date()
                }
            });

            this.logger.log(
                `Analysis completed. Files scanned: ${filesScanned}, dependencies: ${dependencies.length}`
            );

            return {
                ...completedRun,
                symbolsFound: storedSymbols.length,
                dependenciesFound: dependencies.length
            };
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Unknown analysis error";

            await this.prisma.analysisRun.update({
                where: {
                    id: startedRun.id
                },
                data: {
                    status: "FAILED",
                    errorMessage: message,
                    finishedAt: new Date()
                }
            });

            this.logger.error(
                `Analysis failed: ${message}`
            );

            throw error;
        }
    }

    async getAnalysisSymbols(
        projectId: string,
        analysisRunId: string
    ) {
        const analysisRun = await this.prisma.analysisRun.findFirst({
            where: {
                id: analysisRunId,
                projectId
            }
        });

        if (!analysisRun) {
            throw new NotFoundException("Analysis run not found.");
        }

        const symbols = await this.prisma.codeSymbol.findMany({
            where: {
                analysisRunId
            },
            orderBy: [
                { sourceFileId: "asc" },
                { startLine: "asc" }
            ],
            include: {
                sourceFile: {
                    select: {
                        path: true,
                        language: true
                    }
                }
            }
        });

        return {
            analysisRunId,
            totalSymbols: symbols.length,
            symbols
        };
    }

async getAnalysisRuns(projectId: string) {
    const project = await this.prisma.project.findUnique({
        where: {
            id: projectId
        }
    });

    if (!project) {
        throw new NotFoundException("Project not found.");
    }

    const runs = await this.prisma.analysisRun.findMany({
        where: {
            projectId
        },
        orderBy: {
            createdAt: "desc"
        },
        select: {
            id: true,
            status: true,
            analyzerVersion: true,
            filesScanned: true,
            startedAt: true,
            finishedAt: true,
            createdAt: true,
            errorMessage: true
        }
    });

    return {
        total: runs.length,
        runs
    };
}

}
