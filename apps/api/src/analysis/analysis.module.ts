
import { Module } from "@nestjs/common";

import { AnalysisService } from "./analysis.service.js";
import { AnalysisController } from "./analysis.controller.js";
import { AnalyzerModule } from "../analyzer/analyzer.module.js";
import { StorageModule } from "../storage/storage.module.js";

@Module({
    imports: [
        AnalyzerModule,
        StorageModule
    ],
    controllers: [AnalysisController],
    providers: [AnalysisService],
    exports: [AnalysisService]
})
export class AnalysisModule {}
