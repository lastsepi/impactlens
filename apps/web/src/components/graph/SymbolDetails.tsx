
import {
    X,
    Box,
    FileCode,
    Hash,
    Layers,
    Code2
} from "lucide-react";

import type { GraphNode } from "../../types/graph.types";

interface SymbolDetailsProps {
    node: GraphNode | null;
    onClose: () => void;
}

function SymbolDetails({
    node,
    onClose
}: SymbolDetailsProps) {
    if (!node) {
        return (
            <aside className="symbol-details empty">
                <div className="details-empty-icon">
                    <Box size={28} />
                </div>

                <h3>No Symbol Selected</h3>

                <p>
                    Select a node from the dependency graph
                    to inspect its details.
                </p>
            </aside>
        );
    }

    return (
        <aside className="symbol-details">
            <div className="details-header">
                <div>
                    <span className="details-eyebrow">
                        SYMBOL INSPECTOR
                    </span>

                    <h3>Symbol Details</h3>
                </div>

                <button
                    type="button"
                    className="details-close"
                    onClick={onClose}
                    aria-label="Close details"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="details-symbol">
                <div className="details-symbol-icon">
                    <Code2 size={22} />
                </div>

                <div>
                    <h2>{node.name}</h2>

                    <span className="details-kind">
                        {node.kind.replaceAll("_", " ")}
                    </span>
                </div>
            </div>

            <div className="details-section">
                <span className="details-section-title">
                    GENERAL INFORMATION
                </span>

                <div className="details-item">
                    <div className="details-item-label">
                        <Hash size={15} />
                        Symbol ID
                    </div>

                    <span className="details-item-value" title={node.id}>
                        {node.id}
                    </span>
                </div>

                <div className="details-item">
                    <div className="details-item-label">
                        <Layers size={15} />
                        Qualified Name
                    </div>

                    <span className="details-item-value">
                        {node.qualifiedName ?? "Not available"}
                    </span>
                </div>

                <div className="details-item">
                    <div className="details-item-label">
                        <FileCode size={15} />
                        File Path
                    </div>

                    <span className="details-item-value" title={node.filePath}>
                        {node.filePath}
                    </span>
                </div>
            </div>

            <div className="details-section">
                <span className="details-section-title">
                    SOURCE LOCATION
                </span>

                <div className="details-line-range">
                    <div>
                        <span>Start Line</span>
                        <strong>{node.startLine}</strong>
                    </div>

                    <div>
                        <span>End Line</span>
                        <strong>{node.endLine}</strong>
                    </div>

                    <div>
                        <span>Line Count</span>
                        <strong>
                            {Math.max(0, node.endLine - node.startLine + 1)}
                        </strong>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default SymbolDetails;
