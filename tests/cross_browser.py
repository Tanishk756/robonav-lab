"""Actual desktop browser checks; mobile viewports are emulated, not physical devices."""
import functools,http.server,json,os,threading
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
OUTPUT=Path(os.environ.get('ROBONAV_CROSS_OUTPUT',str(ROOT/'docs/cross-browser')));OUTPUT.mkdir(parents=True,exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_args):pass
if __name__=='__main__':
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
    reports=[]
    try:
        with sync_playwright() as p:
            for name in os.environ.get('ROBONAV_TEST_BROWSERS','edge,chrome,firefox').split(','):
                if name=='firefox':browser=p.firefox.launch(headless=True)
                elif name=='chromium':browser=p.chromium.launch(headless=True)
                else:
                    binary='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' if name=='edge' else 'C:/Program Files/Google/Chrome/Application/chrome.exe'
                    browser=p.chromium.launch(headless=True,executable_path=binary)
                context=browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                page.goto(f'http://127.0.0.1:{server.server_port}/index.html');expect(page.locator('.version')).to_contain_text('v1.6')
                assert page.locator('#algorithm option').count()==11 and page.locator('#challenge option').count()==4
                assert not page.locator('#usageOptIn').is_checked()
                page.locator('#startDemo').click();expect(page.locator('#demoText')).to_contain_text('Demo complete',timeout=25000)
                assert int(page.locator('#replayTime').get_attribute('max'))>10
                live=page.locator('#poseX').inner_text();page.locator('#replayTime').fill('0');page.locator('#replayTime').dispatch_event('input');expect(page.locator('#replayLabel')).to_contain_text('Replay')
                page.locator('#exitReplay').click();expect(page.locator('#poseX')).to_have_text(live)
                with page.expect_download() as result:page.locator('#downloadCard').click()
                result.value.save_as(OUTPUT/f'{name}-result-card.png');assert (OUTPUT/f'{name}-result-card.png').read_bytes().startswith(b'\x89PNG')
                with page.expect_download() as result:page.locator('#downloadHtml').click()
                result.value.save_as(OUTPUT/f'{name}-report.html');assert 'Reproduce the initial experiment' in (OUTPUT/f'{name}-report.html').read_text(encoding='utf-8')
                page.locator('#challenge').select_option('safe');page.locator('#loadChallenge').click();page.locator('#shareExperiment').click();expect(page.locator('#shareLink')).not_to_have_value('')
                shared=page.locator('#shareLink').input_value().split('#experiment=')[1];page.goto(f'http://127.0.0.1:{server.server_port}/index.html#experiment='+shared);page.reload();expect(page.locator('#margin')).to_have_value('0.3')
                page.locator('#simpleView').click();assert 'simple-view' in page.locator('body').get_attribute('class');expect(page.locator('.telemetry')).not_to_be_visible();expect(page.locator('#loadChallenge')).to_be_visible();page.locator('#simpleView').click()
                page.evaluate('window.scrollTo(0,0)');page.screenshot(path=str(OUTPUT/f'{name}-desktop.png'))
                page.set_viewport_size({'width':390,'height':844});page.evaluate('window.scrollTo(0,0)');page.screenshot(path=str(OUTPUT/f'{name}-mobile.png'))
                assert not errors,errors
                reports.append({'browser':name,'version':browser.version,'result':'passed','coverage':'guided mission, replay isolation, PNG/HTML downloads, challenge-share reload, simple view and desktop/emulated-mobile render'})
                context.close();browser.close();print(name,'passed',flush=True)
    finally:server.shutdown()
    (OUTPUT/'results.json').write_text(json.dumps({'results':reports,'physical_mobile_tested':False,'first_time_humans_tested':False},indent=2),encoding='utf-8')
