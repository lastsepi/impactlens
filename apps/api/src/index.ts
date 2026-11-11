import type { SourceFile } from "@impactlens/shared";

const exampleFile: SourceFile = {
    id: "file-001",
    path: "src/index.ts",
    language: "typescript",
    size: 1024
};

console.log("ImpactLens API");
console.log(exampleFile);