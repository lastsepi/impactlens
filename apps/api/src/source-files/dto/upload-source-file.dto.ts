
import {
    IsNotEmpty,
    IsString,
    Matches,
    MaxLength
} from "class-validator";

export class UploadSourceFileDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    @Matches(
        /^(?![A-Za-z]:[\\/])(?![\\/])(?!.*(?:^|[\\/])\.\.(?:[\\/]|$)).+$/,
        {
            message: "path must be a relative path without '..' segments."
        }
    )
    path!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    language!: string;
}
