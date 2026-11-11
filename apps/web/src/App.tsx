
import { useCallback, useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

import GraphToolbar from "./components/graph/GraphToolbar";
import DependencyGraph from "./components/graph/DependencyGraph";
import SymbolDetails from "./components/graph/SymbolDetails";
import ProjectsPage from "./components/projects/ProjectsPage";
import ImpactAnalysisPage from "./components/impact/ImpactAnalysisPage";

import {
    getDependencyGraph
} from "./services/graph.service";

import {
    getProjects,
    getAnalysisRuns,
    createAnalysis,
    type Project,
    type AnalysisRun
} from "./services/project.service";

import type {
    DependencyGraph as DependencyGraphData,
    GraphFilters,
    GraphNode
} from "./types/graph.types";

function App() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [analysisRuns, setAnalysisRuns] = useState<AnalysisRun[]>([]);

    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [selectedAnalysisRunId, setSelectedAnalysisRunId] = useState("");

    const [graph, setGraph] = useState<DependencyGraphData | null>(null);
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

    const [filters, setFilters] = useState<GraphFilters>({});

    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState("Overview");
    const loadProjects = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await getProjects();

            setProjects(result);

            setSelectedProjectId(current =>
                result.some(project => project.id === current)
                    ? current
                    : result[0]?.id ?? ""
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load projects."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadProjects();
    }, [loadProjects]);

    useEffect(() => {
        if (!selectedProjectId) {
            setAnalysisRuns([]);
            setSelectedAnalysisRunId("");
            setGraph(null);
            return;
        }

        let cancelled = false;

        async function loadAnalysisRuns() {
            setLoading(true);
            setError(null);
            setGraph(null);
            setSelectedNode(null);
            setSelectedAnalysisRunId("");

            try {
                const runs = await getAnalysisRuns(selectedProjectId);

                if (cancelled) return;

                setAnalysisRuns(runs);

                const latestRun =
                    runs.find(run => run.status === "COMPLETED") ??
                    runs[0];

                setSelectedAnalysisRunId(latestRun?.id ?? "");
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load analysis runs."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadAnalysisRuns();

        return () => {
            cancelled = true;
        };
    }, [selectedProjectId]);

    useEffect(() => {
        if (!selectedProjectId || !selectedAnalysisRunId) {
            setGraph(null);
            return;
        }

        const selectedRun = analysisRuns.find(
            run => run.id === selectedAnalysisRunId
        );

        if (selectedRun && selectedRun.status !== "COMPLETED") {
            setGraph(null);
            return;
        }

        let cancelled = false;

        async function loadGraph() {
            setLoading(true);
            setError(null);
            setSelectedNode(null);

            try {
                const result = await getDependencyGraph(
                    selectedProjectId,
                    selectedAnalysisRunId,
                    filters
                );

                if (!cancelled) {
                    setGraph(result);
                }
            } catch (err) {
                if (!cancelled) {
                    setGraph(null);
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load dependency graph."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadGraph();

        return () => {
            cancelled = true;
        };
    }, [
        selectedProjectId,
        selectedAnalysisRunId,
        analysisRuns,
        filters
    ]);

    function handleProjectChange(projectId: string) {
        setSelectedProjectId(projectId);
        setFilters({});
        setSelectedNode(null);
    }

    async function handleCreateAnalysis() {
        if (!selectedProjectId) return;

        setAnalyzing(true);
        setError(null);

        try {
            const result = await createAnalysis(selectedProjectId);
            const runs = await getAnalysisRuns(selectedProjectId);

            setAnalysisRuns(runs);
            setSelectedAnalysisRunId(result.id);
            setFilters({});
            setSelectedNode(null);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Analysis failed."
            );
        } finally {
            setAnalyzing(false);
        }
    }

    const handleRefresh = useCallback(() => {
        void loadProjects();
    }, [loadProjects]);

    async function handleProjectsChanged() {
        await loadProjects();
    }

    function handleOpenProject(project: Project) {
        setSelectedProjectId(project.id);
        setActiveItem("Dependency Graph");
        setFilters({});
        setSelectedNode(null);
    }
    const totalAnalyses = projects.reduce(
      (total, project) => total + (
          project.id === selectedProjectId
              ? analysisRuns.length
              : 0
      ),
      0
  );
  
  const completedAnalyses = analysisRuns.filter(
      run => run.status === "COMPLETED"
  ).length;
  
  const failedAnalyses = analysisRuns.filter(
      run => run.status === "FAILED"
  ).length;
  
  const latestAnalysis = analysisRuns[0] ?? null;
  

    return (
        <div className="app-shell">
            <Sidebar
                activeItem={activeItem}
                onNavigate={setActiveItem}
            />

<main className="main-content">
    <Header
        activeItem={activeItem}
        projects={projects}
        analysisRuns={analysisRuns}
        selectedProjectId={selectedProjectId}
        selectedAnalysisRunId={selectedAnalysisRunId}
        loading={loading}
        analyzing={analyzing}
        onProjectChange={handleProjectChange}
        onAnalysisChange={setSelectedAnalysisRunId}
        onCreateAnalysis={handleCreateAnalysis}
        onRefresh={handleRefresh}
    />

                {activeItem === "Projects" ? (
                    <ProjectsPage
                        projects={projects}
                        onProjectsChanged={handleProjectsChanged}
                        onOpenProject={handleOpenProject}
                    />
                    ) : activeItem === "Overview" ? (
                      <section className="overview-page">
                          <div className="overview-hero">
                              <div>
                                  <span className="overview-eyebrow">
                                      CODE INTELLIGENCE PLATFORM
                                  </span>
                  
                                  <h1>
                                      Welcome to <span>ImpactLens</span>
                                  </h1>
                  
                                  <p>
                                      Understand your codebase. Discover dependencies.
                                      Predict the impact of every change.
                                  </p>
                              </div>
                  
                              <button
                                  type="button"
                                  className="overview-primary-button"
                                  onClick={() => setActiveItem("Projects")}
                              >
                                  Explore Projects
                              </button>
                          </div>
                  
                          <div className="overview-section-heading">
                              <div>
                                  <h2>Workspace Overview</h2>
                                  <p>Your codebase at a glance</p>
                              </div>
                          </div>
                  
                          <div className="overview-stats-grid">
                              <div className="overview-stat-card">
                                  <span className="overview-stat-icon">◈</span>
                                  <span className="overview-stat-label">Total Projects</span>
                                  <strong>{projects.length}</strong>
                                  <small>Projects in your workspace</small>
                              </div>
                  
                              <div className="overview-stat-card">
                                  <span className="overview-stat-icon">⌘</span>
                                  <span className="overview-stat-label">Total Analyses</span>
                                  <strong>{totalAnalyses}</strong>
                                  <small>Analyses for selected project</small>
                              </div>
                  
                              <div className="overview-stat-card">
                                  <span className="overview-stat-icon">✓</span>
                                  <span className="overview-stat-label">Completed</span>
                                  <strong>{completedAnalyses}</strong>
                                  <small>Successful analysis runs</small>
                              </div>
                  
                              <div className="overview-stat-card">
                                  <span className="overview-stat-icon">!</span>
                                  <span className="overview-stat-label">Failed</span>
                                  <strong>{failedAnalyses}</strong>
                                  <small>Failed analysis runs</small>
                              </div>
                          </div>
                  
                          <div className="overview-content-grid">
                              <div className="overview-panel">
                                  <div className="overview-panel-header">
                                      <div>
                                          <h2>Recent Projects</h2>
                                          <p>Your latest workspace projects</p>
                                      </div>
                  
                                      <button
                                          type="button"
                                          onClick={() => setActiveItem("Projects")}
                                      >
                                          View All →
                                      </button>
                                  </div>
                  
                                  {projects.length === 0 ? (
                                      <div className="overview-empty">
                                          <h3>No projects yet</h3>
                                          <p>Create your first project to get started.</p>
                                      </div>
                                  ) : (
                                      <div className="overview-project-list">
                                          {projects.slice(0, 4).map(project => (
                                              <div
                                                  className="overview-project-item"
                                                  key={project.id}
                                              >
                                                  <div className="overview-project-icon">
                                                      ◈
                                                  </div>
                  
                                                  <div className="overview-project-info">
                                                      <strong>{project.name}</strong>
                                                      <span>
                                                          {project.primaryLanguage || "Unknown language"}
                                                      </span>
                                                  </div>
                  
                                                  <button
                                                      type="button"
                                                      onClick={() => handleOpenProject(project)}
                                                  >
                                                      Open →
                                                  </button>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                  
                              <div className="overview-panel overview-analysis-panel">
                                  <div className="overview-panel-header">
                                      <div>
                                          <h2>Latest Analysis</h2>
                                          <p>Selected project activity</p>
                                      </div>
                                  </div>
                  
                                  {latestAnalysis ? (
                                      <div className="overview-latest-analysis">
                                          <span className="overview-analysis-label">
                                              ANALYSIS STATUS
                                          </span>
                  
                                          <strong className={`analysis-status-${latestAnalysis.status.toLowerCase()}`}>
                                              {latestAnalysis.status}
                                          </strong>
                  
                                          <div className="overview-analysis-details">
                                              <div>
                                                  <span>Files Scanned</span>
                                                  <strong>{latestAnalysis.filesScanned}</strong>
                                              </div>
                  
                                              <div>
                                                  <span>Analyzer Version</span>
                                                  <strong>{latestAnalysis.analyzerVersion}</strong>
                                              </div>
                                          </div>
                  
                                          <button
                                              type="button"
                                              onClick={() => setActiveItem("Dependency Graph")}
                                              disabled={latestAnalysis.status !== "COMPLETED"}
                                          >
                                              View Dependency Graph →
                                          </button>
                                      </div>
                                  ) : (
                                      <div className="overview-empty">
                                          <h3>No analysis available</h3>
                                          <p>
                                              Select a project and run your first analysis.
                                          </p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </section>
                ) : activeItem === "Dependency Graph" ? (
                    <section className="dashboard-content">
                        <div className="graph-stats">
                            <div className="stat-card">
                                <span>Total Symbols</span>
                                <strong>
                                    {graph?.totalNodes ?? 0}
                                </strong>
                            </div>

                            <div className="stat-card">
                                <span>Dependencies</span>
                                <strong>
                                    {graph?.totalEdges ?? 0}
                                </strong>
                            </div>

                            <div className="stat-card">
                                <span>Selected Project</span>
                                <strong className="stat-project-name">
                                    {projects.find(
                                        project => project.id === selectedProjectId
                                    )?.name ?? "No project"}
                                </strong>
                            </div>

                            <div className="stat-card">
                                <span>Analysis Status</span>
                                <strong className="stat-status">
                                    {analysisRuns.find(
                                        run => run.id === selectedAnalysisRunId
                                    )?.status ?? "N/A"}
                                </strong>
                            </div>
                        </div>

                        <div className="graph-workspace">
                            <div className="graph-main-panel">
                                <GraphToolbar
                                    filters={filters}
                                    onFiltersChange={setFilters}
                                />

                                <div className="graph-canvas">
                                    {loading ? (
                                        <div className="graph-message">
                                            <div className="loading-spinner" />
                                            <h3>Loading dependency graph...</h3>
                                            <p>Retrieving project information.</p>
                                        </div>
                                    ) : error ? (
                                        <div className="graph-message error">
                                            <h3>Something went wrong</h3>
                                            <p>{error}</p>

                                            <button
                                                type="button"
                                                onClick={handleRefresh}
                                            >
                                                Try Again
                                            </button>
                                        </div>
                                    ) : !selectedProjectId ? (
                                        <div className="graph-message">
                                            <h3>No Projects Found</h3>
                                            <p>
                                                Create a project and upload source files
                                                to get started.
                                            </p>
                                        </div>
                                    ) : !selectedAnalysisRunId ? (
                                        <div className="graph-message">
                                            <h3>No Analysis Available</h3>
                                            <p>
                                                Run a new analysis to generate
                                                your dependency graph.
                                            </p>
                                        </div>
                                    ) : !graph ? (
                                        <div className="graph-message">
                                            <h3>No Graph Data</h3>
                                            <p>
                                                No dependency graph is available
                                                for this analysis.
                                            </p>
                                        </div>
                                    ) : graph.nodes.length === 0 ? (
                                        <div className="graph-message">
                                            <h3>No Matching Symbols</h3>
                                            <p>
                                                Try changing your search or filters.
                                            </p>
                                        </div>
                                    ) : (
                                        <DependencyGraph
                                            graph={graph}
                                            onNodeSelect={setSelectedNode}
                                        />
                                    )}
                                </div>

                                <div className="graph-footer">
                                    <span>
                                        <span className="status-indicator" />
                                        Static Analysis
                                    </span>

                                    <span>
                                        {graph
                                            ? `${graph.totalNodes} nodes · ${graph.totalEdges} edges`
                                            : "Waiting for graph data"}
                                    </span>
                                </div>
                            </div>

                            <SymbolDetails
                                node={selectedNode}
                                onClose={() => setSelectedNode(null)}
                            />
                        </div>
                    </section>
                ) : activeItem === "Impact Analysis" ? (
                    <ImpactAnalysisPage
                        projectId={selectedProjectId}
                        analysisRunId={selectedAnalysisRunId}
                    />
                ) : (
                    <section className="dashboard-content">
                        <div className="graph-message">
                            <h3>{activeItem}</h3>
                            <p>
                                This section is not available yet.
                            </p>
                        </div>
                    </section>
                )}
            </main>                            
        </div>
    );
}

export default App;
