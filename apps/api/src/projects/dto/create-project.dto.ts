
import {
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    MinLength
} from "class-validator";

export class CreateProjectDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @IsOptional()
    @IsUrl()
    repositoryUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    primaryLanguage?: string;
}
