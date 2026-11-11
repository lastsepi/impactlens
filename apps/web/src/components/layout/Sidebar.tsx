
import {
    Activity,
    FolderKanban,
    GitBranch,
    ShieldCheck,
    Settings,
    Code2,
    ScanSearch
} from "lucide-react";

interface SidebarProps {
    activeItem: string;
    onNavigate: (item: string) => void;
}

const navigationItems = [
    {
        label: "Overview",
        icon: Activity
    },
    {
        label: "Projects",
        icon: FolderKanban
    },
    {
        label: "Dependency Graph",
        icon: GitBranch
    },
    {
        label: "Impact Analysis",
        icon: ScanSearch
    }
];

function Sidebar({
    activeItem,
    onNavigate
}: SidebarProps) {
    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-icon">
                    <ShieldCheck size={23} />
                </div>

                <div>
                    <h1>ImpactLens</h1>
                    <span>CODE INTELLIGENCE</span>
                </div>
            </div>

            <div className="sidebar-section">
                <span className="sidebar-section-title">
                    WORKSPACE
                </span>

                <nav className="sidebar-navigation">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.label}
                                type="button"
                                className={`sidebar-nav-item ${
                                    activeItem === item.label
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() => onNavigate(item.label)}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="sidebar-bottom">
                <button
                    type="button"
                    className="sidebar-nav-item"
                    onClick={() => onNavigate("Settings")}
                >
                    <Settings size={18} />
                    <span>Settings</span>
                </button>

                <a
                    className="sidebar-github"
                    href="https://github.com/lastsepi/impactlens"
                    target="_blank"
                    rel="noreferrer"
                >
                    <Code2 size={17} />
                    <span>GitHub Repository</span>
                </a>

                <div className="sidebar-version">
                    <span className="version-dot" />
                    <span>ImpactLens v0.1.0</span>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
