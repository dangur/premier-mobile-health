/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

/**
 * Vite's React refresh preamble is an inline script, so the strict policy
 * stays in index.html for the built page and is removed only while developing.
 */
function stripCspInDev(): Plugin {
  return {
    name: "strip-csp-in-dev",
    transformIndexHtml(html, ctx) {
      if (!ctx.server) return html
      return html.replace(
        /\s*<meta http-equiv="Content-Security-Policy"[^>]*>\s*/i,
        "\n",
      )
    },
  }
}

export default defineConfig({
  // Relative asset paths so the built page works on GitHub Pages and locally.
  base: "./",
  plugins: [react(), stripCspInDev()],
  test: {
    environment: "node",
  },
})
