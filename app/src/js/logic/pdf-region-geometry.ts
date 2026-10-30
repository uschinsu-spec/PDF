export type CanvasRect = { x:number; y:number; w:number; h:number };
export type PdfBounds = { left:number; right:number; bottom:number; top:number };
export type AffineTransform = readonly [number,number,number,number,number,number];

/** Clamp a dragged canvas rectangle using rounded edges, not rounded width/height. */
export function clampCanvasRect(rect:CanvasRect,width:number,height:number):CanvasRect|null {
  const left=Math.max(0,Math.min(width,Math.floor(rect.x)));
  const top=Math.max(0,Math.min(height,Math.floor(rect.y)));
  const right=Math.max(0,Math.min(width,Math.ceil(rect.x+rect.w)));
  const bottom=Math.max(0,Math.min(height,Math.ceil(rect.y+rect.h)));
  if(right-left<1||bottom-top<1)return null;
  return{x:left,y:top,w:right-left,h:bottom-top};
}

/** Convert a PDF.js viewport pixel rectangle back into PDF user-space points. */
export function canvasRectToPdfBounds(rect:CanvasRect,transform:readonly number[]):PdfBounds {
  if(transform.length!==6||!transform.every(Number.isFinite))throw new Error('Invalid PDF viewport transform');
  const [a,b,c,d,e,f]=transform as AffineTransform;
  const determinant=a*d-b*c;
  if(!Number.isFinite(determinant)||Math.abs(determinant)<1e-12)throw new Error('PDF viewport transform is not invertible');
  const point=(x:number,y:number)=>{
    const dx=x-e,dy=y-f;
    return{x:(d*dx-c*dy)/determinant,y:(-b*dx+a*dy)/determinant};
  };
  const points=[point(rect.x,rect.y),point(rect.x+rect.w,rect.y),point(rect.x,rect.y+rect.h),point(rect.x+rect.w,rect.y+rect.h)];
  return{
    left:Math.min(...points.map(p=>p.x)),
    right:Math.max(...points.map(p=>p.x)),
    bottom:Math.min(...points.map(p=>p.y)),
    top:Math.max(...points.map(p=>p.y)),
  };
}

export function rectsIntersect(a:CanvasRect,b:CanvasRect):boolean {
  return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
}
