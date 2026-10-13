"""Build a deterministic offline ZIP from tracked source; no third-party packages."""
import hashlib
from pathlib import Path
import re
import subprocess
import zipfile

ROOT=Path(__file__).resolve().parents[1]
VERSION=re.search(r"const VERSION='([^']+)'",(ROOT/'sharing.js').read_text(encoding='utf-8')).group(1)
if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+",VERSION):
    raise ValueError('Invalid release version')
RUNTIME=['index.html','style.css','navigation.js','core.js','sharing.js','app.js','navigation-worker.js']
files=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode('utf-8').split('\0')
files=sorted(name for name in files if name)
if not set(RUNTIME+['LICENSE','README.md','START-HERE.txt']).issubset(files):
    raise ValueError('Missing tracked runtime or release files')
output=ROOT/'dist';output.mkdir(exist_ok=True)
archive=output/f'robonav-lab-{VERSION}.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as bundle:
    for name in files:
        source=ROOT/name
        if source.is_symlink() or not source.is_file() or not source.resolve().is_relative_to(ROOT):
            raise ValueError('Invalid package member: '+name)
        info=zipfile.ZipInfo('robonav-lab/'+name,date_time=(1980,1,1,0,0,0))
        info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
        # Git-normalized text makes archives stable across checkout line endings.
        data=source.read_bytes()
        if b'\0' not in data[:8192]:
            try:
                data=data.decode('utf-8').replace('\r\n','\n').encode('utf-8')
            except UnicodeDecodeError:
                pass
        bundle.writestr(info,data)
digest=hashlib.sha256(archive.read_bytes()).hexdigest()
(output/'SHA256SUMS.txt').write_text(digest+'  '+archive.name+'\n',encoding='utf-8',newline='\n')
site=output/'site';site.mkdir(exist_ok=True)
for name in RUNTIME+['.nojekyll']:
    (site/name).write_bytes((ROOT/name).read_bytes())
print(str(archive))
print(digest)
