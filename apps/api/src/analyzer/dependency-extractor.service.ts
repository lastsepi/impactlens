
import { Injectable } from "@nestjs/common";
import * as ts from "typescript";

import {
    DependencyType,
    SymbolKind
} from "../generated/prisma/client.js";

import {
    DependencySourceFile,
    ExtractedDependency,
    StoredCodeSymbol
} from "./analyzer.types.js";

interface FileContext {
    sourceFile: ts.SourceFile;
    symbols: StoredCodeSymbol[];
    variableTypes: Map<string, string>;
    inheritance: Map<string, string[]>;
}

@Injectable()
export class DependencyExtractorService {
    extract(
        files: DependencySourceFile[],
        symbols: StoredCodeSymbol[]
    ): ExtractedDependency[] {
        const dependencies = new Map<string, ExtractedDependency>();

        for (const file of files) {
            const sourceFile = ts.createSourceFile(
                file.path,
                file.sourceCode,
                ts.ScriptTarget.Latest,
                true,
                this.getScriptKind(file.path)
            );

            const fileSymbols = symbols.filter(
                symbol => symbol.sourceFile.path === file.path
            );

            const context: FileContext = {
                sourceFile,
                symbols: fileSymbols,
                variableTypes: new Map(),
                inheritance: new Map()
            };

            this.buildVariableTypes(context);
            this.buildInheritanceMap(context);

            const addDependency = (
                sourceSymbol: StoredCodeSymbol | undefined,
                targetSymbol: StoredCodeSymbol | undefined,
                type: DependencyType
            ): void => {
                if (!sourceSymbol || !targetSymbol) {
                    return;
                }

                const key = [
                    sourceSymbol.id,
                    targetSymbol.id,
                    type
                ].join(":");

                if (!dependencies.has(key)) {
                    dependencies.set(key, {
                        sourceSymbolId: sourceSymbol.id,
                        targetSymbolId: targetSymbol.id,
                        type
                    });
                }
            };

            const visit = (node: ts.Node): void => {
                if (ts.isCallExpression(node)) {
                    const sourceSymbol = this.findEnclosingSymbol(
                        node,
                        context
                    );

                    const targetSymbol = this.resolveCallTarget(
                        node.expression,
                        sourceSymbol,
                        context,
                        symbols
                    );

                    addDependency(
                        sourceSymbol,
                        targetSymbol,
                        DependencyType.CALLS
                    );
                }

                if (ts.isClassDeclaration(node) && node.name) {
                    const sourceSymbol = this.findClassSymbol(
                        node,
                        context
                    );

                    for (const clause of node.heritageClauses ?? []) {
                        const dependencyType =
                            clause.token === ts.SyntaxKind.ExtendsKeyword
                                ? DependencyType.EXTENDS
                                : DependencyType.IMPLEMENTS;

                        for (const heritageType of clause.types) {
                            const targetName = this.getRightmostName(
                                heritageType.expression
                            );

                            const allowedKinds: SymbolKind[] =
                                dependencyType === DependencyType.EXTENDS
                                    ? [SymbolKind.CLASS]
                                    : [SymbolKind.INTERFACE];

                            const targetSymbol = this.resolveNamedTarget(
                                targetName,
                                allowedKinds,
                                file.path,
                                symbols
                            );

                            addDependency(
                                sourceSymbol,
                                targetSymbol,
                                dependencyType
                            );
                        }
                    }
                }

                ts.forEachChild(node, visit);
            };

            visit(sourceFile);
        }

        return Array.from(dependencies.values());
    }

    private buildVariableTypes(context: FileContext): void {
        const visit = (node: ts.Node): void => {
            if (
                ts.isVariableDeclaration(node) &&
                ts.isIdentifier(node.name) &&
                node.initializer &&
                ts.isNewExpression(node.initializer)
            ) {
                const className = this.getRightmostName(
                    node.initializer.expression
                );

                const classMatches = context.symbols.filter(symbol =>
                    symbol.kind === SymbolKind.CLASS &&
                    symbol.name === className
                );

                if (classMatches.length === 1) {
                    context.variableTypes.set(
                        node.name.text,
                        classMatches[0].qualifiedName ??
                            classMatches[0].name
                    );
                }
            }

            ts.forEachChild(node, visit);
        };

        visit(context.sourceFile);
        console.log(
            "[DEBUG] Variable Types:",
            Array.from(context.variableTypes.entries())
        );
    }

