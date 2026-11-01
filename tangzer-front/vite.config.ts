/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// En dev, le front appelle l'API et le WebSocket sur sa propre origine :
// Vite relaie /api et /ws vers le backend Spring (comme nginx en Docker).
const backend = process.env.BACKEND_URL ?? "http://localhost:8080";

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            "/api": { target: backend, changeOrigin: true },
            "/ws": { target: backend, ws: true, changeOrigin: true },
        },
    },
    test: {
        environment: "node",
        // tokens.test.ts lit le vrai contenu de tokens.css (les autres CSS restent ignorés).
        css: { include: [/tokens\.css/] },
    },
});
