import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    port: 6065
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: true,
    port: 6065
  },
});
