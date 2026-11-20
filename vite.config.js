import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        // La API solo acepta CORS desde http://localhost:5173 (backend/TecnoHouse.Api/appsettings.json).
        // strictPort evita que Vite salte en silencio a 5174 si 5173 está ocupado.
        port: 5173,
        strictPort: true,
        // La API (.NET) no es parte del frontend; Visual Studio bloquea sus archivos de .vs, bin y obj.
        watch: { ignored: ["**/backend/**"] },
    },
});
