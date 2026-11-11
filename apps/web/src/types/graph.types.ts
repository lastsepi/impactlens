
export type SymbolKind =
| "CLASS"
| "METHOD"
| "FUNCTION"
| "INTERFACE"
| "ENUM"
| "PROPERTY"
| "FIELD"
| "VARIABLE"
| "CONSTRUCTOR"
| "MODULE"
| "TYPE_ALIAS";

export type DependencyType =
| "CALLS"
| "IMPORTS"
| "EXTENDS"
| "IMPLEMENTS"
| "REFERENCES"
| "READS"
| "WRITES"
| "USES";

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

export interface DependencyGraph {
analysisRunId: string;
totalNodes: number;
totalEdges: number;
nodes: GraphNode[];
edges: GraphEdge[];
}

export interface GraphFilters {
search?: string;
kind?: SymbolKind;
dependencyType?: DependencyType;
filePath?: string;
}
