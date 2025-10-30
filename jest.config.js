module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/test"],
	testMatch: ["**/*.test.ts"],
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
	collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/types.ts"],
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},
	coverageReporters: ["text", "lcov", "html"],
};
