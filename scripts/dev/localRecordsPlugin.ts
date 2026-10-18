import { readFile, writeFile } from 'node:fs/promises';
import type { Plugin } from 'vite';
import {localConfig,localLifecycleRequest} from './lifecycleDatabase';

/** Private runtime-only copy: never in public/, source imports, or build output. */
export function localRecordsPlugin(): Plugin {
  return {
    name: 'sf-local-records',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__local-xero-sync',async(request,response)=>{
        const host=`127.0.0.1:${server.config.server.port}`;
        if(request.method!=='POST'||request.headers.host!==host||request.headers.origin!==`http://${host}`||request.headers['x-sf-local-records']!=='1'||!['127.0.0.1','::ffff:127.0.0.1'].includes(request.socket.remoteAddress||'')||request.headers['sec-fetch-site']!=='same-origin'){response.statusCode=403;response.end();return;}
        response.setHeader('Cache-Control','no-store');response.setHeader('Content-Type','application/json');
        try {
          let raw='';for await(const chunk of request){raw+=chunk;if(raw.length>4096)throw Error('Request too large');}
          const body=JSON.parse(raw);if(!['sync_status','sync_now','sync_acknowledge'].includes(body.action))throw Error('Preview review decisions are not saved to live Xero');
          if(body.action==='sync_now'){response.end(JSON.stringify({started:false}));return;}
          const config=await localConfig();const file=config.records.replace(/[^/]+$/,'local-xero-sync-status.json');
          const status=JSON.parse(await readFile(file,'utf8'));
          if(body.action==='sync_acknowledge'){status.reviews=status.reviews.filter((r:{review_key:string;fingerprint:string})=>r.review_key!==body.key||r.fingerprint!==body.fingerprint);await writeFile(file,JSON.stringify(status),{mode:0o600});}
          response.end(JSON.stringify(status));
        }catch{response.statusCode=503;response.end(JSON.stringify({error:'No copied sync status is available. The preview never contacts live Xero.'}));}
      });
      server.middlewares.use('/__local-lifecycle', async(request,response)=>{
        const host=`127.0.0.1:${server.config.server.port}`;
        if(request.method!=='POST'||request.headers.host!==host||request.headers.origin!==`http://${host}`||request.headers['x-sf-local-records']!=='1'||!['127.0.0.1','::ffff:127.0.0.1'].includes(request.socket.remoteAddress||'')||request.headers['sec-fetch-site']!=='same-origin'){response.statusCode=403;response.end();return;}
        response.setHeader('Cache-Control','no-store');response.setHeader('Content-Type','application/json');
        try{const chunks:Buffer[]=[];let size=0;for await(const chunk of request){size+=chunk.length;if(size>30*1024*1024)throw new Error('Request too large');chunks.push(Buffer.from(chunk));}const result=await localLifecycleRequest(JSON.parse(Buffer.concat(chunks).toString()));response.end(JSON.stringify(result));}
        catch(e){response.statusCode=400;response.end(JSON.stringify({error:e instanceof Error?e.message:'Local history operation failed'}));}
      });
      server.middlewares.use('/__local-documents',async(request,response)=>{
        const host=`127.0.0.1:${server.config.server.port}`;const id=request.url?.split('?')[0].replace(/^\//,'');
        if(request.method!=='GET'||request.headers.host!==host||!id||!/^[a-f0-9-]{36}$/i.test(id)||!['same-origin','none'].includes(request.headers['sec-fetch-site']||'')||!['127.0.0.1','::ffff:127.0.0.1'].includes(request.socket.remoteAddress||'')){response.statusCode=403;response.end();return;}
        try{const config=await localConfig();const map=JSON.parse(await readFile(config.documentMap,'utf8'));if(!map[id]){response.statusCode=404;response.end();return;}const content=await readFile(map[id]);response.setHeader('Cache-Control','no-store');response.setHeader('Content-Type','application/pdf');response.setHeader('Cross-Origin-Resource-Policy','same-origin');response.setHeader('X-Content-Type-Options','nosniff');response.end(content);}catch{response.statusCode=404;response.end();}
      });
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
