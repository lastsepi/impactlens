const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:3000/api/v1";

export interface Project {
    id: string;
    name: string;
    description: string | null;
    repositoryUrl: string | null;
    primaryLanguage: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProjectDto {
    name: string;
    description?: string;
    repositoryUrl?: string;
    primaryLanguage?: string;
}

export type UpdateProjectDto = Partial<CreateProjectDto>;

export interface AnalysisRun {
    id: string;
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
    analyzerVersion: string;
    filesScanned: number;
    startedAt: string | null;
    finishedAt: string | null;
    createdAt: string;
    errorMessage: string | null;
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const message = await response.text();
        throw new Error(
            message || `Request failed (${response.status})`
        );
    }

    return response.json() as Promise<T>;
}

export async function getProjects(): Promise<Project[]> {
    const response = await fetch(`${API_BASE_URL}/projects`);
    return handleResponse<Project[]>(response);
}

export async function getProject(id: string): Promise<Project> {
    const response = await fetch(
        `${API_BASE_URL}/projects/${encodeURIComponent(id)}`
    );

    return handleResponse<Project>(response);
}

export async function createProject(
    dto: CreateProjectDto
): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dto)
    });

    return handleResponse<Project>(response);
}

export async function updateProject(
    id: string,
    dto: UpdateProjectDto
): Promise<Project> {
    const response = await fetch(
        `${API_BASE_URL}/projects/${encodeURIComponent(id)}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dto)
        }
    );

    return handleResponse<Project>(response);
}

export async function deleteProject(id: string): Promise<void> {
    const response = await fetch(
        `${API_BASE_URL}/projects/${encodeURIComponent(id)}`,
        {
            method: "DELETE"
        }
    );

    if (!response.ok) {
        const message = await response.text();
        throw new Error(
            message || `Failed to delete project (${response.status})`
        );
    }
}

export async function getAnalysisRuns(
    projectId: string
): Promise<AnalysisRun[]> {
    const response = await fetch(
        `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/analysis`
    );

    const result = await handleResponse<{
        total: number;
        runs: AnalysisRun[];
    }>(response);

    return result.runs;
}

export async function createAnalysis(
    projectId: string
): Promise<AnalysisRun> {
    const response = await fetch(
        `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/analysis`,
        {
            method: "POST"
        }
    );

    return handleResponse<AnalysisRun>(response);
}