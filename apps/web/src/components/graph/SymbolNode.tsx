
import { memo } from "react";
import {
    Handle,
    Position,
    type Node,
    type NodeProps
} from "@xyflow/react";

import {
    Box,
    Braces,
    Code2,
    Database,
    FileCode,
    Layers,
    type LucideIcon
} from "lucide-react";

import type { GraphNode } from "../../types/graph.types";

type SymbolFlowNode = Node<
    { graphNode: GraphNode },
    "symbol"
>;

const kindConfig: Record<
    GraphNode["kind"],
    { label: string; icon: LucideIcon; color: string }
> = {
    CLASS: { label: "Class", icon: Box, color: "#8b5cf6" },
    METHOD: { label: "Method", icon: Code2, color: "#3b82f6" },
    FUNCTION: { label: "Function", icon: Braces, color: "#06b6d4" },
    INTERFACE: { label: "Interface", icon: Layers, color: "#10b981" },
    ENUM: { label: "Enum", icon: Database, color: "#f59e0b" },
    PROPERTY: { label: "Property", icon: FileCode, color: "#ec4899" },
    FIELD: { label: "Field", icon: FileCode, color: "#ec4899" },
    VARIABLE: { label: "Variable", icon: Braces, color: "#64748b" },
    CONSTRUCTOR: { label: "Constructor", icon: Box, color: "#a78bfa" },
    MODULE: { label: "Module", icon: Layers, color: "#14b8a6" },
    TYPE_ALIAS: { label: "Type Alias", icon: FileCode, color: "#f97316" }
};

function SymbolNode({ data, selected }: NodeProps<SymbolFlowNode>) {
    const node = data.graphNode;
    const config = kindConfig[node.kind];
    const Icon = config.icon;

    return (
        <div
            className={`symbol-node${selected ? " selected" : ""}`}
            style={{
                borderColor: selected ? config.color : undefined,
                ["--node-color" as string]: config.color
            }}
        >
            <Handle type="target" position={Position.Left} />

            <div className="symbol-node-header">
                <span
                    className="symbol-node-icon"
                    style={{
                        backgroundColor: `${config.color}20`,
                        color: config.color
                    }}
                >
                    <Icon size={15} />
                </span>

                <span className="symbol-node-kind">
                    {config.label}
                </span>

                <span className="symbol-node-line">
                    L{node.startLine}
                </span>
            </div>

            <div className="symbol-node-name" title={node.name}>
                {node.name}
            </div>

            <div className="symbol-node-file" title={node.filePath}>
                {node.filePath}
            </div>

            <Handle type="source" position={Position.Right} />
        </div>
    );
}

export default memo(SymbolNode);
