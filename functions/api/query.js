export async function onRequest(context) {
  const { request, env } = context;

  // Intentar obtener de las variables de Cloudflare, o usar las credenciales de servidor seguras (no visibles en el navegador)
  const supabaseUrl = env.SUPABASE_URL || 'https://nlicistnosjzynobqbvr.supabase.co';
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || 'sb_publishable_pVyt7zA5ap9dNf40ZoyYGg_tCptxdAm';

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({
        error: "Las variables de entorno de Supabase no están configuradas."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }

  // Obtener la ruta de destino (ej: rpc/login_admin o novels) pasada como parámetro
  const url = new URL(request.url);
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

  // Construir la URL destino de Supabase PostgREST
  const targetUrl = `${supabaseUrl}/rest/v1/${path}`;

  // Clonar las cabeceras e inyectar las credenciales de Supabase
  const headers = new Headers(request.headers);
  headers.set("apikey", supabaseAnonKey);
  headers.set("Authorization", `Bearer ${supabaseAnonKey}`);

  try {
    // Realizar la petición proxy a Supabase
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? await request.text() : undefined
    });

    // Retornar la respuesta obtenida de Supabase al navegador
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        "Access-Control-Allow-Origin": "*" // Soporte CORS básico
      }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Error en el proxy de Cloudflare Pages: " + err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
