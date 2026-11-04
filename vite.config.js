import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5180 },
  // Freeze the copyright year to the build so the prerendered HTML and the first client render agree;
  // Footer moves it to the visitor current year in an effect. Avoids an every-page hydration mismatch
  // at a year boundary (a Date read during render).
  define: { __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()) }
});
