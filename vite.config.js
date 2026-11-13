import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        // La API (.NET) no es parte del frontend; Visual Studio bloquea sus archivos de .vs, bin y obj.
        watch: { ignored: ["**/backend/**"] },
    },
});
