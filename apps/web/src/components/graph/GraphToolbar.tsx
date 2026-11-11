
import {
    Search,
    RotateCcw,
    Filter
} from "lucide-react";

import type {
    DependencyType,
    GraphFilters,
    SymbolKind
} from "../../types/graph.types";

interface GraphToolbarProps {
    filters: GraphFilters;
    onFiltersChange: (filters: GraphFilters) => void;
}

const symbolKinds: SymbolKind[] = [
    "CLASS",
    "METHOD",
    "FUNCTION",
    "INTERFACE",
    "ENUM",
    "PROPERTY",
    "FIELD",
    "VARIABLE",
    "CONSTRUCTOR",
    "MODULE",
    "TYPE_ALIAS"
];

const dependencyTypes: DependencyType[] = [
    "CALLS",
    "IMPORTS",
    "EXTENDS",
    "IMPLEMENTS",
    "REFERENCES",
    "READS",
    "WRITES",
    "USES"
];

function GraphToolbar({
    filters,
    onFiltersChange
}: GraphToolbarProps) {
    function updateFilter<K extends keyof GraphFilters>(
        key: K,
        value: GraphFilters[K] | undefined
    ) {
        onFiltersChange({
            ...filters,
            [key]: value
        });
    }

    function resetFilters() {
        onFiltersChange({});
    }

    return (
        <div className="graph-toolbar">
            <div className="graph-search">
                <Search size={16} />

                <input
                    type="text"
                    placeholder="Search symbols..."
                    value={filters.search ?? ""}
                    onChange={(event) =>
                        updateFilter("search", event.target.value || undefined)
                    }
                />
            </div>

            <div className="graph-filter">
                <Filter size={15} />

                <select
                    value={filters.kind ?? ""}
                    onChange={(event) =>
                        updateFilter(
                            "kind",
                            event.target.value
                                ? event.target.value as SymbolKind
                                : undefined
                        )
                    }
                >
                    <option value="">All Symbol Types</option>

                    {symbolKinds.map((kind) => (
                        <option key={kind} value={kind}>
                            {kind}
                        </option>
                    ))}
                </select>
            </div>

            <div className="graph-filter">
                <select
                    value={filters.dependencyType ?? ""}
                    onChange={(event) =>
                        updateFilter(
                            "dependencyType",
                            event.target.value
                                ? event.target.value as DependencyType
                                : undefined
                        )
                    }
                >
                    <option value="">All Dependencies</option>

                    {dependencyTypes.map((type) => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
            </div>

            <button
                type="button"
                className="graph-reset-button"
                onClick={resetFilters}
                title="Reset filters"
            >
                <RotateCcw size={15} />
                Reset
            </button>
        </div>
    );
}

export default GraphToolbar;
