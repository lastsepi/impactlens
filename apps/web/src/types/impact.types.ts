
import type {
    SymbolKind,
    DependencyType
} from "./graph.types";

export type RiskLevel =
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

export interface ChangedSymbol {
    id: string;
    name: string;
    qualifiedName: string | null;
    kind: SymbolKind;
    filePath: string;
}

export interface ImpactNode {
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

export interface ImpactAnalysisResult {
    analysisRunId: string;
    changedSymbol: ChangedSymbol;
    totalImpactedSymbols: number;
    directImpactCount: number;
    indirectImpactCount: number;
    maxDepth: number;
    riskScore: number;
    riskLevel: RiskLevel;
    affectedFiles: number;
    affectedKinds: Partial<Record<SymbolKind, number>>;
    summary: string;
    impacts: ImpactNode[];
}