    private buildInheritanceMap(context: FileContext): void {
        const visit = (node: ts.Node): void => {
            if (ts.isClassDeclaration(node) && node.name) {
                const classSymbol = this.findClassSymbol(
                    node,
                    context
                );

                if (classSymbol?.qualifiedName) {
                    const baseClasses: string[] = [];

                    for (const clause of node.heritageClauses ?? []) {
                        if (
                            clause.token !==
                            ts.SyntaxKind.ExtendsKeyword
                        ) {
                            continue;
                        }

                        for (const heritageType of clause.types) {
                            const baseName = this.getRightmostName(
                                heritageType.expression
                            );

                            const matches = context.symbols.filter(
                                symbol =>
                                    symbol.kind === SymbolKind.CLASS &&
                                    symbol.name === baseName
                            );

                            if (matches.length === 1) {
                                baseClasses.push(
                                    matches[0].qualifiedName ??
                                        matches[0].name
                                );
                            }
                        }
                    }

                    context.inheritance.set(
                        classSymbol.qualifiedName,
                        baseClasses
                    );
                }
            }

            ts.forEachChild(node, visit);
        };

        visit(context.sourceFile);
        console.log(
            "[DEBUG] Inheritance Map:",
            Array.from(context.inheritance.entries())
        );
    }

    private findEnclosingSymbol(
        node: ts.Node,
        context: FileContext
    ): StoredCodeSymbol | undefined {
        const line =
            context.sourceFile.getLineAndCharacterOfPosition(
                node.getStart(context.sourceFile)
            ).line + 1;

        const allowedKinds: SymbolKind[] = [
            SymbolKind.FUNCTION,
            SymbolKind.METHOD,
            SymbolKind.CONSTRUCTOR
        ];

        const candidates = context.symbols
            .filter(symbol => allowedKinds.includes(symbol.kind))
            .filter(symbol =>
                symbol.startLine <= line &&
                symbol.endLine >= line
            )
            .sort((a, b) => {
                const aLength = a.endLine - a.startLine;
                const bLength = b.endLine - b.startLine;

                return aLength - bLength;
            });

        return candidates[0];
    }

    private findClassSymbol(
        node: ts.ClassDeclaration,
        context: FileContext
    ): StoredCodeSymbol | undefined {
        if (!node.name) {
            return undefined;
        }

        const line =
            context.sourceFile.getLineAndCharacterOfPosition(
                node.getStart(context.sourceFile)
            ).line + 1;

        return context.symbols.find(symbol =>
            symbol.kind === SymbolKind.CLASS &&
            symbol.name === node.name?.text &&
            symbol.startLine <= line &&
            symbol.endLine >= line
        );
    }

    private resolveCallTarget(
        expression: ts.Expression,
        sourceSymbol: StoredCodeSymbol | undefined,
        context: FileContext,
        allSymbols: StoredCodeSymbol[]
    ): StoredCodeSymbol | undefined {
        if (!sourceSymbol) {
            return undefined;
        }

        const callableKinds: SymbolKind[] = [
            SymbolKind.FUNCTION,
            SymbolKind.METHOD
        ];

        if (ts.isIdentifier(expression)) {
            return this.resolveNamedTarget(
                expression.text,
                callableKinds,
                sourceSymbol.sourceFile.path,
                allSymbols,
                sourceSymbol
            );
        }

        if (!ts.isPropertyAccessExpression(expression)) {
            return undefined;
        }

        const methodName = expression.name.text;

        // this.method()
        if (
            expression.expression.kind ===
            ts.SyntaxKind.ThisKeyword
        ) {
            const ownerClass = this.findOwningClass(
                sourceSymbol,
                context.symbols
            );

            if (!ownerClass?.qualifiedName) {
                return undefined;
            }

            return this.resolveClassMethod(
                ownerClass.qualifiedName,
                methodName,
                context,
            );
        }

        if (ts.isIdentifier(expression.expression)) {
            const objectName = expression.expression.text;

            // instance.method()
            const variableClass =
                context.variableTypes.get(objectName);

            if (variableClass) {
                return this.resolveClassMethod(
                    variableClass,
                    methodName,
                    context,
                );
            }

            // ClassName.staticMethod()
            const classMatches = context.symbols.filter(symbol =>
                symbol.kind === SymbolKind.CLASS &&
                symbol.name === objectName
            );

            if (classMatches.length === 1) {
                const className =
                    classMatches[0].qualifiedName ??
                    classMatches[0].name;

                return this.resolveClassMethod(
                    className,
                    methodName,
                    context,
                );
            }
        }

        return undefined;
    }

