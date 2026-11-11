
import {
    Injectable,
    NotFoundException
} from "@nestjs/common";

import { PrismaService } from "../prisma.service.js";

import {
    DependencyGraph,
    GraphEdge,
    GraphFilters,
    GraphNode
} from "./graph.types.js";

@Injectable()
export class GraphService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    async getDependencyGraph(
        projectId: string,
        analysisRunId: string,
        filters: GraphFilters = {}
    ): Promise<DependencyGraph> {
        const analysisRun =
            await this.prisma.analysisRun.findFirst({
                where: {
                    id: analysisRunId,
                    projectId
                },
                select: {
                    id: true
                }
            });

        if (!analysisRun) {
            throw new NotFoundException(
                "Analysis run not found."
            );
        }

        const symbols =
            await this.prisma.codeSymbol.findMany({
                where: {
                    analysisRunId
                },
                include: {
                    sourceFile: {
                        select: {
                            path: true
                        }
                    }
                }
            });

        const dependencies =
            await this.prisma.dependency.findMany({
                where: {
                    analysisRunId
                },
                select: {
                    id: true,
                    sourceSymbolId: true,
                    targetSymbolId: true,
                    type: true
                }
            });

        const normalizedSearch =
            filters.search?.trim().toLowerCase();

        const nodes: GraphNode[] = symbols
            .map((symbol) => ({
                id: symbol.id,
                name: symbol.name,
                qualifiedName: symbol.qualifiedName,
                kind: symbol.kind,
                filePath: symbol.sourceFile.path,
                startLine: symbol.startLine,
                endLine: symbol.endLine
            }))
            .filter((node) => {
                if (
                    filters.kind &&
                    node.kind !== filters.kind
                ) {
                    return false;
                }

                if (
                    filters.filePath &&
                    node.filePath !== filters.filePath
                ) {
                    return false;
                }

                if (normalizedSearch) {
                    const nameMatches =
                        node.name.toLowerCase().includes(
                            normalizedSearch
                        );

                    const qualifiedNameMatches =
                        node.qualifiedName?.toLowerCase().includes(
                            normalizedSearch
                        ) ?? false;

                    if (
                        !nameMatches &&
                        !qualifiedNameMatches
                    ) {
                        return false;
                    }
                }

                return true;
            })
            .sort((a, b) =>
                a.filePath.localeCompare(b.filePath) ||
                a.startLine - b.startLine ||
                a.name.localeCompare(b.name) ||
                a.id.localeCompare(b.id)
            );

        const nodeIds = new Set(
            nodes.map((node) => node.id)
        );

        const edges: GraphEdge[] = dependencies
            .filter((dependency) => {
                if (
                    filters.dependencyType &&
                    dependency.type !== filters.dependencyType
                ) {
                    return false;
                }

                return (
                    nodeIds.has(dependency.sourceSymbolId) &&
                    nodeIds.has(dependency.targetSymbolId)
                );
            })
            .map((dependency) => ({
                id: dependency.id,
                source: dependency.sourceSymbolId,
                target: dependency.targetSymbolId,
                type: dependency.type
            }))
            .sort((a, b) =>
                a.source.localeCompare(b.source) ||
                a.target.localeCompare(b.target) ||
                a.type.localeCompare(b.type)
            );

        return {
            analysisRunId,
            totalNodes: nodes.length,
            totalEdges: edges.length,
            nodes,
            edges
        };
    }
}
