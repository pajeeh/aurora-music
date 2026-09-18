import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { Rooms } from './rooms.js';
export function createServer(rooms = new Rooms(), allowedOrigin = process.env.AURORA_ORIGIN) {
  const rates=new Map();
  const server=http.createServer(async(req,res)=>{
    const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
    try {
      const origin=req.headers.origin;
      if (origin && !(allowedOrigin ? origin===allowedOrigin : /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) return send(403,{error:'Origem não autorizada.'});
      const ip=req.socket.remoteAddress;
      const now=Date.now(); const rate=rates.get(ip);
      if (!rate || now-rate.start>60000) rates.set(ip,{start:now,count:1});
      else if (++rate.count>600) return send(429,{error:'Muitas solicitações. Tente novamente em um minuto.'});
      for (const [key,value] of rates) if (now-value.start>60000) rates.delete(key);
      const path=new URL(req.url,'http://localhost').pathname;
      if (req.method==='GET' && path==='/api/connect/health') return send(200,{ok:true});
      let body={};
      if (req.method==='POST') {
        if (!req.headers['content-type']?.startsWith('application/json')) return send(415,{error:'Use JSON.'});
        const chunks=[];let size=0;
        for await (const chunk of req) { size+=chunk.length;if(size>262144) return send(413,{error:'Solicitação muito grande.'});chunks.push(chunk); }
        try {body=JSON.parse(Buffer.concat(chunks).toString());} catch {return send(400,{error:'JSON inválido.'});}
      }
      if (req.method==='POST' && path==='/api/connect/rooms') return send(201,rooms.create(body.name,body.queue));
      const match=path.match(/^\/api\/connect\/rooms\/([\w-]{12})(?:\/(join|actions))?$/);
      if (!match) return send(404,{error:'Não encontrado.'});
      if (req.method==='POST' && match[2]==='join') return send(200,rooms.join(match[1],body.name));
      const token=req.headers.authorization?.match(/^Bearer ([\w-]+)$/)?.[1];
      if (req.method==='GET' && !match[2]) return send(200,rooms.read(match[1],token));
      if (req.method==='POST' && match[2]==='actions') return send(200,rooms.action(match[1],token,body));
      return send(405,{error:'Método não permitido.'});
    } catch(error) {send(error.status ?? 500,{error:error.status ? error.message : 'Falha no serviço.'});}
  });
  server.requestTimeout=15000;server.headersTimeout=10000;
  return server;
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  createServer().listen(Number(process.env.PORT || 8787),process.env.HOST || '127.0.0.1',()=>console.log('Aurora Connect pronto na porta '+(process.env.PORT || 8787)));
}
