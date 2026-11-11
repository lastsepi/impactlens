
import type {
    GraphNode
} from "../types/graph.types";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:3000/api/v1";

export interface AnalysisSymbolsResponse {
    analysisRunId: string;
    totalSymbols: number;
    symbols: GraphNode[];
}

export async function getAnalysisSymbols(
    projectId: string,
    analysisRunId: string
): Promise<AnalysisSymbolsResponse> {
    const url =
        `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}` +
        `/analysis/${encodeURIComponent(analysisRunId)}/symbols`;

    const response = await fetch(url);

    if (!response.ok) {
        const message = await response.text();

        throw new Error(
            `Failed to fetch analysis symbols (${response.status}): ${message}`
        );
    }

    return response.json() as Promise<AnalysisSymbolsResponse>;
}
