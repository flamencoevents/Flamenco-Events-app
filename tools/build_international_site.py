#!/usr/bin/env python3
"""Package the five English preview pages as a standalone, NON-PUBLIC release.

No DNS, custom domain, or GitHub Pages settings are changed. All packaged
pages deliberately retain noindex,nofollow until an approved launch.
"""
from __future__ import annotations

import argparse
from html.parser import HTMLParser
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "web-preview"
PAGE_NAMES = (
    "index",
    "eventos-exclusivos",
    "suite-flamenca",
    "son-del-alma",
    "guitarrista-flamenco",
)
SPANISH_SITE = "https://www.flamencoevents.net/"
PORTAL_LINK = re.compile(r'<a\s+href="\.\./portal\.html"[^>]*>Client area</a>', re.I)
HREF_LANG_ES = re.compile(r'<link\s+rel="alternate"\s+hreflang="es"\s+href="[^"]+"\s*/?>', re.I)
ES_SWITCH = re.compile(r'<a\s+href="[^"]+"\s+lang="es">ES</a>')

class AssetReferences(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.paths: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag not in ("img", "source", "script", "link"):
            return
        values = dict(attrs)
        value = values.get("src") or (values.get("href") if tag == "link" else None)
        if value and value.startswith("assets/"):
            self.paths.add(value)

def build(destination: Path) -> None:
    destination = destination.resolve()
    if destination == SOURCE.resolve() or SOURCE.resolve() in destination.parents:
        raise ValueError("Output must not overwrite the source preview.")
    if destination.exists():
        shutil.rmtree(destination)
    destination.mkdir(parents=True)
    assets: set[str] = set()
    for name in PAGE_NAMES:
        original = SOURCE / f"{name}-en.html"
        if not original.is_file():
            raise FileNotFoundError(f"Missing English page: {original}")
        html = original.read_text(encoding="utf-8")
        if '<html lang="en">' not in html or 'noindex,nofollow' not in html:
            raise ValueError(f"Language or preview safety tag missing: {original}")
        html = HREF_LANG_ES.sub("", html)
        html = ES_SWITCH.sub(f'<a href="{SPANISH_SITE}" lang="es">ES</a>', html)
        html = PORTAL_LINK.sub("", html)
        for page_name in PAGE_NAMES:
            html = html.replace(f'{page_name}-en.html', f'{page_name}.html')
        # The released homepage must be index.html, not index-en.html.
        if "../portal.html" in html:
            raise ValueError(f"Unresolved private app link in {name}")
        if re.search(r'href="[^"]+-en\.html"', html):
            raise ValueError(f"Unresolved English preview link in {name}")
        if 'noindex,nofollow' not in html:
            raise ValueError(f"Page accidentally made indexable: {name}")
        parser = AssetReferences()
        parser.feed(html)
        assets.update(parser.paths)
        (destination / f"{name}.html").write_text(html, encoding="utf-8")
    for relative in sorted(assets):
        source_asset = (SOURCE / relative).resolve()
        if SOURCE.resolve() not in source_asset.parents or not source_asset.is_file():
            raise FileNotFoundError(f"Missing or unsafe referenced asset: {relative}")
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source_asset, target)
    (destination / ".nojekyll").write_text("", encoding="utf-8")
    print(f"Packaged {len(PAGE_NAMES)} pages and {len(assets)} assets to {destination}")
    print("SAFE PREVIEW: noindex retained; no CNAME, DNS, domain purchase or production deployment.")

if __name__ == "__main__":
    argument_parser = argparse.ArgumentParser()
    argument_parser.add_argument("--output", default="international-build", type=Path)
    args = argument_parser.parse_args()
    build(args.output)
