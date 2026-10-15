#!/usr/bin/env python3
"""check_overlap: every label box (shrunk 18% top and bottom) sampled every 1.5 px against every drawing element with
isPointInFill (if fill visible) / isPointInStroke (if stroke visible). data-bg, data-panel and data-patch are not geometry.
A label may only touch lines that share its data-dim. A data-patch must not reach geometry (other than its own dim lines)
or any other label: 'patch-covers-label'. Prints the count; must be 0."""
import json, sys
import chromecheck

JS = r"""
function vis(c){return c && c!=='none' && !/rgba\(.*,\s*0\)$/.test(c);}
function hits(el,pt){
 const cs=getComputedStyle(el);
 if(vis(cs.fill) && parseFloat(cs.fillOpacity)>0 && el.isPointInFill(pt)) return true;
 if(vis(cs.stroke) && parseFloat(cs.strokeWidth)>0 && el.isPointInStroke(pt)) return true;
 return false;
}
function scan(svg, box, geo, skipDim, file, kind, label, out){
 const STEP=1.5; const pt=svg.createSVGPoint();
 const inv=svg.getScreenCTM().inverse();
 for(const g of geo){
  if(skipDim!==null && g.getAttribute('data-dim')===skipDim) continue;
  const gb=g.getBoundingClientRect(); const pad=(parseFloat(getComputedStyle(g).strokeWidth)||0)+1;
  if(gb.right+pad<box.x0||gb.left-pad>box.x1||gb.bottom+pad<box.y0||gb.top-pad>box.y1) continue;
  let found=false;
  for(let y=box.y0;y<=box.y1&&!found;y+=STEP)for(let x=box.x0;x<=box.x1&&!found;x+=STEP){
   pt.x=x;pt.y=y; const p=pt.matrixTransform(inv); const q=svg.createSVGPoint(); q.x=p.x;q.y=p.y;
   const m=g.getCTM(); const lp=m? q.matrixTransform(svg.getCTM().inverse().multiply(m).inverse()):q;
   if(hits(g,lp)) found=true;
  }
  if(found) out.push({file,kind,label,element:g.outerHTML.slice(0,120)});
 }
}
function check(){
 const out=[];
 document.querySelectorAll('div.f').forEach(div=>{
  const file=div.dataset.file, svg=div.querySelector('svg');
  const geo=[...svg.querySelectorAll('rect,line,polygon,polyline,circle,ellipse,path')].filter(e=>
    !e.hasAttribute('data-bg')&&!e.hasAttribute('data-panel')&&!e.hasAttribute('data-patch'));
  const texts=[...svg.querySelectorAll('text')];
  texts.forEach(t=>{
   const r=t.getBoundingClientRect(); const sh=r.height*0.18;
   scan(svg,{x0:r.left,x1:r.right,y0:r.top+sh,y1:r.bottom-sh},geo,t.getAttribute('data-dim'),file,'label-on-geometry',t.textContent,out);
  });
  svg.querySelectorAll('[data-patch]').forEach(p=>{
   const n=p.getAttribute('data-patch'); const r=p.getBoundingClientRect();
   const box={x0:r.left,x1:r.right,y0:r.top,y1:r.bottom};
   scan(svg,box,geo,n,file,'patch-on-geometry','patch '+n,out);
   texts.forEach(t=>{ if(t.getAttribute('data-dim')===n) return;
     const b=t.getBoundingClientRect(); const sh=b.height*0.18;
     if(b.left<box.x1&&box.x0<b.right&&b.top+sh<box.y1&&box.y0<b.bottom-sh) out.push({file,kind:'patch-covers-label',label:t.textContent,patch:n});});
  });
 });
 return out;
}"""

def overlaps(files):
    return chromecheck.run(files, JS)

def main(argv):
    files = chromecheck.collect(argv)
    if not files:
        print('no svg files', file=sys.stderr); return 2
    issues = overlaps(files)
    for i in issues: print(json.dumps(i, ensure_ascii=False), file=sys.stderr)
    print(len(issues))
    return 1 if issues else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
