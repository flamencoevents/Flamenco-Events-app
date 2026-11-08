#!/usr/bin/env python3
"""Checks an isolated international staging website before publication."""
from html.parser import HTMLParser
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
PAGES = ("index.html", "eventos-exclusivos.html", "suite-flamenca.html", "son-del-alma.html", "guitarrista-flamenco.html")

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
        self.images = []
        self.titles = []
        self.links = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "a" and a.get("href"):
            self.refs.append(a["href"])
            self.links.append(a)
        if tag == "img":
            self.images.append(a)
            if a.get("src"):
                self.refs.append(a["src"])
    def handle_data(self, data):
        pass

def check(root: Path) -> None:
    errors = []
    for name in PAGES:
        path = root / name
        if not path.is_file():
            errors.append(f"Missing page: {name}")
            continue
        html = path.read_text(encoding="utf-8")
        page = Page()
        page.feed(html)
        for marker in ('<html lang="en">', 'noindex,nofollow', 'id="main-content"', 'class="skip"'):
            if marker not in html:
                errors.append(f"{name}: missing required marker {marker}")
        if "../portal.html" in html or "supabase" in html.lower():
            errors.append(f"{name}: private app reference")
        for link in page.refs:
            if link.startswith(("https://", "http://", "mailto:", "tel:", "#")):
                continue
            local = link.split("#", 1)[0].split("?", 1)[0]
            if not local or local.startswith("/"):
                errors.append(f"{name}: invalid relative link {link}")
            elif not (root / local).is_file():
                errors.append(f"{name}: broken link or image {link}")
        for im in page.images:
            if not im.get("alt"):
                errors.append(f"{name}: missing image alt")
        if not any(link.get("href") == name and link.get("aria-current") == "page" for link in page.links):
            errors.append(f"{name}: no active navigation item")
    if (root / "CNAME").exists():
        errors.append("Custom domain must not be attached before registration")
    if (root / "robots.txt").read_text(encoding="utf-8") != "User-agent: *\nDisallow: /\n":
        errors.append("robots.txt must block preview indexing")
    if errors:
        print("\n".join(errors), file=sys.stderr)
        raise SystemExit(1)
    print("PASS: 5 pages, link references, accessibility markers, and launch safety checks")

if __name__ == "__main__":
    check(ROOT)
