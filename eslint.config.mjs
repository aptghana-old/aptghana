import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Ignore Next.js build output in any app workspace
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/next-env.d.ts",
  ]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      // React Compiler plugin ships with eslint-config-next but the compiler itself
      // is not enabled in this project — suppress its lint errors.
      "react-compiler/react-compiler": "off",
      // react-hooks v6 added this rule; all flagged patterns use React 18 automatic
      // batching and are intentional setState-in-effect resets.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
