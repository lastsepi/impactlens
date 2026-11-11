import {
    BadRequestException,
    UploadedFile,
    UseInterceptors
} from "@nestjs/common";
import { extname } from "node:path";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";

import { UploadSourceFileDto } from "./dto/upload-source-file.dto.js";
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
@Post("upload")
@UseInterceptors(
    FileInterceptor("file", {
        storage: memoryStorage(),
        limits: {
            fileSize: 5 * 1024 * 1024,
            files: 1
        },
   
    })
)
upload(
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() dto: UploadSourceFileDto,
    @UploadedFile()
    file: {
        buffer: Buffer;
        size: number;
        originalname: string;
    } | undefined) {
    if (!file || file.size === 0) {
        throw new BadRequestException("A non-empty file is required.");
    }
    const allowedExtensions = new Set([
        ".ts", ".tsx",
        ".js", ".jsx",
        ".mjs", ".cjs",
        ".json",
        ".html", ".css", ".scss",
        ".py",
        ".java",
        ".cs",
        ".cpp", ".c", ".h", ".hpp",
        ".go",
        ".rs",
        ".php",
        ".rb",
        ".sql",
        ".vue",
        ".svelte"
    ]);
    
    const extension = extname(file.originalname).toLowerCase();
    
    if (!allowedExtensions.has(extension)) {
        throw new BadRequestException(
            "Unsupported source file extension."
        );
    }
    return this.sourceFilesService.upload(
        projectId,
        dto,
        file
    );
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
