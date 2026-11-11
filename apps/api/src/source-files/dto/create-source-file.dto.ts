
import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    Max,
    MaxLength,
    Min
} from "class-validator";

export class CreateSourceFileDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    @Matches(
        /^(?![A-Za-z]:[\\/])(?![\\/])(?!.*(?:^|[\\/])\.\.(?:[\\/]|$)).+$/,
        { message: "path must be a relative path without '..' segments." }
    )
    path!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    language!: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(2147483647)
    sizeBytes?: number;

    @IsOptional()
    @IsString()
    @Matches(/^[a-fA-F0-9]{64}$/, {
        message: "contentHash must be a valid SHA-256 hash."
    })
    contentHash?: string;
}
