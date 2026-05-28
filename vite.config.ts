/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import gasPlugin from "@gas-plugin/unplugin/vite";

export default defineConfig({
  plugins: [
    gasPlugin({
      manifest: "src/appsscript.json",
    }),
  ],
  build: {
    lib: {
      entry: "src/main.ts",
      formats: ["es"],
      fileName: () => "Code.js",
    },
    outDir: "dist",
    rollupOptions: {
      output: {
        entryFileNames: "Code.js",
      },
    },
  },
  test: {
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/appsscript.json"],
      reporter: ["text", "html", "lcov"],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
