import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import noRawDesignValues from "./eslint-rules/no-raw-design-values.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // §15.1 — see eslint-rules/no-raw-design-values.mjs's own docstring.
    plugins: { local: { rules: { "no-raw-design-values": noRawDesignValues } } },
    rules: { "local/no-raw-design-values": "error" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
