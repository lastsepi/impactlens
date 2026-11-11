
import { Module } from "@nestjs/common";

import { SymbolExtractorService } from "./symbol-extractor.service.js";
import { DependencyExtractorService } from "./dependency-extractor.service.js";

@Module({
    providers: [
        SymbolExtractorService,
        DependencyExtractorService
    ],
    exports: [
        SymbolExtractorService,
        DependencyExtractorService
    ]
})
export class AnalyzerModule {}
