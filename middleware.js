// Proteção por senha (HTTP Basic Auth) · Vercel Edge Middleware
// Credenciais nas variáveis de ambiente do projeto Vercel: BASIC_AUTH_USER e BASIC_AUTH_PASS
export const config = { matcher: ['/((?!robots.txt).*)'] };

export default function middleware(request) {
  const user = process.env.BASIC_AUTH_USER || '';
  const pass = process.env.BASIC_AUTH_PASS || '';
  const auth = request.headers.get('authorization') || '';
  if (user && pass && auth.startsWith('Basic ')) {
    try {
      const [u, p] = atob(auth.slice(6)).split(':');
      if (u === user && p === pass) return;
    } catch (e) {}
  }
  return new Response('Acesso reservado · Aceitar Inspect', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Gaiamar", charset="UTF-8"', 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
