import asyncio, json, sys
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8792'
OUT = 'tests/shots'

async def overlaps(page):
    return await page.evaluate('''() => {
      const els=[...document.querySelectorAll('.node-label:not(.hidden)')].map(e=>e.getBoundingClientRect());
      let n=0; for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){const a=els[i],b=els[j]; if(a.left<b.right-2&&a.right>b.left+2&&a.top<b.bottom-2&&a.bottom>b.top+2)n++}
      return {visible:els.length, total:document.querySelectorAll('.node-label').length, overlaps:n};
    }''')

async def run(p, name, vw, vh, mobile=False):
    b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    ctx = await b.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=1, has_touch=mobile, is_mobile=mobile)
    page = await ctx.new_page(); errors = []
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))
    await page.goto(BASE + '/#missions'); await page.wait_for_timeout(2500)
    res = {'webgl': await page.evaluate('!window.__studio.stage.failed')}
    await page.screenshot(path=f'{OUT}/{name}-1-home.png')
    res['home_labels'] = await overlaps(page)
    # Mission 1: play a full good run
    await page.click('[data-mission="late-valve"]'); await page.wait_for_timeout(1800)
    for a in ['search', 'po', 'schedule', 'quotes']:
        await page.wait_for_selector(f'[data-action="{a}"]:not([disabled])', timeout=20000); await page.click(f'[data-action="{a}"]')
    await page.wait_for_timeout(900)
    await page.screenshot(path=f'{OUT}/{name}-2-mission-mid.png')
    res['mission_labels'] = await overlaps(page)
    # blocked write attempt before approval
    await page.wait_for_selector('[data-action="write"]:not([disabled])', timeout=20000); await page.click('[data-action="write"]')
    await page.wait_for_timeout(1300); await page.screenshot(path=f'{OUT}/{name}-3-blocked.png')
    for a in ['retry-backoff', 'compare', 'approve-expedite', 'write', 'finish']:
        await page.wait_for_selector(f'[data-action="{a}"]:not([disabled])', timeout=25000); await page.click(f'[data-action="{a}"]')
    await page.wait_for_selector('.debrief', timeout=10000)
    res['m1_grade'] = await page.inner_text('.debrief .stamp'); res['m1_caption'] = await page.inner_text('#caption')
    await page.screenshot(path=f'{OUT}/{name}-4-debrief.png', full_page=mobile)
    # player controls
    await page.click('#btn-prev'); await page.wait_for_timeout(300); res['after_prev'] = await page.inner_text('#step-count')
    # builder
    await page.click('.nav [data-view="builder"]'); await page.wait_for_timeout(800)
    await page.click('#b-example'); await page.wait_for_timeout(500)
    await page.click('#b-inspect'); await page.wait_for_timeout(2500)
    res['builder_verdict'] = await page.inner_text('.report .stamp')
    await page.screenshot(path=f'{OUT}/{name}-5-builder.png')
    res['builder_labels'] = await overlaps(page)
    # keyboard: remove policy via keyboard, check verdict drops
    slot = page.locator('#pipeline .slot', has_text='Permission policy hook'); await slot.focus(); await page.keyboard.press('Delete')
    await page.click('#b-inspect'); await page.wait_for_timeout(400); res['builder_without_policy'] = await page.inner_text('.report .stamp')
    # alt-arrow move
    first = page.locator('#pipeline .slot').nth(2); await first.focus(); await page.keyboard.press('Alt+ArrowUp'); await page.wait_for_timeout(200)
    res['moved_focus'] = await page.evaluate('document.activeElement.dataset.i')
    # expanded + 2d
    await page.click('#btn-expand'); await page.wait_for_timeout(700); await page.screenshot(path=f'{OUT}/{name}-6-wide.png')
    await page.click('#btn-expand'); await page.click('#btn-2d'); await page.wait_for_timeout(500); await page.screenshot(path=f'{OUT}/{name}-7-2d.png'); await page.click('#btn-2d')
    # quiz
    await page.click('.nav [data-view="quiz"]'); await page.wait_for_selector('[data-mode="weighted"]'); await page.click('[data-mode="weighted"]')
    await page.keyboard.press('2'); await page.wait_for_timeout(300)
    res['quiz_after'] = await page.inner_text('.verdict')
    await page.click('.bm'); await page.screenshot(path=f'{OUT}/{name}-8-quiz.png', full_page=mobile)
    # ask (fake model streaming)
    await page.click('.nav [data-view="ask"]'); await page.wait_for_timeout(600)
    await page.fill('#ask-input', 'When does a write tool need approval?'); await page.keyboard.press('Enter')
    await page.wait_for_timeout(900); res['quip_mid'] = await page.inner_text('#patch-line'); res['tag_mid'] = await page.inner_text('#patch-tag')
    await page.screenshot(path=f'{OUT}/{name}-9-ask-streaming.png')
    await page.wait_for_selector('.msg.assistant .msg-meta:has-text(" s")', timeout=15000); await page.wait_for_timeout(2500)
    res['answer_has_think'] = 'secret' in (await page.inner_text('.msg.assistant'))
    res['scene_steps'] = await page.evaluate('document.querySelectorAll("#steps-list li").length')
    await page.screenshot(path=f'{OUT}/{name}-10-ask-done.png')
    # cancel test
    await page.fill('#ask-input', 'Explain retries'); await page.keyboard.press('Enter'); await page.wait_for_timeout(400); await page.click('.stop'); await page.wait_for_timeout(500)
    res['cancel_text'] = await page.locator('.msg.assistant').last.inner_text()
    # persistence across reload
    await page.reload(); await page.wait_for_timeout(1200)
    res['persist'] = await page.evaluate('({xp: window.__studio.store.progress.xp, m: Object.keys(window.__studio.store.progress.missions), bm: window.__studio.store.quiz.bookmarks.length, ans: Object.keys(window.__studio.store.quiz.answers).length})')
    res['render_stats'] = await page.evaluate('window.__studio.stage.stats()')
    res['errors'] = errors[:10]
    await b.close(); return res

async def main():
    async with async_playwright() as p:
        for name, w, h, m in [('desktop', 1440, 900, False), ('mobile', 390, 844, True)]:
            r = await run(p, name, w, h, m); print(name, json.dumps(r, indent=1))
asyncio.run(main())
