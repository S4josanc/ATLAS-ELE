"""Exercise the optional globe download without needing WebGL or a live CDN."""
from playwright.sync_api import expect


def check_globe_navigation(page):
    url = "https://unpkg.com/globe.gl"
    pending, errors, alerts = [], [], []
    page.route(url, lambda route: pending.append(route))
    page.on("pageerror", lambda exc: errors.append(str(exc)))

    def dismiss(dialog):
        alerts.append(dialog.message)
        dialog.dismiss()

    page.on("dialog", dismiss)
    globe = page.locator("#globe3d")
    flat = page.locator("#map2d")
    if page.locator("#panel.open").count():
        page.locator("#close").click()

    def hold_download():
        with page.expect_request(url):
            globe.click()
        # Keep the real script request pending beyond the old 50 ms resize timer.
        page.evaluate("() => new Promise(resolve => setTimeout(resolve, 150))")
        assert len(pending) == 1
        return pending.pop()

    def fail(route):
        route.abort("failed")
        page.wait_for_function("url => !lazyScripts[url]", arg=url)

    request = hold_download()
    flat.click()
    fail(request)
    assert not alerts and not errors, (alerts, errors)

    fail(hold_download())
    expect(flat).to_have_class("active")
    assert len(alerts) == 1, alerts

    # Satisfy the next request with a renderer double. The app still runs its
    # real loader, controls, initGlobe, point grouping and size calculation.
    request = hold_download()
    flat.click()
    request.fulfill(content_type="application/javascript", body="""
        window.Globe = () => el => {
            const calls = window.testGlobe = {};
            const controls = {};
            const renderer = new Proxy({}, {get(_, key) {
                if (key === 'controls') return () => controls;
                return value => {calls[key] = value; return renderer};
            }});
            return renderer;
        };
    """)
    page.wait_for_function("() => typeof Globe === 'function'")
    assert page.evaluate("() => globeInstance === null"), "Cancelled view created a globe"
    globe.click()
    page.wait_for_function("() => window.testGlobe?.width > 0 && window.testGlobe?.height > 0")
    assert page.evaluate("() => testGlobe.pointsData.length > 0")
    flat.click()
    expect(page.locator("#map2d")).to_have_class("active")
    assert len(alerts) == 1 and not errors, (alerts, errors)
