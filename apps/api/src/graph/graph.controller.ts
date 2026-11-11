
import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe
} from "@nestjs/common";

import { GraphService } from "./graph.service.js";

@Controller("projects/:projectId/analysis/:analysisRunId/graph")
export class GraphController {
    constructor(
        private readonly graphService: GraphService
    ) {}

    @Get()
    getDependencyGraph(
        @Param("projectId", ParseUUIDPipe) projectId: string,
        @Param("analysisRunId", ParseUUIDPipe) analysisRunId: string
    ) {
        return this.graphService.getDependencyGraph(
            projectId,
            analysisRunId
        );
    }
}
