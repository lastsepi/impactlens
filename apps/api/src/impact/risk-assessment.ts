
import type {
    DependencyType,
    SymbolKind
} from "../generated/prisma/client.js";

export interface RiskImpact {
    kind: SymbolKind;
    dependencyType: DependencyType;
}

export interface RiskAssessment {
    riskScore: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    affectedFiles: number;
    affectedKinds: Partial<Record<SymbolKind, number>>;
    summary: string;
}

const DEPENDENCY_WEIGHTS: Record<DependencyType, number> = {
    CALLS: 1.0,
    WRITES: 1.0,
    EXTENDS: 1.0,
    IMPLEMENTS: 0.85,
    IMPORTS: 0.7,
    REFERENCES: 0.7,
    READS: 0.6,
    USES: 0.5
};

function normalize(
    value: number,
    saturationPoint: number
): number {
    if (value <= 0) {
        return 0;
    }

    return Math.min(1, value / saturationPoint);
}

export function calculateRiskScore(
    totalSymbols: number,
    affectedFiles: number,
    maxDepth: number,
    impacts: RiskImpact[]
): number {
    const symbolScore = normalize(totalSymbols, 10);
    const fileScore = normalize(affectedFiles, 5);
    const depthScore = normalize(maxDepth, 5);

    const dependencyScore =
        impacts.length === 0
            ? 0
            : impacts.reduce(
                (total, impact) =>
                    total + DEPENDENCY_WEIGHTS[impact.dependencyType],
                0
            ) / impacts.length;

    const score =
        symbolScore * 35 +
        fileScore * 25 +
        depthScore * 20 +
        dependencyScore * 20;

    return Math.round(
        Math.min(100, Math.max(0, score))
    );
}

export function getRiskLevel(
    score: number
): RiskAssessment["riskLevel"] {
    if (score >= 75) return "CRITICAL";
    if (score >= 50) return "HIGH";
    if (score >= 25) return "MEDIUM";

    return "LOW";
}

export function createRiskAssessment(
    impacts: RiskImpact[],
    filePaths: string[],
    maxDepth: number
): RiskAssessment {
    const affectedFiles = new Set(filePaths).size;

    const affectedKinds: Partial<
        Record<SymbolKind, number>
    > = {};

    for (const impact of impacts) {
        affectedKinds[impact.kind] =
            (affectedKinds[impact.kind] ?? 0) + 1;
    }

    const riskScore = calculateRiskScore(
        impacts.length,
        affectedFiles,
        maxDepth,
        impacts
    );

    const riskLevel = getRiskLevel(riskScore);

    const symbolLabel =
        impacts.length === 1 ? "symbol" : "symbols";

    const fileLabel =
        affectedFiles === 1 ? "file" : "files";

    return {
        riskScore,
        riskLevel,
        affectedFiles,
        affectedKinds,
        summary:
            `${impacts.length} ${symbolLabel} across ` +
            `${affectedFiles} ${fileLabel} may be affected. ` +
            `Estimated risk level: ${riskLevel}.`
    };
}
