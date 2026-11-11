
import { useMemo } from "react";

import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    BackgroundVariant,
    type Node,
    type Edge
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import type {
    DependencyGraph as DependencyGraphData,
    GraphNode
} from "../../types/graph.types";

import SymbolNode from "./SymbolNode";

type SymbolFlowNode = Node<
    { graphNode: GraphNode },
    "symbol"
>;

interface DependencyGraphProps {
    graph: DependencyGraphData;
    onNodeSelect: (node: GraphNode | null) => void;
}

const nodeTypes = {
    symbol: SymbolNode
};

function DependencyGraph({
    graph,
    onNodeSelect
}: DependencyGraphProps) {
    const nodes = useMemo<SymbolFlowNode[]>(() => {
        return graph.nodes.map((node, index) => ({
            id: node.id,
            type: "symbol",
            position: {
                x: (index % 4) * 300,
                y: Math.floor(index / 4) * 170
            },
            data: {
                graphNode: node
            }
        }));
    }, [graph.nodes]);

    const edges = useMemo<Edge[]>(() => {
        return graph.edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: "smoothstep",
            label: edge.type,
            animated: edge.type === "CALLS",
            style: {
                stroke: "#64748b",
                strokeWidth: 1.5
            },
            labelStyle: {
                fill: "#94a3b8",
                fontSize: 10
            },
            labelBgStyle: {
                fill: "#111827"
            }
        }));
    }, [graph.edges]);

    return (
        <div className="dependency-graph">
            <ReactFlow<SymbolFlowNode, Edge>
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{
                    padding: 0.2,
                    maxZoom: 1
                }}
                minZoom={0.1}
                maxZoom={2}
                onNodeClick={(_, node) => {
                    onNodeSelect(node.data.graphNode);
                }}
                onPaneClick={() => onNodeSelect(null)}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="#334155"
                />

                <Controls />

                <MiniMap
                    nodeColor={(node) => {
                        const graphNode = (
                            node.data as { graphNode: GraphNode }
                        ).graphNode;

                        const colors: Record<GraphNode["kind"], string> = {
                            CLASS: "#8b5cf6",
                            METHOD: "#3b82f6",
                            FUNCTION: "#06b6d4",
                            INTERFACE: "#10b981",
                            ENUM: "#f59e0b",
                            PROPERTY: "#ec4899",
                            FIELD: "#ec4899",
                            VARIABLE: "#64748b",
                            CONSTRUCTOR: "#a78bfa",
                            MODULE: "#14b8a6",
                            TYPE_ALIAS: "#f97316"
                        };

                        return colors[graphNode.kind];
                    }}
                    maskColor="rgba(15, 23, 42, 0.7)"
                />
            </ReactFlow>
        </div>
    );
}

export default DependencyGraph;
