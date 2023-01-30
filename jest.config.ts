import type { JestConfigWithTsJest } from "ts-jest";
import { defaultsESM } from "ts-jest/presets";

const transform = defaultsESM.transform;

for (const key in transform) {
    const transformConfig = transform[key];
    if (typeof transformConfig === "string") {
        continue;
    }
    transformConfig[1].tsconfig = "tsconfig.spec.json";
}

const config: JestConfigWithTsJest = {
    preset: "ts-jest/presets/default-esm",
    ...defaultsESM,
    transform,
    testPathIgnorePatterns: ["/compiled/.*", "/src/.*"],
    testRegex: "/spec/.*\\.(test|spec)\\.(ts|tsx|js)$",
    modulePathIgnorePatterns: ["models"],
    moduleFileExtensions: ["ts", "tsx", "js"],
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "/test/",
        "/spec/utils/rxtest.ts",
    ],
};

export default config;
