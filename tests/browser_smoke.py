"""Optional Edge/Chrome integration check. Requires Python and websockets for development only."""
import asyncio
import base64
import functools
import http.server
import json
import os
import shutil
from pathlib import Path
import subprocess
import tempfile
import threading
import time
import urllib.request

import websockets

ROOT = Path(os.environ.get("ROBONAV_SOURCE_ROOT", str(Path(__file__).resolve().parents[1])))
OUTPUT = Path(os.environ.get("ROBONAV_BROWSER_OUTPUT",str(ROOT/"docs")))
OUTPUT.mkdir(parents=True,exist_ok=True)
BROWSER = os.environ.get("ROBONAV_BROWSER", shutil.which("google-chrome") or shutil.which("chromium") or "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe")

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

async def check(port, site_port):
    with urllib.request.urlopen(f"http://127.0.0.1:{port}/json") as response:
        tabs = json.load(response)
    async with websockets.connect(next(tab for tab in tabs if tab.get("type")=="page")["webSocketDebuggerUrl"], max_size=8_000_000) as socket:
        sequence = 0
        async def command(method, params=None):
            nonlocal sequence
            sequence += 1
            current = sequence
            await socket.send(json.dumps({"id": current, "method": method, "params": params or {}}))
            while True:
                message = json.loads(await socket.recv())
                if message.get("id") == current:
                    if "error" in message:
                        raise RuntimeError(message["error"])
                    return message.get("result", {})
        await command("Page.enable")
        await command("Emulation.setDeviceMetricsOverride", {"width":1600,"height":1100,"deviceScaleFactor":1,"mobile":False})
        await command("Page.navigate", {"url":(ROOT/"index.html").as_uri() if os.environ.get("ROBONAV_FILE_TEST") else os.environ.get("ROBONAV_BASE_URL",f"http://127.0.0.1:{site_port}/index.html")})
        for _ in range(100):
            ready = await command("Runtime.evaluate", {"expression":"!!(document.getElementById('algorithm') && window.RoboNav && document.readyState==='complete')","returnByValue":True})
            if ready.get("result",{}).get("value"):
                break
            await asyncio.sleep(.1)
        else:
            state = await command("Runtime.evaluate", {"expression":"location.href+' '+document.body.innerText.slice(0,500)","returnByValue":True})
            raise RuntimeError(state)
        expression = r"""(async()=>{
          const el=id=>document.getElementById(id),R=window.RoboNav;
          const assert=(value,message)=>{if(!value)throw Error(message);};
          const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
          const until=async condition=>{for(let i=0;i<400;i++){if(condition())return;await wait(25);}throw Error('asynchronous result timeout');};
          assert(el('algorithm').options.length===5,'five planners');assert(el('scenario').options.length===8,'eight environments');
          assert(el('controller').options.length===3,'three controllers');
          assert(document.querySelector('.version').textContent.includes('v1.4'),'wrong deployed version');
          assert(el('example').options.length===6,'six examples');
          for(const id of Object.keys(window.RoboNavSharing.EXAMPLES)){el('example').value=id;el('loadExample').click();assert(el('example').value===id,'gallery selection');}
          el('example').value='discovery';el('loadExample').click();
          await el('shareExperiment').onclick();const shared=el('shareLink').value;
          assert(shared.includes('#experiment='),'share link missing');
          const decoded=window.RoboNavSharing.decode(R,shared.split('#experiment=')[1]);assert(decoded.robot.navigation==='sensor','shared settings');
          assert(document.querySelector('.skip-link'),'keyboard skip link');
          for(const environment of Object.keys(R.ENVIRONMENTS)){
            el('scenario').value=environment;el('scenario').dispatchEvent(new Event('change'));
            for(const planner of Object.keys(R.PLANNERS)){el('algorithm').value=planner;el('algorithm').dispatchEvent(new Event('change'));assert(el('status').textContent==='Ready to navigate',environment+' '+planner);}
          }
          el('algorithm').value='astar';el('algorithm').dispatchEvent(new Event('change'));
          let frames=0,watch=true;const frame=()=>{frames++;if(watch)requestAnimationFrame(frame);};requestAnimationFrame(frame);
          el('compare').click();const workers=el('compare').disabled;assert(workers||location.protocol==='file:','planner worker did not start');
          await until(()=>!el('compare').disabled);assert(el('results').children.length===5,'comparison rows');
          el('compareControllers').click();assert(el('compareControllers').disabled||location.protocol==='file:','controller worker did not start');
          await until(()=>!el('compareControllers').disabled);assert(el('controllerResults').children.length===3,'three controller rows');
          watch=false;if(location.protocol!=='file:')assert(frames>1,'viewport blocked during worker comparison');
          el('scenario').value='warehouse';el('scenario').dispatchEvent(new Event('change'));
          for(const [id,value] of [['navigation','sensor'],['controller','dwa']]){el(id).value=value;el(id).dispatchEvent(new Event('change'));}
          el('movingObstacles').checked=true;el('movingObstacles').dispatchEvent(new Event('change'));el('showObserved').checked=true;
          document.querySelector('.robot-config').open=true;
          el('run').click();await wait(1500);el('run').click();
          assert(el('status').textContent==='Mission paused','sensor mission failed');assert(parseFloat(el('coverage').textContent)>0,'missing scan coverage');
          el('toast').hidden=true;return 'PASS ('+location.protocol+'): 5 planners, 8 environments, 3 controllers, 40 native selections, 6 gallery examples, share encoding, comparisons, sensor DWA with moving carts and observed map. HTTP mode additionally verifies workers and viewport responsiveness.';
        })()"""
        result = await command("Runtime.evaluate", {"expression":expression,"awaitPromise":True,"returnByValue":True})
        if "exceptionDetails" in result:
            raise RuntimeError(result["exceptionDetails"])
        report = result["result"]["value"]
        if not os.environ.get("ROBONAV_FILE_TEST"):
            shared = await command("Runtime.evaluate", {"expression":"(async()=>{await document.getElementById('shareExperiment').onclick();return document.getElementById('shareLink').value;})()","awaitPromise":True,"returnByValue":True})
            token = shared["result"]["value"].split("#experiment=")[1]
            target = os.environ.get("ROBONAV_BASE_URL",f"http://127.0.0.1:{site_port}/index.html").split("#")[0]
            await command("Page.navigate", {"url":target+"#experiment="+token})
            for _ in range(100):
                committed = await command("Runtime.evaluate", {"expression":"location.hash","returnByValue":True})
                if committed.get("result",{}).get("value") == "#experiment="+token:
                    break
                await asyncio.sleep(.1)
            else:
                raise RuntimeError("Shared URL navigation did not commit")
            await command("Runtime.evaluate", {"expression":"window.__beforeShareReload=true"})
            await command("Page.reload", {"ignoreCache":True})
            for _ in range(100):
                loaded = await command("Runtime.evaluate", {"expression":"!!(!window.__beforeShareReload && document.readyState==='complete' && document.getElementById('navigation')?.value==='sensor' && document.getElementById('movingObstacles')?.checked)","returnByValue":True})
                if loaded.get("result",{}).get("value"):
                    break
                await asyncio.sleep(.1)
            else:
                state = await command("Runtime.evaluate", {"expression":"JSON.stringify({url:location.href,ready:document.readyState,navigation:document.getElementById('navigation')?.value,moving:document.getElementById('movingObstacles')?.checked,toast:document.getElementById('toast')?.textContent})","returnByValue":True})
                raise RuntimeError("Shared experiment did not reload: "+str(state))
            report += " Shared-link page reload passed."
        await command("Runtime.evaluate", {"expression":"document.getElementById('toast').hidden=true;document.querySelector('.robot-config').open=true;document.getElementById('showObserved').checked=true;window.scrollTo(0,0)"})
        if os.environ.get("ROBONAV_FILE_TEST"):
            print(report)
            return
        screenshot = await command("Page.captureScreenshot", {"format":"png"})
        (OUTPUT/"browser-smoke.png").write_bytes(base64.b64decode(screenshot["data"]))
        await command("Emulation.setDeviceMetricsOverride", {"width":390,"height":844,"deviceScaleFactor":1,"mobile":True})
        await asyncio.sleep(.2)
        await command("Runtime.evaluate", {"expression":"window.scrollTo(0,0)"})
        screenshot = await command("Page.captureScreenshot", {"format":"png"})
        (OUTPUT/"browser-mobile.png").write_bytes(base64.b64decode(screenshot["data"]))
        (OUTPUT/"browser-check.txt").write_text("Chromium CDP integration test\n"+report+"\n",encoding="utf-8")
        print(report)

if __name__ == "__main__":
    server = http.server.ThreadingHTTPServer(("127.0.0.1",0),functools.partial(QuietHandler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    with tempfile.TemporaryDirectory(prefix="robonav-edge-") as profile:
        process = subprocess.Popen([BROWSER,"--headless","--disable-gpu","--no-first-run","--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=getattr(subprocess,"CREATE_NO_WINDOW",0))
        try:
            active = Path(profile)/"DevToolsActivePort"
            for _ in range(100):
                if active.exists():
                    break
                time.sleep(.1)
            asyncio.run(check(int(active.read_text().splitlines()[0]),server.server_port))
        finally:
            process.terminate()
            process.wait(timeout=10)
            server.shutdown()
