#!/usr/bin/env python3
"""measure_labels: drawn size = computed font-size x sqrt(|det getScreenCTM|) < 10.67 is flagged;
also text-vs-text overlap and text-vs-frame (outside the SVG viewport). Prints the count; must be 0."""
import json, sys
import chromecheck

MIN_DRAWN = 10.67
JS = r"""
function check(){
 const out=[];
 document.querySelectorAll('div.f').forEach(div=>{
  const file=div.dataset.file, svg=div.querySelector('svg'), fr=svg.getBoundingClientRect();
  const texts=[...svg.querySelectorAll('text')];
  const boxes=[];
  texts.forEach((t,i)=>{
   const m=t.getScreenCTM(); const det=Math.abs(m.a*m.d-m.b*m.c);
   const fs=parseFloat(getComputedStyle(t).fontSize); const drawn=fs*Math.sqrt(det);
   if(drawn < %MIN% - 1e-9) out.push({file,kind:'size',text:t.textContent,drawn:+drawn.toFixed(2)});
   const r=t.getBoundingClientRect(); const sh=r.height*0.18;
   boxes.push({i,x0:r.left,x1:r.right,y0:r.top+sh,y1:r.bottom-sh,txt:t.textContent});
   if(r.left<fr.left-0.5||r.top<fr.top-0.5||r.right>fr.right+0.5||r.bottom>fr.bottom+0.5) out.push({file,kind:'frame',text:t.textContent});
  });
  for(let a=0;a<boxes.length;a++)for(let b=a+1;b<boxes.length;b++){
   const A=boxes[a],B=boxes[b];
   if(A.x0<B.x1&&B.x0<A.x1&&A.y0<B.y1&&B.y0<A.y1) out.push({file,kind:'text-vs-text',text:A.txt+' | '+B.txt});
  }
 });
 return out;
}""".replace('%MIN%', str(MIN_DRAWN))

def measure(files):
    return chromecheck.run(files, JS)

def main(argv):
    files = chromecheck.collect(argv)
    if not files:
        print('no svg files', file=sys.stderr); return 2
    issues = measure(files)
    for i in issues: print(json.dumps(i, ensure_ascii=False), file=sys.stderr)
    print(len(issues))
    return 1 if issues else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
