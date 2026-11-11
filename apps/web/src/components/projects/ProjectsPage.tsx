
import { useState, type FormEvent } from "react";
import {
    FolderKanban,
    Plus,
    Pencil,
    Trash2,
    ExternalLink,
    Code2,
    X,
    Save
} from "lucide-react";

import {
    createProject,
    updateProject,
    deleteProject,
    type Project,
    type CreateProjectDto
} from "../../services/project.service";

interface ProjectsPageProps {
    projects: Project[];
    onProjectsChanged: () => Promise<void>;
    onOpenProject?: (project: Project) => void;
}

const emptyForm: CreateProjectDto = {
    name: "",
    description: "",
    repositoryUrl: "",
    primaryLanguage: ""
};

function ProjectsPage({
    projects,
    onProjectsChanged,
    onOpenProject
}: ProjectsPageProps) {
    const [form, setForm] = useState<CreateProjectDto>(emptyForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(false);
        setError("");
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (form.name.trim().length < 2) {
            setError("Project name must contain at least 2 characters.");
            return;
        }

        setSaving(true);
        setError("");

        const payload: CreateProjectDto = {
            name: form.name.trim(),
            description: form.description?.trim() || undefined,
            repositoryUrl: form.repositoryUrl?.trim() || undefined,
            primaryLanguage: form.primaryLanguage?.trim() || undefined
        };

        try {
            if (editingId) {
                await updateProject(editingId, payload);
            } else {
                await createProject(payload);
            }

            await onProjectsChanged();
            resetForm();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (project: Project) => {
        setForm({
            name: project.name,
            description: project.description ?? "",
            repositoryUrl: project.repositoryUrl ?? "",
            primaryLanguage: project.primaryLanguage ?? ""
        });

        setEditingId(project.id);
        setShowForm(true);
        setError("");
    };

    const handleDelete = async (project: Project) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        setDeletingId(project.id);
        setError("");

        try {
            await deleteProject(project.id);
            await onProjectsChanged();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete project."
            );
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <section className="projects-page">
            <div className="projects-page-header">
                <div>
                    <span className="page-eyebrow">WORKSPACE</span>
                    <h2>Projects</h2>
                    <p>
                        Manage your codebases and inspect their dependencies.
                    </p>
                </div>

                <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                        resetForm();
                        setShowForm(true);
                    }}
                >
                    <Plus size={18} />
                    New Project
                </button>
            </div>

            {error && (
                <div className="projects-error">
                    {error}
                </div>
            )}

            {showForm && (
                <form
                    className="project-form"
                    onSubmit={handleSubmit}
                >
                    <div className="project-form-header">
                        <div>
                            <h3>
                                {editingId ? "Edit Project" : "Create Project"}
                            </h3>
                            <p>
                                Enter your project's information below.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="icon-button"
                            onClick={resetForm}
                            disabled={saving}
                            aria-label="Close form"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="project-form-grid">
                        <label className="project-field">
                            <span>Project Name *</span>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        name: event.target.value
                                    })
                                }
                                minLength={2}
                                maxLength={100}
                                required
                                placeholder="e.g. My Application"
                            />
                        </label>

                        <label className="project-field">
                            <span>Primary Language</span>
                            <input
                                type="text"
                                value={form.primaryLanguage ?? ""}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        primaryLanguage: event.target.value
                                    })
                                }
                                maxLength={50}
                                placeholder="e.g. TypeScript"
                            />
                        </label>

                        <label className="project-field project-field-full">
                            <span>Repository URL</span>
                            <input
                                type="url"
                                value={form.repositoryUrl ?? ""}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        repositoryUrl: event.target.value
                                    })
                                }
                                placeholder="https://github.com/user/repository"
                            />
                        </label>

                        <label className="project-field project-field-full">
                            <span>Description</span>
                            <textarea
                                value={form.description ?? ""}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        description: event.target.value
                                    })
                                }
                                maxLength={2000}
                                rows={4}
                                placeholder="Describe your project..."
                            />
                        </label>
                    </div>

                    <div className="project-form-actions">
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={resetForm}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={saving}
                        >
                            <Save size={17} />
                            {saving
                                ? "Saving..."
                                : editingId
                                    ? "Save Changes"
                                    : "Create Project"}
                        </button>
                    </div>
                </form>
            )}

            <div className="projects-section-heading">
                <div>
                    <h3>All Projects</h3>
                    <span>{projects.length} projects</span>
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="projects-empty">
                    <div className="projects-empty-icon">
                        <FolderKanban size={30} />
                    </div>
                    <h3>No projects yet</h3>
                    <p>
                        Create your first project to start analyzing
                        code dependencies.
                    </p>
                    <button
                        type="button"
                        className="primary-button"
                        onClick={() => setShowForm(true)}
                    >
                        <Plus size={18} />
                        Create First Project
                    </button>
                </div>
            ) : (
                <div className="projects-grid">
                    {projects.map((project) => (
                        <article
                            className="project-card"
                            key={project.id}
                        >
                            <div className="project-card-top">
                                <div className="project-card-icon">
                                    <FolderKanban size={21} />
                                </div>

                                <div className="project-card-actions">
                                    <button
                                        type="button"
                                        className="icon-button"
                                        title="Edit project"
                                        onClick={() => handleEdit(project)}
                                    >
                                        <Pencil size={16} />
                                    </button>

                                    <button
                                        type="button"
                                        className="icon-button danger"
                                        title="Delete project"
                                        disabled={deletingId === project.id}
                                        onClick={() => handleDelete(project)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3>{project.name}</h3>

                            <p className="project-card-description">
                                {project.description ||
                                    "No description provided."}
                            </p>

                            <div className="project-card-meta">
                                {project.primaryLanguage && (
                                    <span>
                                        <Code2 size={14} />
                                        {project.primaryLanguage}
                                    </span>
                                )}

                                {project.repositoryUrl && (
                                    <a
                                        href={project.repositoryUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(event) => event.stopPropagation()}
                                    >
                                        <ExternalLink size={14} />
                                        Repository
                                    </a>
                                )}
                            </div>

                            <div className="project-card-footer">
                                <span>
                                    Created{" "}
                                    {new Date(
                                        project.createdAt
                                    ).toLocaleDateString()}
                                </span>

                                <button
                                    type="button"
                                    className="project-open-button"
                                    onClick={() => onOpenProject?.(project)}
                                >
                                    Open Project
                                    <ExternalLink size={14} />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

export default ProjectsPage;
