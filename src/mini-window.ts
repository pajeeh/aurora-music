type DocumentPictureInPicture={requestWindow(options:{width:number;height:number}):Promise<Window>};
type MiniPlayerRenderer=(container:HTMLElement)=>void|(()=>void);

declare global{interface Window{documentPictureInPicture?:DocumentPictureInPicture}}

export async function openMiniPlayer(render:MiniPlayerRenderer){
 if(window.documentPictureInPicture){
  const pip=await window.documentPictureInPicture.requestWindow({width:390,height:180});
  pip.document.title='Aurora Mini Player';pip.document.documentElement.style.cssText='width:100%;height:100%;margin:0;background:#0b0910';pip.document.body.style.cssText='width:100%;height:100%;margin:0;overflow:hidden';
  document.querySelectorAll('link[rel="stylesheet"],style').forEach(node=>pip.document.head.appendChild(node.cloneNode(true)));
  const container=pip.document.createElement('div');container.id='root';pip.document.body.appendChild(container);
  const unmount=render(container);if(unmount)pip.addEventListener('pagehide',unmount,{once:true});return;
 }
 window.open('./?mini=1','aurora-mini-player','popup,width=390,height=180,resizable=yes')?.focus();
}
