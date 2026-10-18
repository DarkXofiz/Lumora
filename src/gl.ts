import type { Xf } from './fx'
const VS = `attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0,1);}`
const FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v;uniform sampler2D t;
uniform vec2 box,res,pan;uniform vec3 bg;
uniform float ca,zoom,rot,flip,has,tm,alpha,flash,b,c,s,temp,vig,sharp,blur,fx,amt,flt,fa;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 tx(vec2 u){return texture2D(t,clamp(u,0.,1.)).rgb;}
void main(){
 vec2 p=v-.5;p.x*=ca;p-=pan;p/=zoom;
 float cs=cos(rot),sn=sin(rot);p=vec2(cs*p.x+sn*p.y,-sn*p.x+cs*p.y);
 if(flip>.5)p.x=-p.x;
 vec2 u=p/box+.5;
 if(has<.5||u.x<0.||u.x>1.||u.y<0.||u.y>1.){gl_FragColor=vec4(bg,1.);return;}
 float a=amt;
 if(fx==8.&&u.x>.5)u.x=1.-u.x;
 if(fx==4.){float n=mix(260.,28.,a);u=floor(u*n)/n;}
 if(fx==9.)u+=(vec2(h(vec2(tm*30.,1.)),h(vec2(tm*30.,2.)))-.5)*.04*a;
 if(fx==10.)u.x+=sin(u.y*22.+tm*6.)*.02*a;
 if(fx==2.){float r=floor(u.y*26.+floor(tm*12.));float g=step(.8,h(vec2(r,floor(tm*12.))));u.x+=g*(h(vec2(r,3.))-.5)*.14*a;}
 vec3 col=tx(u);
 if(fx==2.||fx==3.||fx==5.){float o=.012*a*(fx==2.?1.6:1.);col=vec3(tx(u+vec2(o,0.)).r,col.g,tx(u-vec2(o,0.)).b);}
 float r=blur*.012+(fx==1.?a*.03:0.);
 if(r>0.){vec3 sm=col;for(int i=0;i<8;i++){float an=float(i)*.785398;sm+=tx(u+vec2(cos(an),sin(an))*r);}col=sm/9.;}
 if(fx==11.){vec3 sm=vec3(0.);for(int i=0;i<8;i++){float an=float(i)*.785398;sm+=tx(u+vec2(cos(an),sin(an))*.02);}sm/=8.;col+=max(sm-.45,0.)*a*2.2;}
 if(sharp>0.){vec2 o=1.5/res;vec3 av=(tx(u+vec2(o.x,0.))+tx(u-vec2(o.x,0.))+tx(u+vec2(0.,o.y))+tx(u-vec2(0.,o.y)))/4.;col+=(col-av)*sharp*3.;}
 col+=b;col=(col-.5)*c+.5;
 float l=dot(col,vec3(.299,.587,.114));col=mix(vec3(l),col,s);
 col.r+=temp*.1;col.b-=temp*.1;
 vec3 f0=col,g=vec3(dot(col,vec3(.299,.587,.114)));
 if(flt==1.)col=mix(g,col,1.45);
 else if(flt==2.)col*=vec3(1.12,1.,.86);
 else if(flt==3.)col*=vec3(.88,.98,1.14);
 else if(flt==4.){col=mix(g,col,1.1);col=(col-.5)*1.12+.5;col=mix(col*vec3(.86,1.,1.12),col*vec3(1.14,1.,.86),g.r);}
 else if(flt==5.){vec3 sp=vec3(dot(col,vec3(.393,.769,.189)),dot(col,vec3(.349,.686,.168)),dot(col,vec3(.272,.534,.131)));col=mix(col,sp,.85)*.94+.05;}
 else if(flt==6.)col=g;
 else if(flt==7.)col=mix(col,vec3(.62),.2);
 else if(flt==8.){col=mix(g,col,.6);col=(col-.5)*1.4+.5;}
 else if(flt==9.)col=col*vec3(1.1,.86,1.02)+vec3(.04,0.,.05);
 col=mix(f0,col,fa);
 if(fx==5.){col*=.9+.1*sin(u.y*res.y*1.4);col+=(h(u*res+tm)-.5)*.12*a;}
 if(fx==6.)col+=(h(u*res+tm)-.5)*.4*a;
 if(fx==12.)col=mix(col,1.-col,a);
 if(fx==13.)col+=a*max(0.,sin(tm*7.))*.5;
 float vg=vig+(fx==7.?a:0.);
 col*=1.-smoothstep(.25,.9,length(v-.5))*vg*1.3;
 col+=flash;
 gl_FragColor=vec4(mix(bg,clamp(col,0.,1.),alpha),1.);
}`
export type GP = { b: number; c: number; s: number; temp: number; vig: number; sharp: number; blur: number; fx: number; amt: number; flt: number; fa: number
  cover: boolean; flip: boolean; ca: number; bg: [number, number, number]; tm: number; xf: Xf }
export class GLRenderer {
  gl: WebGLRenderingContext; u: Record<string, WebGLUniformLocation | null> = {}
  constructor(public canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', { antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true })!
    this.gl = gl
    const sh = (t: number, s: string) => { const o = gl.createShader(t)!; gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(o)); return o }
    const pr = gl.createProgram()!; gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS))
    gl.linkProgram(pr); gl.useProgram(pr)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    for (const k of ['box', 'res', 'pan', 'bg', 'ca', 'zoom', 'rot', 'flip', 'has', 'tm', 'alpha', 'flash', 'b', 'c', 's', 'temp', 'vig', 'sharp', 'blur', 'fx', 'amt', 'flt', 'fa']) this.u[k] = gl.getUniformLocation(pr, k)
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  }
  resize(w: number, h: number) { if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h } this.gl.viewport(0, 0, w, h) }
  draw(src: TexImageSource | null, sw: number, sh: number, q: GP) {
    const gl = this.gl, u = this.u, ok = !!src && sw > 0 && sh > 0
    if (ok) try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src!) } catch {}
    const sa = ok ? sw / sh : 1, ca = q.ca, fitW = (sa > ca) !== q.cover
    const box: [number, number] = fitW ? [ca, ca / sa] : [sa, 1]
    const x = q.xf
    gl.uniform2f(u.box, box[0], box[1]); gl.uniform2f(u.res, this.canvas.width, this.canvas.height); gl.uniform2f(u.pan, x.px, x.py)
    gl.uniform3f(u.bg, q.bg[0], q.bg[1], q.bg[2])
    gl.uniform1f(u.ca, ca); gl.uniform1f(u.zoom, x.zoom); gl.uniform1f(u.rot, x.rot); gl.uniform1f(u.flip, q.flip ? 1 : 0); gl.uniform1f(u.has, ok ? 1 : 0)
    gl.uniform1f(u.tm, q.tm % 100); gl.uniform1f(u.alpha, x.alpha); gl.uniform1f(u.flash, x.flash)
    gl.uniform1f(u.b, q.b); gl.uniform1f(u.c, q.c); gl.uniform1f(u.s, q.s); gl.uniform1f(u.temp, q.temp); gl.uniform1f(u.vig, q.vig)
    gl.uniform1f(u.sharp, q.sharp); gl.uniform1f(u.blur, q.blur); gl.uniform1f(u.fx, q.fx); gl.uniform1f(u.amt, q.amt); gl.uniform1f(u.flt, q.flt); gl.uniform1f(u.fa, q.fa)
    gl.clearColor(q.bg[0], q.bg[1], q.bg[2], 1); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
}
