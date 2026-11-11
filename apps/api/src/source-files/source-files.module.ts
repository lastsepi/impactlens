
import { Module } from "@nestjs/common";

import { SourceFilesController } from "./source-files.controller.js";
import { SourceFilesService } from "./source-files.service.js";

@Module({
    controllers: [SourceFilesController],
    providers: [SourceFilesService]
})
export class SourceFilesModule {}
