"""Footer UI verification: line art divider + brand-colored social icons."""
import asyncio
from playwright.async_api import async_playwright

URL = "https://registration-manager.preview.emergentagent.com/"


async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1920, "height": 4000})
        page = await context.new_page()

        page.on("console", lambda msg: print("CONSOLE-ERR:", msg.text) if msg.type == "error" else None)

        print("== DESKTOP 1920 ==")
        await page.goto(URL, wait_until="networkidle", timeout=30000)
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(2000)

        lineart = await page.query_selector('[data-testid="footer-lineart"]')
        print("footer-lineart present:", bool(lineart))
        if lineart:
            print("lineart bbox:", await lineart.bounding_box())

        img_js = """() => {
            const w = document.querySelector('[data-testid=\"footer-lineart\"]');
            if(!w) return null;
            const i = w.querySelector('img');
            if(!i) return {hasImg:false};
            return {hasImg:true, src:i.src, nw:i.naturalWidth, nh:i.naturalHeight,
                    complete:i.complete, opacity:getComputedStyle(i).opacity,
                    filter:getComputedStyle(i).filter};
        }"""
        info = await page.evaluate(img_js)
        print("lineart img info:", info)

        social_js = """() => {
            const keys = ['facebook','twitter','linkedin','youtube','instagram'];
            return keys.map(k => {
                const a = document.querySelector('[data-testid=\"social-'+k+'\"]');
                if(!a) return {k:k, present:false};
                const svg = a.querySelector('svg');
                return {k:k, present:true, visible:a.offsetParent!==null,
                        href:a.getAttribute('href'),
                        fill:svg?svg.getAttribute('fill'):null,
                        w:svg?svg.getAttribute('width'):null};
            });
        }"""
        social = await page.evaluate(social_js)
        for s in social:
            print("social:", s)

        cp_js = """() => {
            const f = document.querySelector('footer');
            if(!f) return null;
            const ds = f.querySelectorAll('div');
            for(const d of ds){
                const bg = getComputedStyle(d).backgroundColor;
                if(bg === 'rgb(9, 31, 50)')
                    return {bg:bg, text:(d.textContent||'').slice(0,80)};
            }
            return null;
        }"""
        cp = await page.evaluate(cp_js)
        print("copyright bar #091f32:", cp)

        order_js = """() => {
            const f = document.querySelector('footer');
            return Array.from(f.children).map(c => ({
                tag:c.tagName,
                testid:c.getAttribute('data-testid'),
                bg:getComputedStyle(c).backgroundColor,
                preview:(c.textContent||'').slice(0,40)
            }));
        }"""
        order = await page.evaluate(order_js)
        print("Footer top-level children order:")
        for i, c in enumerate(order):
            print("  [", i, "]", c)

        await page.screenshot(path="/app/.screenshots/footer_desktop.jpg", quality=40,
                              full_page=False, type="jpeg",
                              clip={"x": 0, "y": 3100, "width": 1920, "height": 900})
        print("desktop screenshot saved")

        print("\n== MOBILE 390 ==")
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.goto(URL, wait_until="networkidle", timeout=30000)
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(1500)

        mob = await page.query_selector('[data-testid="footer-lineart"]')
        print("MOBILE lineart present:", bool(mob))
        if mob:
            print("mob bbox:", await mob.bounding_box())

        for k in ["facebook", "twitter", "linkedin", "youtube", "instagram"]:
            sel = '[data-testid="social-' + k + '"]'
            el = await page.query_selector(sel)
            vis = (await el.is_visible()) if el else False
            print("MOBILE social-" + k, "present:", bool(el), "visible:", vis)

        # Full footer height on mobile
        mob_footer_box = await page.evaluate("() => { const f = document.querySelector('footer'); if(!f) return null; const r = f.getBoundingClientRect(); return {top:r.top, bottom:r.bottom, height:r.height}; }")
        print("mobile footer rect:", mob_footer_box)

        await page.screenshot(path="/app/.screenshots/footer_mobile.jpg",
                              quality=40, full_page=False, type="jpeg")
        print("mobile screenshot saved")

        await browser.close()


if __name__ == "__main__":
    asyncio.run(run())
