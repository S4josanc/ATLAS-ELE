"""Compare the actual pre-fix, published and proposed startup in Chromium.

    python tests/startup_comparison.py [--chromium /path/to/browser] [--cache-cdn /tmp/atlas-cdn]

Only the historical index.html and app.js are taken from Git. This comparison
requires a checkout with both revisions and the same data files as the baseline.
It measures first marker DOM insertion, not completion of a physical screen paint.
"""
import argparse
from functools import partial
from http.server import ThreadingHTTPServer
import json
from pathlib import Path
import subprocess
from threading import Thread

from playwright.sync_api import sync_playwright
from browser_map import PIXEL, QuietHandler, serve_cdn_from_cache

ROOT = Path(__file__).resolve().parents[1]
BASE = "c3ffdafe6daa35fe8dc792084a205fb615a8f04a"
PREVIOUS = "358418789445d07f30efcec054426ec179b99f9d"


def run(browser, site, ref, args, profile):
    context = browser.new_context(viewport={"width": 390, "height": 844} if profile == "mobile" else
                                  {"width": 1365, "height": 900}, is_mobile=profile == "mobile",
                                  has_touch=profile == "mobile", locale="en-US")
    try:
        page = context.new_page()
        errors, pilot = [], []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("request", lambda r: pilot.append(r.url) if "/data/pilot-city-points.json" in r.url else None)
        if ref:
            for pathname, filename, kind in [
                ("/", "index.html", "text/html"), ("/app.js*", "app.js", "application/javascript")
            ]:
                body = subprocess.check_output(["git", "show", f"{ref}:{filename}"], cwd=ROOT)
                page.route(site + pathname, lambda route, *, body=body, kind=kind:
                           route.fulfill(body=body, content_type=kind))
        page.route("https://tile.openstreetmap.org/**", lambda r: r.fulfill(body=PIXEL, content_type="image/png"))
        if args.cache_cdn:
            for host in ["cdn.jsdelivr.net", "unpkg.com"]:
                page.route("https://" + host + "/**", lambda r: serve_cdn_from_cache(r, args.cache_cdn))
        page.add_init_script("""new MutationObserver((_, observer) => {
            if(document.querySelector('.leaflet-marker-pane .leaflet-marker-icon')) {
                window.firstAtlasMarker = performance.now(); observer.disconnect();
            }
        }).observe(document, {subtree:true,childList:true});""")
        if profile == "mobile":
            context.new_cdp_session(page).send("Emulation.setCPUThrottlingRate", {"rate": 4})
        page.goto(site + "/", wait_until="load", timeout=180_000)
        if ref == PREVIOUS:
            assert any("textContent" in error and "null" in error for error in errors), errors
            assert not pilot, pilot
            assert not page.locator(".leaflet-marker-pane .leaflet-marker-icon").count()
            return {"ref": ref, "profile": profile, "error": errors[0], "pilotRequests": 0, "markers": 0}
        page.wait_for_function("() => window.firstAtlasMarker > 0", timeout=180_000)
        count = page.evaluate("() => clusterLayer.getLayers().length")
        assert count == 9136 and len(pilot) == 1 and not errors, (count, len(pilot), errors)
        return {"ref": ref or "proposed", "profile": profile, "markerDOMms": page.evaluate("firstAtlasMarker"),
                "pilotRequests": len(pilot), "markers": count, "errors": errors}
    finally:
        context.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--chromium")
    parser.add_argument("--cache-cdn", type=Path)
    parser.add_argument("--profile", choices=["all", "desktop", "mobile"], default="all")
    args = parser.parse_args()
    if args.cache_cdn:
        args.cache_cdn.mkdir(parents=True, exist_ok=True)
    with ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT))) as server:
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with sync_playwright() as p, p.chromium.launch(executable_path=args.chromium) as browser:
                print(json.dumps({"chromium": browser.version}), flush=True)
                site = f"http://127.0.0.1:{server.server_port}"
                for profile in ["desktop", "mobile"] if args.profile == "all" else [args.profile]:
                    for ref in [PREVIOUS, BASE, None]:
                        print(json.dumps(run(browser, site, ref, args, profile)), flush=True)
        finally:
            server.shutdown()
            thread.join()
