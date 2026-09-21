import { describe, expect, it } from 'vitest'
import worker, { type Env } from './worker'

const withAssets = (contentType = 'text/html; charset=utf-8') => {
  const requests: string[] = []
  const env: Env = {
    ASSETS: {
      fetch: async (request) => {
        requests.push(new URL(request.url).pathname)
        return new Response('<!doctype html><title>asset</title>', { headers: { 'content-type': contentType } })
      },
    },
  }
  return { env, requests }
}

describe('WorkerのAI仕様と文書host', () => {
  it('rootのHTMLだけに画面非表示のAI仕様Linkヘッダーを付ける', async () => {
    const { env, requests } = withAssets()
    const response = await worker.fetch(new Request('https://kantan.snkisk.com/'), env)

    expect(requests).toEqual(['/'])
    expect(response.headers.get('link')).toContain('https://kantan.snkisk.com/llms.txt')
    expect(response.headers.get('link')).toContain('rel="alternate"')
  })

  it('文書hostのrootは人向け文書画面へ解決する', async () => {
    const { env, requests } = withAssets()
    const response = await worker.fetch(new Request('https://docs.kantan.snkisk.com/'), env)

    expect(requests).toEqual(['/docs'])
    expect(response.headers.get('link')).toBeNull()
  })

  it('root以外とHTML以外へAI仕様ヘッダーを広げない', async () => {
    const { env, requests } = withAssets('text/plain; charset=utf-8')
    const response = await worker.fetch(new Request('https://kantan.snkisk.com/llms.txt'), env)

    expect(requests).toEqual(['/llms.txt'])
    expect(response.headers.get('link')).toBeNull()
  })
})
