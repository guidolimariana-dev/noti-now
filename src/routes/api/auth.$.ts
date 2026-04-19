import { createFileRoute } from "@tanstack/react-router";
import { getAuth } from "@/lib/auth";
import { env } from "cloudflare:workers";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const auth = getAuth(env);
          return await auth.handler(request);
        } catch (e) {
          console.error("Auth Handler Error (GET):", e);
          return new Response("Internal Server Error", { status: 500 });
        }
      },
      POST: async ({ request }) => {
        try {
          const auth = getAuth(env);
          const response = await auth.handler(request);
          
          if (response.ok) {
            return response;
          }

          // Convertimos el error 401 (u otros) a 400 para evitar el crash del bridge de Vite/Cloudflare en dev.
          const data = await response.json().catch(() => ({ message: "Authentication failed" }));
          
          return new Response(JSON.stringify(data), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error("Auth Handler Error (POST):", e);
          return new Response(JSON.stringify({ message: "Internal Server Error" }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      },
    },
  },
});
