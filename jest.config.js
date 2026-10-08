module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	watchman: false,
	roots: ["<rootDir>/bot/test", "<rootDir>/db/test"],
	testMatch: ["**/*.test.ts"],
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
	collectCoverageFrom: [
		"bot/src/**/*.ts",
		"web/src/**/*.ts",
		"db/src/**/*.ts",
		"!**/*.d.ts",
	],
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
