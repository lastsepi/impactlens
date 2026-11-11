
import type {
    DependencyGraph,
    GraphFilters
} from "../types/graph.types";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:3000/api/v1";

export async function getDependencyGraph(
    projectId: string,
    analysisRunId: string,
    filters: GraphFilters = {}
): Promise<DependencyGraph> {
    const params = new URLSearchParams();

    if (filters.search) {
        params.set("search", filters.search);
    }

    if (filters.kind) {
        params.set("kind", filters.kind);
    }

    if (filters.dependencyType) {
        params.set("dependencyType", filters.dependencyType);
    }

    if (filters.filePath) {
        params.set("filePath", filters.filePath);
    }

    const query = params.toString();

    const url =
        `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}` +
        `/analysis/${encodeURIComponent(analysisRunId)}/graph` +
        (query ? `?${query}` : "");

    const response = await fetch(url);

    if (!response.ok) {
        const message = await response.text();

        throw new Error(
            `Failed to fetch dependency graph (${response.status}): ${message}`
        );
    }

    return response.json() as Promise<DependencyGraph>;
}
