import { readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';

/** Private runtime-only copy: never in public/, source imports, or build output. */
export function localRecordsPlugin(): Plugin {
  return {
    name: 'sf-local-records',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__local-records', async (request, response) => {
        const port = server.config.server.port;
        const expectedHost = `127.0.0.1:${port}`;
        const origin = request.headers.origin;
        const peer = request.socket.remoteAddress;
        if (request.method !== 'GET' || request.headers.host !== expectedHost || !['127.0.0.1', '::ffff:127.0.0.1'].includes(peer || '') || (origin && origin !== `http://${expectedHost}`) || request.headers['x-sf-local-records'] !== '1' || (request.headers['sec-fetch-site'] && request.headers['sec-fetch-site'] !== 'same-origin')) {
          response.statusCode = 403; response.end(); return;
        }
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
        response.setHeader('X-Content-Type-Options', 'nosniff');
        const file = process.env.SF_LOCAL_RECORDS_FILE;
        if (!file) { response.statusCode = 404; response.end(); return; }
        try {
          const content = await readFile(file, 'utf8');
          JSON.parse(content);
          response.setHeader('Content-Type', 'application/json');
          response.end(content);
        } catch { response.statusCode = 503; response.end(); }
      });
    },
  };
}
