
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Post
} from "@nestjs/common";

import { SourceFilesService } from "./source-files.service.js";
import { CreateSourceFileDto } from "./dto/create-source-file.dto.js";

@Controller("projects/:projectId/files")
export class SourceFilesController {
    constructor(
        private readonly sourceFilesService: SourceFilesService
    ) {}

    @Post()
    create(
        @Param("projectId", new ParseUUIDPipe()) projectId: string,
        @Body() dto: CreateSourceFileDto
    ) {
        return this.sourceFilesService.create(projectId, dto);
    }

    @Get()
    findAll(
        @Param("projectId", new ParseUUIDPipe()) projectId: string
    ) {
        return this.sourceFilesService.findAll(projectId);
    }

    @Get(":fileId")
    findOne(
        @Param("projectId", new ParseUUIDPipe()) projectId: string,
        @Param("fileId", new ParseUUIDPipe()) fileId: string
    ) {
        return this.sourceFilesService.findOne(projectId, fileId);
    }

    @Delete(":fileId")
    remove(
        @Param("projectId", new ParseUUIDPipe()) projectId: string,
        @Param("fileId", new ParseUUIDPipe()) fileId: string
    ) {
        return this.sourceFilesService.remove(projectId, fileId);
    }
}