    private findOwningClass(
        sourceSymbol: StoredCodeSymbol,
        symbols: StoredCodeSymbol[]
    ): StoredCodeSymbol | undefined {
        if (!sourceSymbol.qualifiedName) {
            return undefined;
        }

        return symbols
            .filter(symbol =>
                symbol.kind === SymbolKind.CLASS &&
                !!symbol.qualifiedName &&
                sourceSymbol.qualifiedName!.startsWith(
                    `${symbol.qualifiedName}.`
                )
            )
            .sort((a, b) =>
                (b.qualifiedName?.length ?? 0) -
                (a.qualifiedName?.length ?? 0)
            )[0];
    }

    private resolveClassMethod(
        classQualifiedName: string,
        methodName: string,
        context: FileContext
    ): StoredCodeSymbol | undefined {
        const visited = new Set<string>();
        const queue = [classQualifiedName];
    
        while (queue.length > 0) {
            const currentClass = queue.shift()!;
    
            if (visited.has(currentClass)) {
                continue;
            }
    
            visited.add(currentClass);
    
            const expectedName =
                `${currentClass}.${methodName}`;
    
            // Search only inside the current source file.
            const matches = context.symbols.filter(symbol =>
                symbol.qualifiedName === expectedName &&
                (
                    symbol.kind === SymbolKind.METHOD ||
                    symbol.kind === SymbolKind.FUNCTION
                )
            );
    
            if (matches.length === 1) {
                return matches[0];
            }
    
            if (matches.length > 1) {
                return undefined;
            }
    
            const baseClasses =
                context.inheritance.get(currentClass) ?? [];
    
            queue.push(...baseClasses);
        }
    
        return undefined;
    }

    private resolveNamedTarget(
        name: string,
        allowedKinds: SymbolKind[],
        sourcePath: string,
        allSymbols: StoredCodeSymbol[],
        sourceSymbol?: StoredCodeSymbol
    ): StoredCodeSymbol | undefined {
        if (!name) {
            return undefined;
        }

        const candidates = allSymbols.filter(symbol =>
            symbol.name === name &&
            allowedKinds.includes(symbol.kind)
        );

        if (sourceSymbol?.qualifiedName) {
            const parts = sourceSymbol.qualifiedName.split(".");

            for (let index = parts.length - 1; index >= 1; index--) {
                const expectedName = [
                    ...parts.slice(0, index),
                    name
                ].join(".");

                const scopedMatch = candidates.find(symbol =>
                    symbol.sourceFile.path === sourcePath &&
                    symbol.qualifiedName === expectedName
                );

                if (scopedMatch) {
                    return scopedMatch;
                }
            }
        }

        const sameFileMatches = candidates.filter(
            symbol => symbol.sourceFile.path === sourcePath
        );

        if (sameFileMatches.length === 1) {
            return sameFileMatches[0];
        }

        if (sameFileMatches.length > 1) {
            return undefined;
        }

        return candidates.length === 1
            ? candidates[0]
            : undefined;
    }

    private getRightmostName(
        expression: ts.Expression
    ): string {
        if (ts.isIdentifier(expression)) {
            return expression.text;
        }

        if (ts.isPropertyAccessExpression(expression)) {
            return expression.name.text;
        }

        return "";
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
