export interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const isDocumentationHost = url.hostname === 'docs.kantan.snkisk.com'
    const assetRequest = isDocumentationHost && (url.pathname === '/' || url.pathname === '/index.html')
      ? new Request(new URL('/docs', url), request)
      : request
    const response = await env.ASSETS.fetch(assetRequest)

    if (url.hostname !== 'kantan.snkisk.com' || url.pathname !== '/' || !response.headers.get('content-type')?.includes('text/html')) return response

    const headers = new Headers(response.headers)
    headers.append('Link', '<https://kantan.snkisk.com/llms.txt>; rel="alternate"; type="text/plain"; title="Kantan AI print-link specification"')
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
  },
}
