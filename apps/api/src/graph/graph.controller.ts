
import {
    Controller,
    Get,
    Param,
    ParseEnumPipe,
    ParseUUIDPipe,
    Query
} from "@nestjs/common";

import {
    DependencyType,
    SymbolKind
} from "../generated/prisma/client.js";

import { GraphService } from "./graph.service.js";

@Controller("projects/:projectId/analysis/:analysisRunId/graph")
export class GraphController {
    constructor(
        private readonly graphService: GraphService
    ) {}

    @Get()
    getDependencyGraph(
        @Param("projectId", ParseUUIDPipe) projectId: string,
        @Param("analysisRunId", ParseUUIDPipe) analysisRunId: string,
        @Query("search") search?: string,
        @Query(
            "kind",
            new ParseEnumPipe(SymbolKind, { optional: true })
        )
        kind?: SymbolKind,
        @Query(
            "dependencyType",
            new ParseEnumPipe(DependencyType, { optional: true })
        )
        dependencyType?: DependencyType,
        @Query("filePath") filePath?: string
    ) {
        return this.graphService.getDependencyGraph(
            projectId,
            analysisRunId,
            {
                search,
                kind,
                dependencyType,
                filePath
            }
        );
    }
}
