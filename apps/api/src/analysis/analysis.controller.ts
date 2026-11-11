
import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post
} from "@nestjs/common";

import { AnalysisService } from "./analysis.service.js";

@Controller("projects/:projectId/analysis")
export class AnalysisController {
    constructor(
        private readonly analysisService: AnalysisService
    ) {}

    @Post()
    analyzeProject(
        @Param("projectId", ParseUUIDPipe) projectId: string
    ) {
        return this.analysisService.analyzeProject(projectId);
    }

    @Get(":analysisRunId/symbols")
    getAnalysisSymbols(
        @Param("projectId", ParseUUIDPipe) projectId: string,
        @Param("analysisRunId", ParseUUIDPipe) analysisRunId: string
    ) {
        return this.analysisService.getAnalysisSymbols(
            projectId,
            analysisRunId
        );
    }
}
