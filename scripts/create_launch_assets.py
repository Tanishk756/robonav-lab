"""Generate captioned clips from actual engine results. Requires Chromium, websockets and ffmpeg."""
import asyncio,base64,functools,http.server,json,os,shutil,subprocess,tempfile,threading,time,urllib.request
from pathlib import Path
import websockets
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'launch';OUT.mkdir(exist_ok=True)
BROWSER=os.environ.get('ROBONAV_BROWSER',shutil.which('google-chrome') or 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_args):pass
JS=r"""(async()=>{
 const R=window.RoboNav,E=window.RoboNavShowcase,kind=KIND;
 const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=900;const c=canvas.getContext('2d');
 const captions={replan:['A robot follows its planned warehouse route.','A new obstacle enters the map. The engine replans.','The robot follows the updated route. Try it yourself.'],costs:['Choose a shortest-distance route through the loading dock.','Increase proximity cost to prefer a wider route.','Both plans are valid. Their optimization objectives differ.'],fit:['This robot cannot fit through the grid doorway.','Reduce body radius: safety radius changes from 0.72 m to 0.36 m.','A route becomes reachable. Footprint is part of planning.']}[kind];
 function map(m,path,x,y,w,h,pose,radius=.24,clearance=.36){
   const sx=w/m.w,sy=h/m.h;c.fillStyle='#0e1622';c.fillRect(x,y,w,h);c.fillStyle='#34465e';m.cells.forEach((v,i)=>{if(v)c.fillRect(x+i%m.w*sx,y+Math.floor(i/m.w)*sy,sx,sy);});
   c.strokeStyle='#c5f46b';c.lineWidth=3;c.beginPath();path.forEach((p,i)=>i?c.lineTo(x+(p.x+.5)*sx,y+(p.y+.5)*sy):c.moveTo(x+(p.x+.5)*sx,y+(p.y+.5)*sy));c.stroke();
   if(pose){c.fillStyle='#4cd7cb44';c.strokeStyle='#4cd7cb';c.beginPath();c.arc(x+pose.x*sx,y+pose.y*sy,clearance*sx,0,2*Math.PI);c.fill();c.stroke();c.fillStyle='#4cd7cb';c.beginPath();c.arc(x+pose.x*sx,y+pose.y*sy,Math.max(3,radius*sx),0,2*Math.PI);c.fill();}
 }
 let rec,sim,plain,wide,m;
 if(kind==='replan'){sim=new R.Simulation(R.makeMap('warehouse'),'astar',1.6,{controller:'pursuit'});rec=new E.Recorder();sim.start();rec.capture(sim);for(let i=0;i<1200&&sim.status==='running';i++){if(i===240){const cell=sim.path[Math.min(sim.target+4,sim.path.length-2)];sim.map.cells[cell.y*sim.map.w+cell.x]=1;sim.replan();}sim.step(1/60);rec.capture(sim);}if(sim.replans!==1)throw Error('replan recording failed');}
 else {m=R.makeMap(kind==='costs'?'loading':'office');const first=kind==='costs'?{costWeight:0,softBand:0}:{radius:.6,margin:.12};const second=kind==='costs'?{costWeight:10,softBand:3}:{radius:.24,margin:.12};const a=R.config(first),b=R.config(second);plain=R.plan(R.buildCostmap(m,a),m.start,m.goal,'astar',a.radius+a.margin,m);wide=R.plan(R.buildCostmap(m,b),m.start,m.goal,'astar',b.radius+b.margin,m);if(kind==='fit'&&(plain.path.length||!wide.path.length))throw Error('fit illustration failed');}
 function paint(seconds){
   const fraction=Math.min(1,seconds/12);c.fillStyle='#0b1018';c.fillRect(0,0,1280,900);c.fillStyle='#c5f46b';c.font='bold 38px Arial';c.fillText('RoboNav Lab | v1.5',40,58);c.fillStyle='#e9eff7';c.font='25px Arial';c.fillText({replan:'Watch obstacle-triggered replanning',costs:'Compare planned routes and proximity cost',fit:'Your footprint changes reachable routes'}[kind],40,105);
   if(kind==='replan'){const at=rec.frames.findIndex(f=>f.time>=fraction*12),view=rec.view(R,sim,at<0?rec.frames.length-1:at);map(view.worldMap,view.path,240,135,800,600,view.pose);c.fillStyle='#93a4b9';c.font='22px Arial';c.fillText('Recorded engine motion | Replans: '+view.replans,80,765);}
   else if(kind==='costs'){for(const [plan,x,title] of [[plain,40,'Distance-only'],[wide,660,'High proximity cost']]){const point=plan.path[Math.min(plan.path.length-1,Math.floor(fraction*(plan.path.length-1)))];map(m,plan.path,x,180,570,427,{x:point.x+.5,y:point.y+.5});c.fillStyle='#e9eff7';c.font='23px Arial';c.fillText(title,x,150);c.fillText('Planned length: '+plan.length.toFixed(2)+' m',x,650);}c.fillStyle='#93a4b9';c.fillText('Planned-route illustration, not controller playback',40,710);}
   else {const after=seconds>=4,plan=after?wide:plain;map(m,plan.path,240,135,800,600,R.center(m.start),after ? .24 : .6,after ? .36 : .72);c.fillStyle=after?'#c5f46b':'#ffb86b';c.font='28px Arial';c.fillText(after?'Reachable grid route | radius + margin = 0.36 m':'No safe grid route | radius + margin = 0.72 m',80,775);}
   c.fillStyle='#e9eff7';c.font='24px Arial';const text=captions[Math.min(2,Math.floor(seconds/4))],words=text.split(' ');let line='',row=0;for(const word of words){if(c.measureText(line+word).width>1190){c.fillText(line,40,820+row*28);row++;line='';}line+=word+' ';}c.fillText(line,40,820+row*28);
   c.fillStyle='#93a4b9';c.font='17px Arial';c.fillText('tanishk756.github.io/robonav-lab | Educational simulation; no hardware safety claim',40,885);
 }
 paint(0);const stream=canvas.captureStream(30),chunks=[];const recorder=new MediaRecorder(stream,{mimeType:MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm'});
 const done=new Promise(resolve=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=async()=>{stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:'video/webm'}),reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(blob);};});
 recorder.start();const begin=performance.now();await new Promise(resolve=>{function tick(){const elapsed=(performance.now()-begin)/1000;paint(elapsed);if(elapsed>=12){recorder.stop();resolve();}else requestAnimationFrame(tick);}tick();});
 return {data:await done,captions};
})()"""
async def create(port,site):
    with urllib.request.urlopen(f'http://127.0.0.1:{port}/json') as response:tabs=json.load(response)
    async with websockets.connect(next(t for t in tabs if t.get('type')=='page')['webSocketDebuggerUrl'],max_size=40_000_000) as socket:
        counter=0
        async def cmd(method,params=None):
            nonlocal counter
            counter+=1;current=counter;await socket.send(json.dumps({'id':current,'method':method,'params':params or {}}))
            while True:
                result=json.loads(await socket.recv())
                if result.get('id')==current:
                    if 'error' in result:raise RuntimeError(result['error'])
                    return result.get('result',{})
        await cmd('Page.navigate',{'url':f'http://127.0.0.1:{site}/index.html'})
        for _ in range(100):
            result=await cmd('Runtime.evaluate',{'expression':'!!window.RoboNavShowcase','returnByValue':True})
            if result.get('result',{}).get('value'):break
            await asyncio.sleep(.1)
        ffmpeg=shutil.which('ffmpeg')
        if not ffmpeg:
            import imageio_ffmpeg
            ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
        for kind in ['replan','costs','fit']:
            result=await cmd('Runtime.evaluate',{'expression':JS.replace('KIND',json.dumps(kind)),'awaitPromise':True,'returnByValue':True})
            if 'exceptionDetails' in result:raise RuntimeError(result['exceptionDetails'])
            value=result['result']['value'];temporary=ROOT/'dist'/f'{kind}.webm';temporary.parent.mkdir(exist_ok=True);temporary.write_bytes(base64.b64decode(value['data']))
            output=OUT/f'{kind}.mp4';subprocess.run([ffmpeg,'-y','-loglevel','error','-i',str(temporary),'-c:v','libx264','-b:v','1200k','-minrate','1200k','-maxrate','1200k','-bufsize','2400k','-x264-params','filler=1','-vf','scale=in_range=pc:out_range=tv,format=yuv420p,fps=30','-pix_fmt','yuv420p','-color_range','tv','-movflags','+faststart','-an',str(output)],check=True)
            captions=''
            for i,text in enumerate(value['captions']):captions+=f'{i+1}\n00:00:{i*4:02d},000 --> 00:00:{(i+1)*4:02d},000\n{text}\n\n'
            (OUT/f'{kind}.srt').write_text(captions.rstrip()+'\n',encoding='utf-8');print('Created',output,flush=True)
        subprocess.run([ffmpeg,'-y','-loglevel','error','-i',str(OUT/'replan.mp4'),'-vf','fps=8,scale=640:-1','-loop','0',str(OUT/'demo.gif')],check=True)
if __name__=='__main__':
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
    with tempfile.TemporaryDirectory(prefix='robonav-launch-') as profile:
        process=subprocess.Popen([BROWSER,'--headless','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
        try:
            active=Path(profile)/'DevToolsActivePort'
            for _ in range(100):
                if active.exists():break
                time.sleep(.1)
            asyncio.run(create(int(active.read_text().splitlines()[0]),server.server_port))
        finally:process.terminate();process.wait(timeout=10);server.shutdown()
