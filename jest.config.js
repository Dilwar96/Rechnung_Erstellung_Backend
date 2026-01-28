export default {
  // Test-Umgebung auf Node setzen
  testEnvironment: "node",

  // ES-Module-Unterstützung aktivieren
  transform: {},

  // Test-Dateien Pattern
  testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).js"],

  // Coverage-Einstellungen
  collectCoverageFrom: [
    "controllers/**/*.js",
    "middleware/**/*.js",
    "models/**/*.js",
    "!**/node_modules/**",
  ],

  // Timeout für Tests erhöhen (DB-Operationen können länger dauern)
  testTimeout: 10000,

  // Module Directories
  moduleDirectories: ["node_modules", "<rootDir>"],

  // Verbose Output
  verbose: true,
};
