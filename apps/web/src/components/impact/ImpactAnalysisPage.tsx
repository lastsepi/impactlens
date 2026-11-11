
import { useEffect, useState } from "react";
import {
    AlertTriangle,
    ArrowDown,
    FileCode,
    LoaderCircle,
    Search,
    ShieldCheck
} from "lucide-react";

import { getAnalysisSymbols } from "../../services/symbol.service";
import { getImpactAnalysis } from "../../services/impact.service";

import type { GraphNode } from "../../types/graph.types";
import type { ImpactAnalysisResult } from "../../types/impact.types";

interface ImpactAnalysisPageProps {
    projectId: string;
    analysisRunId: string;
}

function ImpactAnalysisPage({
    projectId,
    analysisRunId
}: ImpactAnalysisPageProps) {
    const [symbols, setSymbols] = useState<GraphNode[]>([]);
    const [selectedSymbolId, setSelectedSymbolId] = useState("");

    const [result, setResult] = useState<ImpactAnalysisResult | null>(null);

    const [loadingSymbols, setLoadingSymbols] = useState(false);
    const [loadingImpact, setLoadingImpact] = useState(false);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadSymbols() {
            setLoadingSymbols(true);
            setError(null);
            setSymbols([]);
            setSelectedSymbolId("");
            setResult(null);

            try {
                const response = await getAnalysisSymbols(
                    projectId,
                    analysisRunId
                );

                if (cancelled) return;

                setSymbols(response.symbols);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load symbols."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingSymbols(false);
                }
            }
        }

        if (projectId && analysisRunId) {
            void loadSymbols();
        }

        return () => {
            cancelled = true;
        };
    }, [projectId, analysisRunId]);

    useEffect(() => {
        if (!projectId || !analysisRunId || !selectedSymbolId) {
            setResult(null);
            return;
        }

        let cancelled = false;

        async function loadImpact() {
            setLoadingImpact(true);
            setError(null);
            setResult(null);

            try {
                const response = await getImpactAnalysis(
                    projectId,
                    analysisRunId,
                    selectedSymbolId
                );

                if (!cancelled) {
                    setResult(response);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to analyze impact."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingImpact(false);
                }
            }
        }

        void loadImpact();

        return () => {
            cancelled = true;
        };
    }, [projectId, analysisRunId, selectedSymbolId]);

    const selectedSymbol = symbols.find(
        symbol => symbol.id === selectedSymbolId
    );

    const riskClass = result?.riskLevel.toLowerCase() ?? "";

    return (
        <section className="impact-page">
            <div className="impact-page-header">
                <div>
                    <span className="impact-eyebrow">
                        CODE CHANGE INTELLIGENCE
                    </span>

                    <h1>Impact Analysis</h1>

                    <p>
                        Discover which parts of your codebase may be affected
                        by changing a symbol.
                    </p>
                </div>

                <div className="impact-header-icon">
                    <ShieldCheck size={28} />
                </div>
            </div>

            <div className="impact-selector-panel">
                <div className="impact-selector-heading">
                    <Search size={19} />

                    <div>
                        <h2>Select a Symbol</h2>
                        <p>
                            Choose a symbol to calculate its potential impact.
                        </p>
                    </div>
                </div>

                <select
                    className="impact-symbol-select"
                    value={selectedSymbolId}
                    onChange={event =>
                        setSelectedSymbolId(event.target.value)
                    }
                    disabled={loadingSymbols || symbols.length === 0}
                >
                    <option value="">
                        {loadingSymbols
                            ? "Loading symbols..."
                            : symbols.length === 0
                                ? "No symbols available"
                                : "Choose a symbol..."}
                    </option>

                    {symbols.map(symbol => (
                        <option key={symbol.id} value={symbol.id}>
                            {symbol.qualifiedName ?? symbol.name}
                            {" — "}
                            {symbol.filePath}
                        </option>
                    ))}
                </select>

                {selectedSymbol && (
                    <div className="impact-selected-symbol">
                        <span>{selectedSymbol.kind}</span>
                        <strong>
                            {selectedSymbol.qualifiedName ?? selectedSymbol.name}
                        </strong>
                        <small>{selectedSymbol.filePath}</small>
                    </div>
                )}
            </div>

            {error && (
                <div className="impact-error">
                    <AlertTriangle size={19} />
                    <span>{error}</span>
                </div>
            )}

            {loadingImpact && (
                <div className="impact-loading">
                    <LoaderCircle size={25} className="impact-spinner" />
                    <h3>Analyzing dependencies...</h3>
                    <p>Calculating direct and indirect impacts.</p>
                </div>
            )}

            {!loadingImpact && result && (
                <>
                    <div className="impact-result-header">
                        <div>
                            <h2>Analysis Results</h2>
                            <p>{result.summary}</p>
                        </div>

                        <div className={`impact-risk-badge ${riskClass}`}>
                            <span>RISK LEVEL</span>
                            <strong>{result.riskLevel}</strong>
                        </div>
                    </div>

                    <div className="impact-stats-grid">
                        <div className="impact-stat-card">
                            <span>Total Impacted Symbols</span>
                            <strong>{result.totalImpactedSymbols}</strong>
                        </div>

                        <div className="impact-stat-card">
                            <span>Direct Impact</span>
                            <strong>{result.directImpactCount}</strong>
                        </div>

                        <div className="impact-stat-card">
                            <span>Indirect Impact</span>
                            <strong>{result.indirectImpactCount}</strong>
                        </div>

                        <div className="impact-stat-card">
                            <span>Affected Files</span>
                            <strong>{result.affectedFiles}</strong>
                        </div>
                    </div>

                    <div className="impact-details-grid">
                        <div className="impact-panel">
                            <div className="impact-panel-heading">
                                <ShieldCheck size={19} />
                                <h3>Risk Assessment</h3>
                            </div>

                            <div className="impact-risk-score">
                                <strong>{result.riskScore}</strong>
                                <span>/ 100</span>
                            </div>

                            <div className="impact-risk-track">
                                <div
                                    className={`impact-risk-fill ${riskClass}`}
                                    style={{
                                        width: `${Math.min(100, Math.max(0, result.riskScore))}%`
                                    }}
                                />
                            </div>

                            <div className="impact-risk-meta">
                                <span>Estimated change risk</span>
                                <strong>{result.riskLevel}</strong>
                            </div>

                            <div className="impact-extra-stats">
                                <div>
                                    <span>Maximum Dependency Depth</span>
                                    <strong>{result.maxDepth}</strong>
                                </div>

                                <div>
                                    <span>Impacted Symbol Types</span>
                                    <strong>
                                        {Object.keys(result.affectedKinds).length}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        <div className="impact-panel">
                            <div className="impact-panel-heading">
                                <FileCode size={19} />
                                <h3>Affected Symbol Types</h3>
                            </div>

                            {Object.entries(result.affectedKinds).length === 0 ? (
                                <p className="impact-empty-text">
                                    No affected symbol types.
                                </p>
                            ) : (
                                <div className="impact-kind-list">
                                    {Object.entries(result.affectedKinds).map(
                                        ([kind, count]) => (
                                            <div
                                                className="impact-kind-item"
                                                key={kind}
                                            >
                                                <span>{kind}</span>
                                                <strong>{count}</strong>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="impact-panel impact-chain-panel">
                        <div className="impact-panel-heading">
                            <GitBranchIcon />
                            <h3>Dependency Impact Chain</h3>
                        </div>

                        <div className="impact-chain-root">
                            <span>CHANGED SYMBOL</span>
                            <strong>
                                {result.changedSymbol.qualifiedName ??
                                    result.changedSymbol.name}
                            </strong>
                            <small>{result.changedSymbol.filePath}</small>
                        </div>

                        {result.impacts.length === 0 ? (
                            <div className="impact-no-dependencies">
                                No dependent symbols were found.
                            </div>
                        ) : (
                            <div className="impact-chain-list">
                                {result.impacts.map(impact => (
                                    <div
                                        className="impact-chain-item"
                                        key={impact.symbolId}
                                    >
                                        <div className="impact-chain-connector">
                                            <ArrowDown size={18} />
                                        </div>

                                        <div className="impact-chain-node">
                                            <div>
                                                <strong>
                                                    {impact.qualifiedName ??
                                                        impact.name}
                                                </strong>

                                                <small>
                                                    {impact.filePath}
                                                    {" · Lines "}
                                                    {impact.startLine}–{impact.endLine}
                                                </small>
                                            </div>

                                            <div className="impact-chain-meta">
                                                <span>
                                                    {impact.dependencyType}
                                                </span>

                                                <span>
                                                    Depth {impact.depth}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {!loadingSymbols &&
                !loadingImpact &&
                !error &&
                !selectedSymbolId && (
                    <div className="impact-empty-state">
                        <Search size={30} />
                        <h3>Ready to Analyze</h3>
                        <p>
                            Select a symbol above to discover its potential
                            impact across your project.
                        </p>
                    </div>
                )}
        </section>
    );
}

function GitBranchIcon() {
    return <ArrowDown size={19} />;
}

export default ImpactAnalysisPage;
