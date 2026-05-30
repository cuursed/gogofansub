export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Si es la ruta del proxy, procesar la consulta a Supabase
    if (url.pathname === '/api/query') {
      const supabaseUrl = env.SUPABASE_URL || 'https://nlicistnosjzynobqbvr.supabase.co';
      const supabaseAnonKey = env.SUPABASE_ANON_KEY || 'sb_publishable_pVyt7zA5ap9dNf40ZoyYGg_tCptxdAm';

      if (!supabaseUrl || !supabaseAnonKey) {
        return new Response(
          JSON.stringify({ error: "Las variables de entorno de Supabase no están configuradas." }),
          { 
            status: 500, 
            headers: { 
              "Content-Type": "application/json", 
              "Access-Control-Allow-Origin": "*" 
            } 
          }
        );
      }

      const path = url.searchParams.get("path");
      if (!path) {
        return new Response(
          JSON.stringify({ error: "Falta el parámetro de consulta 'path' obligatorio." }),
          { 
            status: 400, 
            headers: { "Content-Type": "application/json" } 
          }
        );
      }

      const targetUrl = `${supabaseUrl}/rest/v1/${path}`;
      const headers = new Headers(request.headers);
      headers.set("apikey", supabaseAnonKey);
      headers.set("Authorization", `Bearer ${supabaseAnonKey}`);

      try {
        const response = await fetch(targetUrl, {
          method: request.method,
          headers: headers,
          body: request.method !== "GET" && request.method !== "HEAD" ? await request.text() : undefined
        });

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Error en el proxy de Cloudflare Workers: " + err.message }),
          { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
          }
        );
      }
    }

    // Para cualquier otra ruta, servir el archivo estático correspondiente usando env.ASSETS
    return env.ASSETS.fetch(request);
  }
};
