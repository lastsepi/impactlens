
import {
    Injectable,
    NotFoundException
} from "@nestjs/common";

import { PrismaService } from "../prisma.service.js";

import {
    DependencyGraph,
    GraphEdge,
    GraphNode
} from "./graph.types.js";

@Injectable()
export class GraphService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    async getDependencyGraph(
        projectId: string,
        analysisRunId: string
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
            .sort((a, b) =>
                a.filePath.localeCompare(b.filePath) ||
                a.startLine - b.startLine ||
                a.name.localeCompare(b.name) ||
                a.id.localeCompare(b.id)
            );

        const edges: GraphEdge[] = dependencies
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
