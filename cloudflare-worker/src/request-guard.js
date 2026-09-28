export async function boundedForward(request,url,maxBytes=131072){
  const declared=Number(request.headers.get('Content-Length')??0);
  if(Number.isFinite(declared)&&declared>maxBytes)return null;
  if(request.method!=='POST')return new Request(url,request);
  const body=await request.arrayBuffer();
  if(body.byteLength>maxBytes)return null;
  return new Request(url,{method:'POST',headers:request.headers,body});
}
