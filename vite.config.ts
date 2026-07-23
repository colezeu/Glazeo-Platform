import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from "node:url"

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "auth-gateway": fileURLToPath(
        new URL(
          mode === "e2e"
            ? "./src/auth/MockAuthGateway.ts"
            : "./src/auth/SupabaseAuthGateway.ts",
          import.meta.url,
        ),
      ),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
}))
