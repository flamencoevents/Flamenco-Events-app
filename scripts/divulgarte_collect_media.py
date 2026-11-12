#!/usr/bin/env python3
"""Recover original public visual assets from Divulgarte's published pages.

Never visits private areas, forms or sales endpoints. Does not touch DNS.
"""
import hashlib
import html
import json
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit
from urllib.request import Request, urlopen

STAGE = Path(__file__).resolve().parents[1] / "divulgarte-preview"
ASSETS = STAGE / "assets"
ASSETS.mkdir(exist_ok=True)
SITE = "https://www.divulgarteflamenco.es/"
SLUGS = ["", "bienevenidos", "cursos", "cursosdesgranandolaguitarraflamenca",
 "did%C3%A1ctica-del-flamenco", "did%C3%A1ctica-del-flamencodc63ec1a",
 "m%C3%A9todos-de-guitarra-flamenca", "la-tirania-del-oido", "galeria",
 "contacto", "aviso-legal"]
UA = {"User-Agent": "Mozilla/5.0 DivulgarteMigration/1.0", "Accept": "image/webp,image/png,image/jpeg,*/*;q=0.6"}
PATTERN = re.compile(r'https?://le-cdn\.website-editor\.net/s/[^\\"\'<>\s]+', re.I)
MAX_TOTAL = 90 * 1024 * 1024
MAX_FILE = 7 * 1024 * 1024
used = sum(x.stat().st_size for x in ASSETS.glob("*") if x.is_file())
downloaded = 0
seen = {}
failures = {}
pages = {}


def get(url, size=MAX_FILE):
    req = Request(url, headers=UA)
    with urlopen(req, timeout=18) as response:
        if response.status != 200:
            raise ValueError("HTTP " + str(response.status))
        mime = response.headers.get("Content-Type", "").split(";")[0].strip().lower()
        data = response.read(size + 1)
        if len(data) > size:
            raise ValueError("Archivo demasiado grande")
        return data, mime


for slug in SLUGS:
    path = unquote(slug)
    page_file = STAGE / ((path or "index") + ".html")
    if not page_file.exists():
        failures[path] = "No se encontró página de staging"
        continue
    try:
        source, _ = get(SITE + slug, size=5 * 1024 * 1024)
        text = html.unescape(source.decode("utf-8", "replace"))
    except Exception as exc:
        failures[path] = str(exc)[:160]
        continue
    urls = []
    for match in PATTERN.findall(text):
        url = html.unescape(match).replace("\\/","/")
        if "/dms3rep/" not in url or "/multi/opt/" not in url:
            continue
        # trim HTML-attribute garbage introduced by escaping
        url = url.split("&quot;")[0].split("&apos;")[0]
        pathname = urlsplit(url).path
        if pathname not in [urlsplit(x).path for x in urls]:
            urls.append(url)
    files = []
    for url in urls:
        key = urlsplit(url).path
        if "divulg-f045e894" in key:
            continue
        if key in seen:
            files.append(seen[key]); continue
        try:
            blob, mime = get(url)
            ext = {"image/png":".png","image/jpeg":".jpg","image/webp":".webp","image/gif":".gif","image/avif":".avif"}.get(mime)
            if not ext or len(blob)<50:
                raise ValueError("Archivo no reconocido como imagen")
            safe = re.sub(r"[^a-z0-9]+", "-", unquote(key.rsplit("/",1)[-1].rsplit(".",1)[0]).lower()).strip("-")[:47]
            name = (safe or "imagen") + "-" + hashlib.sha256(blob).hexdigest()[:12] + ext
            output = ASSETS / name
            if not output.exists():
                if used + len(blob) > MAX_TOTAL:
                    raise ValueError("Límite de almacenamiento")
                output.write_bytes(blob)
                used += len(blob)
                downloaded += 1
            local = "./assets/" + name
            seen[key] = local
            files.append(local)
        except Exception as exc:
            failures[key] = str(exc)[:160]
    pages[path] = len(files)
    if path not in ("contacto", "aviso-legal") and files:
        current = page_file.read_text(encoding="utf-8")
        # Idempotently replace only the generated section.
        current = re.sub(r'<section id="df-media-gallery">.*?</section>', "", current, flags=re.S)
        gallery = '<section id="df-media-gallery"><h2>Imágenes y materiales del proyecto</h2><div class="gallery">' + "".join(
            '<figure><img loading="lazy" src="' + html.escape(x, quote=True) + '" alt="Material visual de Divulgarte Flamenco"></figure>' for x in files[:30]) + '</div></section>'
        current = current.replace("</main>",gallery+"</main>")
        page_file.write_text(current, encoding="utf-8")

(STAGE/"media-inventory.json").write_text(json.dumps({
 "source":"public site", "assets_downloaded_now":downloaded, "unique_assets":len(seen),
 "total_bytes":used, "per_page":pages, "failures":failures},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"downloaded_now":downloaded,"unique_assets":len(seen),"pages":pages,"failures":len(failures)},ensure_ascii=False))
if not seen:
    raise SystemExit("No se pudieron rescatar imágenes originales del sitio; no se publicarán enlaces inventados")
