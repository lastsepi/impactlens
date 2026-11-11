
import {
    Injectable,
    NotFoundException
} from "@nestjs/common";

import { PrismaService } from "../prisma.service.js";
import { CreateSourceFileDto } from "./dto/create-source-file.dto.js";

@Injectable()
export class SourceFilesService {
    constructor(
        private readonly prisma: PrismaService
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

        return {
            message: "Source file deleted successfully."
        };
    }
}
