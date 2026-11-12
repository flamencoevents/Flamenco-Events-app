#!/usr/bin/env python3
"""Import public images into the isolated Divulgarte staging area.

No authentication, student content, shopping flows or domain changes.
Fails safe: never overwrites assets and never publishes third-party scripts.
"""
from __future__ import annotations
import hashlib
import html
import json
import mimetypes
from pathlib import Path
import re
import time
from urllib.parse import unquote, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
STAGE = ROOT / 'divulgarte-preview'
ASSETS = STAGE / 'assets'
ASSETS.mkdir(exist_ok=True)
PAGES = sorted(STAGE.glob('*.html'))
USER_AGENT = 'Mozilla/5.0 (compatible; DivulgarteWebsiteMigration/1.0)'
MAX_FILE = 8 * 1024 * 1024
MAX_TOTAL = 90 * 1024 * 1024
used_bytes = sum(p.stat().st_size for p in ASSETS.glob('*') if p.is_file())
entries = {}
errors = []
pattern = re.compile(r'https://le-cdn\.website-editor\.net/[^\s\\"<>]+', re.I)


def request_binary(url: str) -> tuple[bytes, str]:
    request = Request(html.unescape(url), headers={'User-Agent': USER_AGENT, 'Accept': 'image/avif,image/webp,image/png,image/jpeg,image/gif,*/*;q=0.8'})
    with urlopen(request, timeout=25) as result:
        kind = result.headers.get('Content-Type', '').lower().split(';')[0]
        if not kind.startswith('image/'):
            raise ValueError('Content-Type no es imagen')
        data = result.read(MAX_FILE + 1)
        if not 50 <= len(data) <= MAX_FILE:
            raise ValueError('Tamaño inválido')
        return data, kind


def path_for(url: str, kind: str, data: bytes) -> Path:
    name = unquote(urlsplit(url).path.rsplit('/', 1)[-1])
    base = re.sub(r'[^a-z0-9-]+', '-', name.rsplit('.', 1)[0].lower()).strip('-')[:45] or 'imagen'
    ext = {'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif'}.get(kind)
    if not ext:
        raise ValueError('Formato no admitido')
    return ASSETS / (base + '-' + hashlib.sha256(data).hexdigest()[:12] + ext)


for page in PAGES:
    content = page.read_text(encoding='utf-8')
    links = list(dict.fromkeys(pattern.findall(content)))
    for link in links:
        original = html.unescape(link)
        key = urlsplit(original).path
        if key in entries:
            target = entries[key]
        else:
            try:
                data, kind = request_binary(original)
                if used_bytes + len(data) > MAX_TOTAL:
                    raise ValueError('Presupuesto de bytes excedido')
                target_path = path_for(original, kind, data)
                if not target_path.exists():
                    target_path.write_bytes(data)
                    used_bytes += len(data)
                target = './assets/' + target_path.name
                entries[key] = target
            except Exception as exc:
                errors.append({'page': page.name, 'image': key, 'error': str(exc)[:140]})
                continue
        content = content.replace(link, html.escape(target, quote=True))
    # No fake-success claims for missing URLs: keep original until manually reviewed.
    page.write_text(content, encoding='utf-8')

# Render visual illustration galleries for internal pages from original public images
# already present in source. This import cannot recover private or protected content.
manifest = {'imported_images': len(entries), 'total_bytes': used_bytes,
            'pages': [x.name for x in PAGES], 'errors': errors,
            'assets': [{'origin_path': k, 'local': v} for k, v in entries.items()]}
(STAGE / 'assets-manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(json.dumps({'imported_images': len(entries), 'failed': len(errors),
                  'total_mb': round(used_bytes / 1048576, 2)}, ensure_ascii=False))
if len(entries) == 0:
    raise SystemExit('No se ha podido recuperar ninguna imagen; no se considerará migrado el contenido visual')
