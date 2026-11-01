# Network-failure handling in Ask Patch, and the stale-build reload bar.
import asyncio, json, sys
from playwright.async_api import async_playwright
B = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8792'
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1440, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    state = {'drops': 1}
    async def chat(route):
      if state['drops'] > 0: state['drops'] -= 1; await route.abort('connectionreset')
      else: await route.continue_()
    await pg.route('**/api/chat', chat)
    await pg.goto(B + '/#missions'); await pg.wait_for_timeout(1200)
    # 1) one dropped request: retried by itself, answer arrives, no error shown
    await pg.fill('#ask-input', 'How do I defend an agent against instructions hidden in a document?'); await pg.keyboard.press('Enter')
    await pg.locator('.msg.assistant').last.locator('.msg-meta:has-text(" s")').wait_for(timeout=15000)
    r1 = {'bubbles': await pg.locator('.msg.assistant').count(), 'errors_shown': await pg.locator('.error-line').count()}
    # 2) two drops in a row: plain-language message plus Try again, which then works
    state['drops'] = 2
    await pg.fill('#ask-input', 'Explain retries'); await pg.keyboard.press('Enter')
    await pg.wait_for_selector('.error-line', timeout=10000)
    r2 = {'message': await pg.locator('.error-line').last.inner_text(), 'busy_after': await pg.inner_text('#ask-send')}
    await pg.locator('.msg.assistant').last.locator('button:has-text("Try again")').click()
    await pg.locator('.msg.assistant').last.locator('.msg-meta:has-text(" s")').wait_for(timeout=15000)
    r2['try_again_ok'] = await pg.locator('.msg.assistant').last.locator('.error-line').count() == 0
    # 3) stale tab: server reports a newer build
    async def health(route):
      resp = await route.fetch(); j = await resp.json(); j['version'] = '9.9.9'; await route.fulfill(response=resp, body=json.dumps(j))
    await pg.route('**/api/health', health); await pg.reload(); await pg.wait_for_timeout(1200)
    r3 = await pg.locator('#stale-bar').inner_text() if await pg.locator('#stale-bar').count() else None
    print(json.dumps({'one_drop': r1, 'two_drops': r2, 'stale_bar': r3, 'page_errors': errs}, indent=1))
    await b.close()
asyncio.run(main())
