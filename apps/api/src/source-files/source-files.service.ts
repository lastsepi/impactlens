
import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger
} from "@nestjs/common";

import { createHash } from "node:crypto";

import { Prisma } from "../generated/prisma/client.js";

import { PrismaService } from "../prisma.service.js";
import { StorageService } from "../storage/storage.service.js";

import { CreateSourceFileDto } from "./dto/create-source-file.dto.js";
import { UploadSourceFileDto } from "./dto/upload-source-file.dto.js";
type UploadedSourceFile = {
    buffer: Buffer;
    size: number;
};
@Injectable()
export class SourceFilesService {
    private readonly logger = new Logger(SourceFilesService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService
    ) {}

    async create(projectId: string, dto: CreateSourceFileDto) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true }
        });

        if (!project) {
            throw new NotFoundException("Project not found.");
        }

        return this.prisma.sourceFile.create({
            data: {
                projectId,
                path: dto.path,
                language: dto.language,
                sizeBytes: dto.sizeBytes,
                contentHash: dto.contentHash
            }
        });
    }
    async upload(
        projectId: string,
        dto: UploadSourceFileDto,
        file: UploadedSourceFile
    ) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true }
        });
    
        if (!project) {
            throw new NotFoundException("Project not found.");
        }
    
        const existingFile = await this.prisma.sourceFile.findUnique({
            where: {
                projectId_path: {
                    projectId,
                    path: dto.path
                }
            },
            select: { id: true }
        });
    
        if (existingFile) {
            throw new ConflictException(
                "A source file with this path already exists."
            );
        }
    
        const contentHash = createHash("sha256")
            .update(file.buffer)
            .digest("hex");
    
        const storageKey = await this.storage.save(
            projectId,
            file.buffer
        );
    
        try {
            return await this.prisma.sourceFile.create({
                data: {
                    projectId,
                    path: dto.path,
                    language: dto.language,
                    sizeBytes: file.size,
                    contentHash,
                    storageKey
                }
            });
        } catch (error) {
            try {
                await this.storage.delete(projectId, storageKey);
            } catch {
                // Preserve the original database error.
            }
    
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
            ) {
                throw new ConflictException(
                    "A source file with this path already exists."
                );
            }
    
            throw error;
        }
    }
    async findAll(projectId: string) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true }
        });

        if (!project) {
            throw new NotFoundException("Project not found.");
        }

        return this.prisma.sourceFile.findMany({
            where: { projectId },
            orderBy: {
                path: "asc"
            }
        });
    }

    async findOne(projectId: string, fileId: string) {
        const file = await this.prisma.sourceFile.findFirst({
            where: {
                id: fileId,
                projectId
            }
        });

        if (!file) {
            throw new NotFoundException("Source file not found.");
        }

        return file;
    }

    async remove(projectId: string, fileId: string) {
        const file = await this.findOne(projectId, fileId);
    
        await this.prisma.sourceFile.delete({
            where: { id: file.id }
        });
    
        if (file.storageKey) {
            try {
                await this.storage.delete(
                    projectId,
                    file.storageKey
                );
            } catch (error) {
                this.logger.error(
                    `Failed to delete physical file: ${file.storageKey}`,
                    error instanceof Error ? error.stack : String(error)
                );
            }
        }
    
        return {
            message: "Source file deleted successfully."
        };
    }}
