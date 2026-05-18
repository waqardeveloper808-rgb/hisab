import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "artifact/**",
    "artifacts/**",
    "archive/**",
    "qa_reports/**",
    "chatgpt-analysis-export/**",
    "backend/vendor/**",
    "backend/node_modules/**",
    "backend/public/build/**",
    "backend/storage/**",
    "backend/bootstrap/cache/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
