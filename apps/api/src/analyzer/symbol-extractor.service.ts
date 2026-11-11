
import { Injectable } from "@nestjs/common";
import * as ts from "typescript";

import {
    ExtractedSymbol,
    SymbolExtractionResult
} from "./analyzer.types.js";

@Injectable()
export class SymbolExtractorService {
    extract(
        sourceCode: string,
        fileName = "source.ts"
    ): SymbolExtractionResult {
        const sourceFile = ts.createSourceFile(
            fileName,
            sourceCode,
            ts.ScriptTarget.Latest,
            true,
            this.getScriptKind(fileName)
        );

        const symbols: ExtractedSymbol[] = [];

        const diagnostics = ts.transpileModule(sourceCode, {
            fileName,
            compilerOptions: {
                target: ts.ScriptTarget.Latest
            },
            reportDiagnostics: true
        }).diagnostics ?? [];

        const errors = diagnostics.map(diagnostic =>
            ts.flattenDiagnosticMessageText(
                diagnostic.messageText,
                "\n"
            )
        );

        const visit = (
            node: ts.Node,
            parentNames: string[] = []
        ): void => {
            const extracted = this.extractNode(node, sourceFile);

            let nextParentNames = parentNames;

            if (extracted) {
                let qualifiedName: string;

                if (
                    ts.isBinaryExpression(node) &&
                    ts.isPropertyAccessExpression(node.left) &&
                    node.left.expression.kind === ts.SyntaxKind.ThisKeyword
                ) {
                    let parent = node.parent;
                
                    while (
                        parent &&
                        !ts.isClassDeclaration(parent)
                    ) {
                        parent = parent.parent;
                    }
                
                    const className = parent?.name?.text;
                
                    qualifiedName = className
                        ? `${className}.${extracted.name}`
                        : [...parentNames, extracted.name].join(".");
                } else {
                    qualifiedName = [
                        ...parentNames,
                        extracted.name
                    ].join(".");
                }

                symbols.push({
                    ...extracted,
                    qualifiedName
                });

                if (this.isContainer(node) || this.isFunctionContainer(node)) {
                    nextParentNames = [
                        ...parentNames,
                        extracted.name
                    ];
                }
            }

            ts.forEachChild(node, child =>
                visit(child, nextParentNames)
            );
        };

        visit(sourceFile);

        const uniqueSymbolsMap = new Map<string, ExtractedSymbol>();

        for (const symbol of symbols) {
            const key = `${symbol.qualifiedName}:${symbol.kind}`;
        
            if (!uniqueSymbolsMap.has(key)) {
                uniqueSymbolsMap.set(key, symbol);
            }
        }
        
        const uniqueSymbols = Array.from(uniqueSymbolsMap.values());
        
        return {
            symbols: uniqueSymbols,
            errors
        };
    }


    private extractNode(
        node: ts.Node,
        sourceFile: ts.SourceFile
    ): ExtractedSymbol | null {
        let name: string | undefined;
        let kind: ExtractedSymbol["kind"] | undefined;
    
        if (ts.isClassDeclaration(node)) {
            name = node.name?.text;
            kind = "CLASS";
        } else if (ts.isInterfaceDeclaration(node)) {
            name = node.name.text;
            kind = "INTERFACE";
        } else if (ts.isEnumDeclaration(node)) {
            name = node.name.text;
            kind = "ENUM";
        } else if (ts.isEnumMember(node)) {
            name = this.getMemberName(node.name);
            kind = "FIELD";
        } else if (ts.isTypeAliasDeclaration(node)) {
            name = node.name.text;
            kind = "TYPE_ALIAS";
        } else if (ts.isFunctionDeclaration(node)) {
            name = node.name?.text;
            kind = "FUNCTION";
        } else if (ts.isMethodDeclaration(node)) {
            name = this.getMemberName(node.name);
            kind = "METHOD";
        } else if (ts.isConstructorDeclaration(node)) {
            name = "constructor";
            kind = "CONSTRUCTOR";
        } else if (
            ts.isPropertyDeclaration(node) ||
            ts.isPropertySignature(node)
        ) {
            name = this.getMemberName(node.name);
            kind = "PROPERTY";
        } else if (
            ts.isBinaryExpression(node) &&
            node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
            ts.isPropertyAccessExpression(node.left) &&
            node.left.expression.kind === ts.SyntaxKind.ThisKeyword
        ) {
            name = node.left.name.text;
            kind = "PROPERTY";
        } else if (ts.isParameter(node)) {
            const names = this.getBindingNames(node.name);
        
            name = names.length === 1 ? names[0] : undefined;
            kind = "VARIABLE";
        } else if (ts.isBindingElement(node)) {
            const names = this.getBindingNames(node.name);
        
            name = names.length === 1 ? names[0] : undefined;
            kind = "VARIABLE";
        } else if (ts.isVariableDeclaration(node)) {
            name = ts.isIdentifier(node.name)
                ? node.name.text
                : undefined;
    
            if (
                node.initializer &&
                (
                    ts.isArrowFunction(node.initializer) ||
                    ts.isFunctionExpression(node.initializer)
                )
            ) {
                kind = "FUNCTION";
            } else {
                kind = "VARIABLE";
            }
        }
    
        if (!name || !kind) {
            return null;
        }
    
        const start = node.getStart(sourceFile);
        const end = node.getEnd();
    
        return {
            name,
            qualifiedName: null,
            kind,
            startLine:
                sourceFile.getLineAndCharacterOfPosition(start).line + 1,
            endLine:
                sourceFile.getLineAndCharacterOfPosition(end).line + 1
        };
    }
    
private getBindingNames(
    name: ts.BindingName
): string[] {
    if (ts.isIdentifier(name)) {
        return [name.text];
    }

    const names: string[] = [];

    for (const element of name.elements) {
        if (ts.isOmittedExpression(element)) {
            continue;
        }

        if (ts.isBindingElement(element)) {
            names.push(...this.getBindingNames(element.name));
        }
    }

    return names;
}

    private getMemberName(
        name: ts.PropertyName
    ): string | undefined {
        if (
            ts.isIdentifier(name) ||
            ts.isPrivateIdentifier(name)
        ) {
            return name.text;
        }

        if (
            ts.isStringLiteral(name) ||
            ts.isNumericLiteral(name)
        ) {
            return name.text;
        }

        return undefined;
    }

    private isContainer(node: ts.Node): boolean {
        return (
            ts.isClassDeclaration(node) ||
            ts.isInterfaceDeclaration(node) ||
            ts.isEnumDeclaration(node) ||
            ts.isModuleDeclaration(node)
        );
    }

    private isFunctionContainer(node: ts.Node): boolean {
        return (
            ts.isFunctionDeclaration(node) ||
            ts.isMethodDeclaration(node) ||
            ts.isConstructorDeclaration(node) ||
            (
                ts.isVariableDeclaration(node) &&
                node.initializer !== undefined &&
                (
                    ts.isArrowFunction(node.initializer) ||
                    ts.isFunctionExpression(node.initializer)
                )
            )
        );
    }

    private getScriptKind(fileName: string): ts.ScriptKind {
        const extension = fileName.toLowerCase().split(".").pop();

        switch (extension) {
            case "tsx":
                return ts.ScriptKind.TSX;
            case "jsx":
                return ts.ScriptKind.JSX;
            case "js":
            case "mjs":
            case "cjs":
                return ts.ScriptKind.JS;
            default:
                return ts.ScriptKind.TS;
        }
    }
}
