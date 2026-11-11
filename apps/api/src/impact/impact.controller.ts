
import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe
} from "@nestjs/common";

import { ImpactService } from "./impact.service.js";

@Controller("projects/:projectId/analysis/:analysisRunId/impact")
export class ImpactController {
    constructor(
        private readonly impactService: ImpactService
    ) {}

    @Get(":symbolId")
    analyzeImpact(
        @Param("projectId", ParseUUIDPipe)
        projectId: string,

        @Param("analysisRunId", ParseUUIDPipe)
        analysisRunId: string,

        @Param("symbolId", ParseUUIDPipe)
        symbolId: string
    ) {
        return this.impactService.analyzeImpact(
            projectId,
            analysisRunId,
            symbolId
        );
    }
}
