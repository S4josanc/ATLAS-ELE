"""Exercise recoverable data failures with the real loader and Leaflet.

Run through tests/browser_map.py. The injected failure applies only to the
first navigation. The reload button must start a fresh load of all sources.
"""
from pathlib import PurePosixPath
import re
from urllib.parse import urlsplit

from playwright.sync_api import expect


def check_load_recovery(browser, site, cache):
    from browser_map import PIXEL, RECORDS, VERIFIED_ROWS, serve_cdn_from_cache

    scenarios = [
        ("pilot-city-points.json", "es-ES", "fatal"),
        ("spain-verified-madrid-cyl-public-20261104.js", "en-US", "partial"),
        ("master-pack-1.js", "es-ES", "legacy"),
        ("leaflet.js", "es-ES", "bootstrap"),
        ("leaflet.markercluster.js", "en-US", "bootstrap"),
        ("app.js", "es-ES", "bootstrap"),
    ]
    for filename, locale, mode in scenarios:
        with browser.new_context(locale=locale) as context:
            page = context.new_page()
            requests = []
            route_pattern = re.compile(r"/" + re.escape(filename) + r"(?:\?.*)?$")
            page.on("request", lambda req: requests.append(PurePosixPath(urlsplit(req.url).path).name))
            page.route("https://tile.openstreetmap.org/**", lambda route: route.fulfill(
                body=PIXEL, content_type="image/png"))
            if cache:
                page.route(re.compile(r"^https://(?:unpkg\.com|cdn\.jsdelivr\.net)/"),
                           lambda route: serve_cdn_from_cache(route, cache))
            page.route(route_pattern, lambda route: route.fulfill(status=503, body=""), times=1)
            page.goto(site, wait_until="domcontentloaded", timeout=120_000)
            warning = page.get_by_role("alert").filter(has=page.locator("button"))
            retry = warning.get_by_role("button", name="Recargar mapa" if locale == "es-ES" else "Reload map")
            expect(retry).to_be_visible()
            if mode == "bootstrap":
                first_markers = page.locator(".leaflet-marker-pane .leaflet-marker-icon").count()
            else:
                if mode != "fatal":
                    page.wait_for_function("() => window.ATLAS_VERIFIED_SPAIN_STATS && clusterLayer.getLayers().length")
                first_markers = page.evaluate("clusterLayer.getLayers().length")
            if mode in ("fatal", "bootstrap"):
                assert first_markers == 0
            elif mode == "partial":
                assert 0 < first_markers < RECORDS
            else:
                # This legacy pack already lacks its initial fragment in the audited source.
                assert first_markers == RECORDS

            with page.expect_navigation(wait_until="domcontentloaded", timeout=120_000):
                retry.click()
            page.wait_for_function("() => window.ATLAS_VERIFIED_SPAIN_STATS && clusterLayer.getLayers().length")
            expect(page.locator("#mapLoadWarning")).to_be_hidden()
            inventory = page.evaluate("""() => [data.length, new Set(data.map(x=>x.id)).size,
                clusterLayer.getLayers().length, window.ATLAS_VERIFIED_SPAIN_STATS.sourceRows]""")
            assert inventory == [RECORDS, RECORDS, RECORDS, VERIFIED_ROWS], inventory
            assert requests.count(filename) == 2, requests.count(filename)
            assert requests.count("pilot-city-points.json") == (1 if mode == "bootstrap" else 2)
            print(f"{filename}: {first_markers} markers after HTTP 503; {inventory[2]} after reload",
                  flush=True)
