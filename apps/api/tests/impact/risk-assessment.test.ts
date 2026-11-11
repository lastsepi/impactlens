
import test from "node:test";

import {
    strictEqual,
    ok,
    match
} from "node:assert";

import {
    calculateRiskScore,
    getRiskLevel,
    createRiskAssessment
} from "../../src/impact/risk-assessment.js";

import {
    DependencyType,
    SymbolKind
} from "../../src/generated/prisma/client.js";

test("Risk score should be zero when there are no impacts", () => {
    const score = calculateRiskScore(0, 0, 0, []);

    strictEqual(score, 0);
});

test("Risk score should increase with affected symbols", () => {
    const lowScore = calculateRiskScore(
        1,
        1,
        1,
        [{
            kind: SymbolKind.FUNCTION,
            dependencyType: DependencyType.CALLS
        }]
    );

    const highScore = calculateRiskScore(
        8,
        4,
        4,
        Array.from({ length: 8 }, () => ({
            kind: SymbolKind.FUNCTION,
            dependencyType: DependencyType.CALLS
        }))
    );

    ok(highScore > lowScore);
});

test("Risk score should not exceed 100", () => {
    const impacts = Array.from({ length: 30 }, () => ({
        kind: SymbolKind.METHOD,
        dependencyType: DependencyType.CALLS
    }));

    const score = calculateRiskScore(
        30,
        20,
        15,
        impacts
    );

    strictEqual(score, 100);
});

test("Risk levels should match configured thresholds", () => {
    strictEqual(getRiskLevel(0), "LOW");
    strictEqual(getRiskLevel(24), "LOW");
    strictEqual(getRiskLevel(25), "MEDIUM");
    strictEqual(getRiskLevel(49), "MEDIUM");
    strictEqual(getRiskLevel(50), "HIGH");
    strictEqual(getRiskLevel(74), "HIGH");
    strictEqual(getRiskLevel(75), "CRITICAL");
    strictEqual(getRiskLevel(100), "CRITICAL");
});

test("Risk assessment should count affected symbol kinds", () => {
    const assessment = createRiskAssessment(
        [
            {
                kind: SymbolKind.METHOD,
                dependencyType: DependencyType.CALLS
            },
            {
                kind: SymbolKind.METHOD,
                dependencyType: DependencyType.CALLS
            },
            {
                kind: SymbolKind.FUNCTION,
                dependencyType: DependencyType.IMPLEMENTS
            }
        ],
        [
            "src/user.service.ts",
            "src/user.service.ts",
            "src/app.ts"
        ],
        2
    );

    strictEqual(assessment.affectedFiles, 2);
    strictEqual(assessment.affectedKinds[SymbolKind.METHOD], 2);
    strictEqual(assessment.affectedKinds[SymbolKind.FUNCTION], 1);
});

test("Risk summary should use singular grammar", () => {
    const assessment = createRiskAssessment(
        [{
            kind: SymbolKind.METHOD,
            dependencyType: DependencyType.CALLS
        }],
        ["src/user.service.ts"],
        1
    );

    match(
        assessment.summary,
        /^1 symbol across 1 file/
    );
});

test("Risk summary should handle zero impacts", () => {
    const assessment = createRiskAssessment([], [], 0);

    strictEqual(assessment.riskScore, 0);
    strictEqual(assessment.riskLevel, "LOW");
    strictEqual(assessment.affectedFiles, 0);

    strictEqual(
        assessment.summary,
        "0 symbols across 0 files may be affected. Estimated risk level: LOW."
    );
});
