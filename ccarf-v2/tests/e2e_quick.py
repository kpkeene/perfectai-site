import asyncio, json
from playwright.async_api import async_playwright
B='http://127.0.0.1:8792'
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    d = await b.new_context(viewport={'width':1440,'height':900}); pg = await d.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    await pg.goto(B+'/#missions'); await pg.wait_for_timeout(1500)
    await pg.screenshot(path='tests/shots/q-home.png')
    # Level 4 full good run
    await pg.click('[data-mission="friday-claude-code"]'); await pg.wait_for_timeout(600)
    for a in ['claudemd','deny','hook','subagent','maxturns','ask','finish']:
      await pg.wait_for_selector(f'[data-action="{a}"]:not([disabled])', timeout=30000); await pg.click(f'[data-action="{a}"]')
    await pg.wait_for_selector('.debrief'); await pg.wait_for_timeout(900)
    print('L4', await pg.inner_text('.debrief .stamp'), await pg.inner_text('.hud'))
    await pg.screenshot(path='tests/shots/q-l4-debrief.png')
    # Level 5 with a trap
    await pg.click('#m-next'); await pg.wait_for_timeout(600)
    for a in ['stdio','stdout-logs','init','list','http','localonly','oauth','quarantine','finish']:
      await pg.wait_for_selector(f'[data-action="{a}"]:not([disabled])', timeout=30000); await pg.click(f'[data-action="{a}"]')
    await pg.wait_for_selector('.debrief'); await pg.wait_for_timeout(900)
    print('L5', await pg.inner_text('.debrief .stamp'), await pg.inner_text('.hud'))
    await pg.screenshot(path='tests/shots/q-l5-stage.png', clip={'x':0,'y':60,'width':960,'height':700})
    # builder: save + compare
    await pg.click('.nav [data-view="builder"]'); await pg.wait_for_timeout(500); await pg.click('#b-example'); await pg.click('#b-inspect'); await pg.wait_for_timeout(300)
    pg.on('dialog', lambda dlg: asyncio.ensure_future(dlg.accept('Baseline')))
    await pg.click('#b-save'); await pg.wait_for_timeout(400)
    print('saved', await pg.inner_text('.saved'))
    await pg.screenshot(path='tests/shots/q-builder-report.png')
    # night shift
    await pg.click('.nav [data-view="quiz"]'); await pg.wait_for_selector('[data-mode="shift"]'); await pg.click('[data-mode="shift"]')
    pages=0
    for i in range(12):
      await pg.wait_for_selector('.option'); await pg.keyboard.press('1'); await pg.wait_for_timeout(150)
      t = await pg.inner_text('.quiz-after .verdict'); 
      await pg.click('.next'); await pg.wait_for_timeout(150)
      if await pg.locator('.quiz-results').count(): break
    print('shift result:', (await pg.inner_text('.quiz-results')).split('\n')[:3])
    await pg.screenshot(path='tests/shots/q-shift.png')
    # settings
    await pg.click('.nav [data-view="settings"]'); await pg.wait_for_selector('.about'); await pg.screenshot(path='tests/shots/q-settings.png', full_page=True)
    print('errors', errs); await b.close()
asyncio.run(main())
