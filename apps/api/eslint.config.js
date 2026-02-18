import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";

export default defineConfig(
  globalIgnores(["dist", "test"]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ["src/**/*.ts"],
    plugins: { boundaries },
    settings: {
      "import/resolver": {
        typescript: { alwaysTryTypes: true },
      },
      "boundaries/flag-as-external": {
        customSourcePatterns: ["@todo/**"],
      },
      "boundaries/elements": [
        { type: "inbound", pattern: ["inbound"], mode: "folder" },
        { type: "outbound", pattern: ["outbound"], mode: "folder" },
        { type: "infrastructure", pattern: ["infrastructure"], mode: "folder" },
      ],
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            { from: ["inbound"], disallow: ["outbound", "infrastructure"] },
            { from: ["outbound"], disallow: ["inbound", "infrastructure"] },
          ],
        },
      ],
    },
  },
);
