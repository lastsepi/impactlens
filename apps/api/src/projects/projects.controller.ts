
import { UpdateProjectDto } from "./dto/update-project.dto.js";
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Patch
} from "@nestjs/common";

import { ProjectsService } from "./projects.service.js";
import { CreateProjectDto } from "./dto/create-project.dto.js";

@Controller("projects")
export class ProjectsController {
    constructor(
        private readonly projectsService: ProjectsService
    ) {}

    @Post()
    create(@Body() dto: CreateProjectDto) {
        return this.projectsService.create(dto);
    }

    @Get()
    findAll() {
        return this.projectsService.findAll();
    }

    @Get(":id")
    findOne(@Param("id", new ParseUUIDPipe()) id: string) {
        return this.projectsService.findOne(id);
    }
    
    @Patch(":id")
    update(
        @Param("id", new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateProjectDto
    ) {
        return this.projectsService.update(id, dto);
    }

    @Delete(":id")
    remove(@Param("id", new ParseUUIDPipe()) id: string) {
        return this.projectsService.remove(id);
    }
}
