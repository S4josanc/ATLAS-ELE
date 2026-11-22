"""Real Leaflet integration test against a local ATLAS checkout.

python -m pip install playwright
python -m playwright install --only-shell chromium
python tests/browser_map.py

Optional: --chromium /usr/bin/chromium; --root /path/to/checkout;
--cache-cdn /tmp/atlas-assets downloads and reuses the actual CDN dependencies.
Only background map tiles are replaced, so the test does not use OSM tile quota.
"""
import argparse
import base64
from functools import partial
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import mimetypes
from pathlib import Path
import re
from threading import Thread
from urllib.parse import urlsplit
from urllib.request import urlopen

from playwright.sync_api import expect, sync_playwright

from globe_navigation import check_globe_navigation


# Audit inventory. Update deliberately when the public institution data changes.
RECORDS = 9136
VERIFIED_ROWS = 6414
PIXEL = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jKNsAAAAASUVORK5CYII="
)


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def serve_cdn_from_cache(route, directory):
    url = route.request.url
    asset = directory / hashlib.sha256(url.encode()).hexdigest()
    if not asset.exists():
        with urlopen(url, timeout=45) as response:
            asset.write_bytes(response.read())
    mime = mimetypes.guess_type(urlsplit(url).path)[0] or "application/octet-stream"
    route.fulfill(path=asset, content_type=mime, headers={"Access-Control-Allow-Origin": "*"})


def check_page(browser, site, label, context_options, cache, check_globe=False):
    with browser.new_context(locale="en-US", **context_options) as context:
        page = context.new_page()
        errors = []
        seen = {}
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        def request_failed(request):
            # Leaflet cancels offscreen tiles as a pan or animated zoom replaces them.
            if (urlsplit(request.url).hostname == "tile.openstreetmap.org"
                    and request.failure == "net::ERR_ABORTED"):
                return
            errors.append(f"{request.failure}: {request.url}")

        page.on("requestfailed", request_failed)

        def observe(response):
            if response.url.startswith(site):
                seen[urlsplit(response.url).path] = response.status
            if response.status >= 400:
                errors.append(f"HTTP {response.status}: {response.url}")

        page.on("response", observe)
        page.route("https://tile.openstreetmap.org/**", lambda route: route.fulfill(
            body=PIXEL, content_type="image/png"))
        if cache:
            page.route(re.compile(r"^https://(?:unpkg\.com|cdn\.jsdelivr\.net)/"),
                       lambda route: serve_cdn_from_cache(route, cache))

        try:
            page.goto(site, wait_until="domcontentloaded", timeout=120_000)
            page.wait_for_function(
                "() => typeof clusterLayer !== 'undefined' && "
                "!!document.querySelector('.leaflet-marker-pane .leaflet-marker-icon')",
                timeout=120_000)
            inventory = page.evaluate("""() => ({
                records: data.length,
                ids: new Set(data.map(x => x.id)).size,
                layerMarkers: clusterLayer.getLayers().length,
                verified: window.ATLAS_VERIFIED_SPAIN_STATS.sourceRows
            })""")
            assert inventory == {
                "records": RECORDS, "ids": RECORDS, "layerMarkers": RECORDS, "verified": VERIFIED_ROWS
            }, inventory
            counter = page.locator('[data-live-stat="institutions"] strong').first
            assert int(re.sub(r"\D", "", counter.inner_text())) == RECORDS
            # Confirm at least one symbol actually intersects the visible map.
            visible_icons = page.locator(".leaflet-marker-pane .leaflet-marker-icon").evaluate_all(
                """els => els.filter(el => {
                    const rect = el.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0 && rect.right > 0 &&
                        rect.bottom > 0 && rect.left < innerWidth && rect.top < innerHeight;
                }).length""")
            assert visible_icons > 0, "No institution or cluster in the initial viewport"
            declared = page.locator("script[src]").evaluate_all(
                "els => els.filter(el => new URL(el.src).origin === location.origin)"
                ".map(el => new URL(el.src).pathname)")
            resources = set(declared) | {"/data/pilot-city-points.json"}
            missing = [path for path in sorted(resources) if seen.get(path) != 200]
            assert not missing, f"Required scripts or data were not loaded: {missing}"

            query = page.locator("#q")
            query.fill("Colegio Romareda")
            result = page.locator("#searchSuggest button").filter(has_text="Colegio Romareda").first
            if context_options.get("has_touch"):
                result.tap()
            else:
                result.click()
            expect(page.locator("#detail h2")).to_have_text("Colegio Romareda")
            # Known coordinates from the official Aragón import, checked after the animation.
            page.wait_for_function("""() => map.getZoom() === 15 &&
                map.getCenter().distanceTo([41.634533, -0.9059045]) < 60""")
            expect(page.locator("#detail .profileAddress")).to_contain_text("50009 Zaragoza")
            page.locator("#close").click()
            # Activate the actual on-map marker at the searched coordinates.
            # A few other schools may also be visible at city-block zoom.
            point = page.evaluate("""() => {
                const p = map.latLngToContainerPoint([41.634533, -0.9059045]);
                const r = map.getContainer().getBoundingClientRect();
                return {x: p.x + r.left, y: p.y + r.top};
            }""")
            if context_options.get("has_touch"):
                page.touchscreen.tap(point["x"], point["y"])
            else:
                page.mouse.click(point["x"], point["y"])
            expect(page.locator("#detail h2")).to_be_visible()
            expect(page.locator("#detail h2")).to_have_text("Colegio Romareda")
            page.locator("#close").click()

            query.fill("Bratislava")
            query.press("Enter")
            expect(page.locator("#detail .placeDirectory h2")).to_have_text("Bratislava")
            assert int(page.locator("#detail .dirHeadline strong").inner_text()) == 23
            page.wait_for_function("""() => map.getZoom() <= 12 &&
                map.getBounds().contains([48.140423, 17.115837])""")
            assert not errors, errors
            print(json.dumps({"profile": label, **inventory, "symbolsInViewport": visible_icons,
                              "resourcesChecked": len(resources), "errors": errors}), flush=True)
            if check_globe:
                page.locator("#close").click()
                check_globe_navigation(page)
                print("Optional globe navigation passed", flush=True)
        except Exception:
            print(f"{label} diagnostics: {errors}", flush=True)
            raise


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--chromium")
    parser.add_argument("--cache-cdn", type=Path)
    parser.add_argument("--only-2d", action="store_true",
                        help="Only run the healthy 2D flows (for comparing older revisions)")
    args = parser.parse_args()
    if args.cache_cdn:
        args.cache_cdn.mkdir(parents=True, exist_ok=True)
    handler = partial(QuietHandler, directory=str(args.root))
    with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with sync_playwright() as playwright:
                with playwright.chromium.launch(executable_path=args.chromium) as browser:
                    site = f"http://127.0.0.1:{server.server_port}/"
                    check_page(browser, site, "desktop", {"viewport": {"width": 1365, "height": 900}},
                               args.cache_cdn, check_globe=not args.only_2d)
                    check_page(browser, site, "mobile", playwright.devices["Pixel 7"], args.cache_cdn)
                    if not args.only_2d:
                        from browser_recovery import check_load_recovery
                        check_load_recovery(browser, site, args.cache_cdn)
        finally:
            server.shutdown()
            thread.join()


if __name__ == "__main__":
    main()
