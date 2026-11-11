
import {
    GitBranch,
    Play,
    RefreshCw,
    ChevronDown
} from "lucide-react";

import type {
    Project,
    AnalysisRun
} from "../../services/project.service";

interface HeaderProps {
    activeItem: string;
    projects: Project[];
    analysisRuns: AnalysisRun[];
    selectedProjectId: string;
    selectedAnalysisRunId: string;
    loading: boolean;
    analyzing: boolean;
    onProjectChange: (projectId: string) => void;
    onAnalysisChange: (analysisRunId: string) => void;
    onCreateAnalysis: () => void;
    onRefresh: () => void;
}

function Header({
    activeItem,
    projects,
    analysisRuns,
    selectedProjectId,
    selectedAnalysisRunId,
    loading,
    analyzing,
    onProjectChange,
    onAnalysisChange,
    onCreateAnalysis,
    onRefresh
}: HeaderProps) {
    const selectedProject = projects.find(
        project => project.id === selectedProjectId
    );

    const selectedAnalysis = analysisRuns.find(
        run => run.id === selectedAnalysisRunId
    );

    const pageDescriptions: Record<string, string> = {
        Overview: "Your codebase intelligence at a glance.",
        Projects: "Manage and explore your codebase projects.",
        "Dependency Graph": "Explore relationships and dependencies across your codebase.",
        "Impact Analysis": "Understand what could be affected by your code changes."
    };

    return (
        <header className="dashboard-header">
            <div className="header-title">
                <div className="header-breadcrumb">
                    <GitBranch size={15} />
                    <span>Workspace</span>
                    <span>/</span>
                    <span>{activeItem}</span>
                </div>

                <h2>{activeItem}</h2>

                <p>
                    {pageDescriptions[activeItem] ??
                        "Explore your workspace."}
                </p>
            </div>

            <div className="header-actions">
                <div className="header-select-group">
                    <label>PROJECT</label>

                    <div className="header-select">
                        <select
                            value={selectedProjectId}
                            onChange={event =>
                                onProjectChange(event.target.value)
                            }
                            disabled={loading || projects.length === 0}
                        >
                            <option value="">Select Project</option>

                            {projects.map(project => (
                                <option
                                    key={project.id}
                                    value={project.id}
                                >
                                    {project.name}
                                </option>
                            ))}
                        </select>

                        <ChevronDown size={15} />
                    </div>
                </div>

                <div className="header-select-group">
                    <label>ANALYSIS RUN</label>

                    <div className="header-select">
                        <select
                            value={selectedAnalysisRunId}
                            onChange={event =>
                                onAnalysisChange(event.target.value)
                            }
                            disabled={
                                loading ||
                                !selectedProjectId ||
                                analysisRuns.length === 0
                            }
                        >
                            <option value="">Select Analysis</option>

                            {analysisRuns.map(run => (
                                <option
                                    key={run.id}
                                    value={run.id}
                                >
                                    {new Date(run.createdAt).toLocaleString()}
                                    {" - "}
                                    {run.status}
                                </option>
                            ))}
                        </select>

                        <ChevronDown size={15} />
                    </div>
                </div>

                <button
                    type="button"
                    className="header-refresh-button"
                    onClick={onRefresh}
                    disabled={loading}
                    title="Refresh data"
                >
                    <RefreshCw
                        size={16}
                        className={loading ? "spinning" : ""}
                    />
                </button>

                <button
                    type="button"
                    className="header-analyze-button"
                    onClick={onCreateAnalysis}
                    disabled={!selectedProject || analyzing}
                >
                    <Play size={15} />
                    {analyzing ? "Analyzing..." : "New Analysis"}
                </button>
            </div>

            {selectedAnalysis?.status === "FAILED" && (
                <div className="header-analysis-error">
                    Latest selected analysis failed.
                </div>
            )}
        </header>
    );
}

export default Header;
