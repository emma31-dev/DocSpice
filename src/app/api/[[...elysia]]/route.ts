import { app } from '../elysia'

// Next's App Router passes the full request URL (e.g. /api/elysia/auth/...).
// Elysia app is mounted with routes like `/auth` so we need to strip the
// `/api/elysia` prefix before forwarding the request to `app.fetch`.

async function proxy(request: Request) {
  const url = new URL(request.url)

  // remove the leading /api or /api/elysia segment so Elysia routes match
  const strippedPath = url.pathname.replace(/^\/api(\/elysia)?/, '') || '/'

  const forwardedUrl = new URL(url.toString())
  forwardedUrl.pathname = strippedPath

  // Build a new Request forwarding method, headers, body
  const forwarded = new Request(forwardedUrl.toString() + url.search, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    duplex: 'half'
  } as RequestInit)

  return app.fetch(forwarded)
}

export const GET = (req: Request) => proxy(req)
export const POST = (req: Request) => proxy(req)
export const DELETE = (req: Request) => proxy(req)
export const PATCH = (req: Request) => proxy(req)

// REQUESTS ARE PROXIED ABOVE