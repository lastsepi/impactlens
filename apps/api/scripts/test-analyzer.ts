
import { SymbolExtractorService } from "../src/analyzer/symbol-extractor.service.js";

const sourceCode = `
class UserService {
    constructor() {
        this.name = "ImpactLens";
    }

    updateName() {
        this.name = "New Name";
    }
}
`;

const extractor = new SymbolExtractorService();

const result = extractor.extract(
    sourceCode,
    "test.js"
);

console.log("Extracted Symbols:");
console.table(result.symbols);

console.log("Errors:");
console.log(result.errors);
