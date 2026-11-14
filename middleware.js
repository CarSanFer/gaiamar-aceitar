// Acesso por senha única (sem utilizador) · Vercel Edge Middleware
// Senha na variável de ambiente do projeto Vercel: SITE_PASSWORD
export const config = { matcher: ['/((?!robots.txt).*)'] };

const COOKIE = 'gaiamar_acesso';
const DIAS = 30;

async function token(pw) {
  const data = new TextEncoder().encode('gaiamar:' + pw);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function pagina(erro) {
  return `<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Gaiamar · Acesso Reservado</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#16202b;font-family:Calibri,"Segoe UI",Arial,sans-serif;font-size:10pt;line-height:1.5;color:#e7ebf0}
form{background:#1e2a38;border:1px solid #34465a;border-radius:8px;padding:24px 28px;width:min(360px,90vw)}
h1{font-size:10pt;margin:0 0 6pt;font-weight:700}
p{margin:0 0 12pt;color:#aab6c3}
input{width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #34465a;border-radius:6px;background:#16202b;color:#e7ebf0;font:inherit;margin-bottom:10pt}
button{width:100%;padding:8px;border:0;border-radius:6px;background:#C8A96E;color:#1a1a1a;font:inherit;font-weight:700;cursor:pointer}
.err{color:#f2a0a0;margin:0 0 8pt}
</style></head><body>
<form method="post" autocomplete="off">
<h1>Condomínio Gaiamar Residence · Diagnóstico de Patologias</h1>
<p>Acesso reservado · Aceitar Inspect</p>
${erro ? '<p class="err">Senha incorreta.</p>' : ''}
<input type="password" name="senha" placeholder="Senha" autofocus required>
<button type="submit">Entrar</button>
</form></body></html>`;
}

export default async function middleware(request) {
  const senha = process.env.SITE_PASSWORD || '';
  if (!senha) return new Response('Senha não configurada', { status: 503 });
  const esperado = await token(senha);
  const cookies = request.headers.get('cookie') || '';
  const m = cookies.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([a-f0-9]+)'));
  if (m && m[1] === esperado) return;

  const html = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' };
  if (request.method === 'POST') {
    let tentativa = '';
    try { tentativa = (await request.formData()).get('senha') || ''; } catch (e) {}
    if (tentativa === senha) {
      const url = new URL(request.url);
      return new Response(null, { status: 303, headers: {
        'Location': url.pathname + url.search,
        'Set-Cookie': `${COOKIE}=${esperado}; Path=/; Max-Age=${DIAS * 86400}; HttpOnly; Secure; SameSite=Lax`,
        'Cache-Control': 'no-store' } });
    }
    return new Response(pagina(true), { status: 401, headers: html });
  }
  return new Response(pagina(false), { status: 401, headers: html });
}
