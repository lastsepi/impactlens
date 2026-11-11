
import {
    DependencyType,
    SymbolKind
} from "../generated/prisma/client.js";

export interface ExtractedSymbol {
    name: string;
    qualifiedName: string | null;
    kind: SymbolKind;
    startLine: number;
    endLine: number;
}

export interface SymbolExtractionResult {
    symbols: ExtractedSymbol[];
    errors: string[];
}

export interface DependencySourceFile {
    path: string;
    sourceCode: string;
}

export interface StoredCodeSymbol {
    id: string;
    sourceFileId: string;
    name: string;
    qualifiedName: string | null;
    kind: SymbolKind;
    startLine: number;
    endLine: number;
    sourceFile: {
        path: string;
    };
}

export interface ExtractedDependency {
    sourceSymbolId: string;
    targetSymbolId: string;
    type: DependencyType;
}
