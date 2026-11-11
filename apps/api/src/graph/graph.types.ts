
import {
    DependencyType,
    SymbolKind
} from "../generated/prisma/client.js";

export interface GraphNode {
    id: string;
    name: string;
    qualifiedName: string | null;
    kind: SymbolKind;
    filePath: string;
    startLine: number;
    endLine: number;
}

export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    type: DependencyType;
}

export interface GraphFilters {
    search?: string;
    kind?: SymbolKind;
    dependencyType?: DependencyType;
    filePath?: string;
}

export interface DependencyGraph {
    analysisRunId: string;
    totalNodes: number;
    totalEdges: number;
    nodes: GraphNode[];
    edges: GraphEdge[];
}
