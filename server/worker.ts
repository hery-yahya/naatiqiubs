/**
 * Pintu masuk aplikasi di Cloudflare Workers.
 *
 * - Alamat yang diawali /api/ diteruskan ke fungsi server (memanggil Gemini).
 * - Alamat lain dilayani dari file tampilan (folder dist).
 */

import { Env, json, PagesContext } from './gemini';
import { onRequestGet as status } from './routes/status';
import { onRequestPost as ttsGenerate } from './routes/tts-generate';
import { onRequestPost as ttsCompareAll } from './routes/tts-compare-all';
import { onRequestPost as aiTashkeel } from './routes/ai-tashkeel';
import { onRequestPost as aiGenerateScript } from './routes/ai-generate-script';
import { onRequestPost as aiEnhanceFusha } from './routes/ai-enhance-fusha';

type Handler = (ctx: PagesContext) => Promise<Response>;

const ROUTES: Record<string, { method: 'GET' | 'POST'; handler: Handler }> = {
  '/api/status': { method: 'GET', handler: status },
  '/api/tts/generate': { method: 'POST', handler: ttsGenerate },
  '/api/tts/compare-all': { method: 'POST', handler: ttsCompareAll },
  '/api/ai/tashkeel': { method: 'POST', handler: aiTashkeel },
  '/api/ai/generate-script': { method: 'POST', handler: aiGenerateScript },
  '/api/ai/enhance-fusha': { method: 'POST', handler: aiEnhanceFusha },
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    const path = pathname.replace(/\/+$/, '') || '/';

    if (path.startsWith('/api/')) {
      const route = ROUTES[path];
      if (!route) {
        return json({ success: false, error: 'Alamat API tidak ditemukan.', code: 'NOT_FOUND' }, 404);
      }
      if (request.method !== route.method) {
        return json({ success: false, error: 'Metode tidak diizinkan.', code: 'METHOD_NOT_ALLOWED' }, 405);
      }
      return route.handler({ request, env });
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('Not found', { status: 404 });
  },
};
