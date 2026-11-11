import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { PrismaModule } from "./prisma.module.js";
import { ProjectsModule } from "./projects/projects.module.js";
import { SourceFilesModule } from "./source-files/source-files.module.js";
@Module({
    imports: [
        PrismaModule,
        ProjectsModule,
        SourceFilesModule
    ],
    controllers: [AppController]
})
export class AppModule {}