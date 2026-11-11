
import type {
    ImpactAnalysisResult
} from "../types/impact.types";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:3000/api/v1";

export async function getImpactAnalysis(
    projectId: string,
    analysisRunId: string,
    symbolId: string
): Promise<ImpactAnalysisResult> {
    const url =
        `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}` +
        `/analysis/${encodeURIComponent(analysisRunId)}` +
        `/impact/${encodeURIComponent(symbolId)}`;

    const response = await fetch(url);

    if (!response.ok) {
        const message = await response.text();

        throw new Error(
            `Failed to fetch impact analysis (${response.status}): ${message}`
        );
    }

    return response.json() as Promise<ImpactAnalysisResult>;
}
