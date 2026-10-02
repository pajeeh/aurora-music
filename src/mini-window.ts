type DocumentPictureInPicture={requestWindow(options:{width:number;height:number}):Promise<Window>};

declare global{interface Window{documentPictureInPicture?:DocumentPictureInPicture}}

export async function openMiniPlayer(){
 if(window.documentPictureInPicture){
  const pip=await window.documentPictureInPicture.requestWindow({width:390,height:180});
  pip.document.title='Aurora Mini Player';pip.document.documentElement.style.cssText='width:100%;height:100%;margin:0;background:#0b0910';pip.document.body.style.cssText='width:100%;height:100%;margin:0;overflow:hidden';
  const frame=pip.document.createElement('iframe');frame.title='Aurora Mini Player';frame.src='./?mini=1';frame.allow='autoplay';frame.style.cssText='width:100%;height:100%;border:0;display:block';pip.document.body.appendChild(frame);return;
 }
 window.open('./?mini=1','aurora-mini-player','popup,width=390,height=180,resizable=yes')?.focus();
}
