import { UpdateProjectDto } from "./dto/update-project.dto.js";
import {
    Injectable,
    NotFoundException
} from "@nestjs/common";

import { PrismaService } from "../prisma.service.js";
import { CreateProjectDto } from "./dto/create-project.dto.js";

@Injectable()
export class ProjectsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateProjectDto) {
        return this.prisma.project.create({
            data: {
                name: dto.name,
                description: dto.description,
                repositoryUrl: dto.repositoryUrl,
                primaryLanguage: dto.primaryLanguage
            }
        });
    }

    async findAll() {
        return this.prisma.project.findMany({
            orderBy: {
                createdAt: "desc"
            }
        });
    }

    async findOne(id: string) {
        const project = await this.prisma.project.findUnique({
            where: { id }
        });

        if (!project) {
            throw new NotFoundException("Project not found.");
        }

        return project;
    }

    async update(id: string, dto: UpdateProjectDto) {
        await this.findOne(id);
    
        return this.prisma.project.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                repositoryUrl: dto.repositoryUrl,
                primaryLanguage: dto.primaryLanguage
            }
        });
    }
    
    async remove(id: string) {
        const project = await this.findOne(id);

        await this.prisma.project.delete({
            where: { id: project.id }
        });

        return {
            message: "Project deleted successfully."
        };
    }
}
