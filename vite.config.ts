import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportOnFailure: true,
    },
    projects: [
      {
        plugins: [react()],
        test: {
          name: "frontend",
          include: ["tests/src/**/*.test.{ts,tsx}"],
          environment: "jsdom",
          globals: true,
          setupFiles: ["./tests/setup/setup.frontend.ts"],
        },
      },
      {
        test: {
          name: "backend",
          include: ["tests/amplify/**/*.test.ts"],
          environment: "node",
          globals: true,
        },
      },
      {
        test: {
          name: "shared",
          include: ["tests/shared/**/*.test.ts"],
          environment: "node",
          globals: true,
        },
      },
    ],
  },
});
