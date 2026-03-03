import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    allowedHosts: ["zanotti.iliadboxos.it"],
    port: 6065
  },
   preview: {
    allowedHosts: ["zanotti.iliadboxos.it"],
  },
});
