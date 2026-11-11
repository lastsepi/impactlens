import {
    Injectable,
    InternalServerErrorException
} from "@nestjs/common";
import { readFile } from "node:fs/promises";
import {
    mkdir,
    unlink,
    writeFile
} from "node:fs/promises";

import { randomUUID } from "node:crypto";

import {
    resolve,
    relative,
    isAbsolute,
    sep
} from "node:path";


@Injectable()
export class StorageService {
    private readonly storageRoot = resolve(
        process.cwd(),
        "../../storage",
        "source-files"
    );

    async save(
        projectId: string,
        buffer: Buffer
    ): Promise<string> {
        const storageKey = `${projectId}/${randomUUID()}`;

        const absolutePath = this.resolveStoragePath(storageKey);

        try {
            await mkdir(
                this.storageRoot,
                { recursive: true }
            );

            const projectDirectory = resolve(
                this.storageRoot,
                projectId
            );

            await mkdir(
                projectDirectory,
                { recursive: true }
            );

            await writeFile(absolutePath, buffer, {
                flag: "wx"
            });

            return storageKey;
        } catch {
            throw new InternalServerErrorException(
                "Unable to store source file."
            );
        }
    }
    async read(projectId: string, storageKey: string): Promise<Buffer> {
        if (!storageKey.startsWith(`${projectId}/`)) {
            throw new Error("Invalid storage key.");
        }
    
        const absolutePath = this.resolveStoragePath(storageKey);
    
        try {
            return await readFile(absolutePath);
        } catch {
            throw new InternalServerErrorException(
                "Unable to read source file."
            );
        }
    }
    async delete(
        projectId: string,
        storageKey: string
    ): Promise<void> {
        if (!storageKey.startsWith(`${projectId}/`)) {
            throw new Error("Invalid storage key.");
        }
    
        const absolutePath = this.resolveStoragePath(storageKey);
    
        try {
            await unlink(absolutePath);
        } catch (error) {
            if (
                error instanceof Error &&
                "code" in error &&
                (error as NodeJS.ErrnoException).code === "ENOENT"
            ) {
                return;
            }
    
            throw new InternalServerErrorException(
                "Unable to delete source file."
            );
        }
    }
    private resolveStoragePath(storageKey: string): string {
        const normalizedKey = storageKey.replace(
            /[\\/]+/g,
            sep
        );

        const absolutePath = resolve(
            this.storageRoot,
            normalizedKey
        );

        const relativePath = relative(
            this.storageRoot,
            absolutePath
        );

        if (
            !relativePath ||
            relativePath.startsWith(`..${sep}`) ||
            relativePath === ".." ||
            isAbsolute(relativePath)
        ) {
            throw new Error("Invalid storage key.");
        }

        return absolutePath;
    }
}

