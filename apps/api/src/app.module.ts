
import { Module } from "@nestjs/common";

import { AppController } from "./app.controller.js";
import { PrismaModule } from "./prisma.module.js";
import { ProjectsModule } from "./projects/projects.module.js";
import { SourceFilesModule } from "./source-files/source-files.module.js";
import { AnalyzerModule } from "./analyzer/analyzer.module.js";
import { AnalysisModule } from "./analysis/analysis.module.js";
import { ImpactModule } from "./impact/impact.module.js";

@Module({
    imports: [
        PrismaModule,
        ProjectsModule,
        SourceFilesModule,
        AnalyzerModule,
        AnalysisModule,
        ImpactModule
    ],
    controllers: [AppController]
})
export class AppModule {}
