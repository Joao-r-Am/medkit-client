import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
      // Módulo virtual do build do Quasar: sem este alias nenhum boot file
      // (ex.: src/boot/axios.ts) pode ser importado em teste.
      "#q-app": resolve(import.meta.dirname, "src/__tests__/stubs/q-app.ts")
    }
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/__tests__/setup.ts"],
    globals: true
  }
});
