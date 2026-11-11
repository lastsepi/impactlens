import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma.module.js";
import { StorageModule } from "../storage/storage.module.js";

import { SourceFilesController } from "./source-files.controller.js";
import { SourceFilesService } from "./source-files.service.js";

@Module({
    imports: [
        PrismaModule,
        StorageModule
    ],
    controllers: [SourceFilesController],
    providers: [SourceFilesService]
})
export class SourceFilesModule {}