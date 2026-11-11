
import {
    Injectable,
    NotFoundException
} from "@nestjs/common";

import {
    DependencyType,
    SymbolKind
} from "../generated/prisma/client.js";

import { PrismaService } from "../prisma.service.js";

import {
    createRiskAssessment
} from "./risk-assessment.js";

interface ImpactNode {
    symbolId: string;
    name: string;
    qualifiedName: string | null;
    kind: SymbolKind;
    filePath: string;
    startLine: number;
    endLine: number;
    depth: number;
    dependencyType: DependencyType;
}

interface ChangedSymbol {
    id: string;
    name: string;
    qualifiedName: string | null;
    kind: SymbolKind;
    filePath: string;
}

interface ImpactAnalysisResult {
    analysisRunId: string;
    changedSymbol: ChangedSymbol;
    totalImpactedSymbols: number;
    directImpactCount: number;
    indirectImpactCount: number;
    maxDepth: number;
    riskScore: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    affectedFiles: number;
    affectedKinds: Partial<Record<SymbolKind, number>>;
    summary: string;
    impacts: ImpactNode[];
}

@Injectable()
export class ImpactService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    async analyzeImpact(
        projectId: string,
        analysisRunId: string,
        symbolId: string
    ): Promise<ImpactAnalysisResult> {
        const analysisRun =
            await this.prisma.analysisRun.findFirst({
                where: {
                    id: analysisRunId,
                    projectId
                }
            });

        if (!analysisRun) {
            throw new NotFoundException(
                "Analysis run not found."
            );
        }

        const changedSymbol =
            await this.prisma.codeSymbol.findFirst({
                where: {
                    id: symbolId,
                    analysisRunId
                },
                include: {
                    sourceFile: true
                }
            });

        if (!changedSymbol) {
            throw new NotFoundException(
                "Symbol not found in this analysis."
            );
        }

        const dependencies =
            await this.prisma.dependency.findMany({
                where: {
                    analysisRunId
                },
                include: {
                    sourceSymbol: {
                        include: {
                            sourceFile: true
                        }
                    },
                    targetSymbol: {
                        include: {
                            sourceFile: true
                        }
                    }
                }
            });

        const incomingDependencies = new Map<
            string,
            typeof dependencies
        >();

        const symbolsById = new Map<
            string,
            (typeof dependencies)[number]["sourceSymbol"]
        >();

        for (const dependency of dependencies) {
            symbolsById.set(
                dependency.sourceSymbol.id,
                dependency.sourceSymbol
            );

            symbolsById.set(
                dependency.targetSymbol.id,
                dependency.targetSymbol
            );

            const targetId =
                dependency.targetSymbolId;

            const existing =
                incomingDependencies.get(targetId) ?? [];

            existing.push(dependency);

            incomingDependencies.set(
                targetId,
                existing
            );
        }

        const visited = new Map<string, ImpactNode>();

        const queue: Array<{
            symbolId: string;
            depth: number;
            dependencyType: DependencyType;
        }> = [];

        const directDependencies =
            incomingDependencies.get(symbolId) ?? [];

        for (const dependency of directDependencies) {
            queue.push({
                symbolId: dependency.sourceSymbolId,
                depth: 1,
                dependencyType: dependency.type
            });
        }

        let queueIndex = 0;

        while (queueIndex < queue.length) {
            const current = queue[queueIndex++];

            const existing = visited.get(
                current.symbolId
            );

            if (
                existing &&
                existing.depth <= current.depth
            ) {
                continue;
            }

            const symbol = symbolsById.get(
                current.symbolId
            );

            if (!symbol) {
                continue;
            }

            visited.set(current.symbolId, {
                symbolId: symbol.id,
                name: symbol.name,
                qualifiedName: symbol.qualifiedName,
                kind: symbol.kind,
                filePath: symbol.sourceFile.path,
                startLine: symbol.startLine,
                endLine: symbol.endLine,
                depth: current.depth,
                dependencyType: current.dependencyType
            });

            const nextDependencies =
                incomingDependencies.get(
                    current.symbolId
                ) ?? [];

            for (const dependency of nextDependencies) {
                queue.push({
                    symbolId: dependency.sourceSymbolId,
                    depth: current.depth + 1,
                    dependencyType: dependency.type
                });
            }
        }

        const impacts = Array.from(
            visited.values()
        ).sort((a, b) =>
            a.depth - b.depth ||
            a.filePath.localeCompare(b.filePath) ||
            a.startLine - b.startLine
        );

        const directImpactCount = impacts.filter(
            impact => impact.depth === 1
        ).length;

        const indirectImpactCount =
            impacts.length - directImpactCount;

        const maxDepth = impacts.reduce(
            (max, impact) =>
                Math.max(max, impact.depth),
            0
        );

        const riskAssessment = createRiskAssessment(
            impacts.map(impact => ({
                kind: impact.kind,
                dependencyType: impact.dependencyType
            })),
            impacts.map(impact => impact.filePath),
            maxDepth
        );

        return {
            analysisRunId,
            changedSymbol: {
                id: changedSymbol.id,
                name: changedSymbol.name,
                qualifiedName:
                    changedSymbol.qualifiedName,
                kind: changedSymbol.kind,
                filePath: changedSymbol.sourceFile.path
            },
            totalImpactedSymbols: impacts.length,
            directImpactCount,
            indirectImpactCount,
            maxDepth,
            ...riskAssessment,
            impacts
        };
    }
}
