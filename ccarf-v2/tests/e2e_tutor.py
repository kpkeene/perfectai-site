# Questions: full 200-question test with resume, and the inline Patch tutor under each question.
import asyncio, json, sys
from playwright.async_api import async_playwright
B = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8792'
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(); res = {}
    for name, vw, vh in [('desktop', 1440, 900), ('mobile', 390, 844)]:
      ctx = await b.new_context(viewport={'width': vw, 'height': vh}); pg = await ctx.new_page(); errs = []; sent = []
      pg.on('pageerror', lambda e: errs.append(str(e)))
      pg.on('request', lambda r: sent.append(json.loads(r.post_data or '{}')) if r.url.endswith('/api/chat') and r.method == 'POST' else None)
      await pg.goto(B + '/#quiz'); await pg.wait_for_selector('[data-mode="all"]')
      r = {'full_button': await pg.inner_text('[data-mode="all"]')}
      await pg.click('[data-mode="all"]'); await pg.wait_for_selector('.tutor')
      r['counter'] = await pg.inner_text('.quiz-top .fine')
      # typing a digit into Patch's box must not answer
      await pg.fill('#tutor-input', ''); await pg.click('#tutor-input'); await pg.keyboard.type('1')
      r['digit_answered'] = await pg.locator('.option[disabled]').count() > 0
      await pg.fill('#tutor-input', 'Give me a hint without revealing the answer'); await pg.keyboard.press('Enter')
      await pg.wait_for_timeout(300); await pg.wait_for_function("() => document.querySelector('.tutor-send').textContent === 'Ask' && !document.querySelector('.tutor .wait-line')", timeout=20000)
      r['hint_context_no_spoiler'] = 'NOT answered' in sent[-1]['context']
      # answer with the first option, check the verdict letter points at the highlighted option
      await pg.click('.option >> nth=0'); await pg.wait_for_selector('.verdict')
      v = await pg.inner_text('.verdict'); green = await pg.inner_text('.option.is-correct .opt-key')
      r['verdict'] = v; r['verdict_letter_matches'] = v == 'Correct.' or v.strip().endswith(green + '.')
      r['chips_after'] = await pg.locator('.tutor .chip-btn').all_inner_texts()
      await pg.click('.ask-q')
      await pg.wait_for_timeout(300); await pg.wait_for_function("() => document.querySelector('.tutor-send').textContent === 'Ask' && !document.querySelector('.tutor .wait-line')", timeout=20000)
      await pg.locator('.tutor .chip-btn').first.click()
      await pg.wait_for_timeout(300); await pg.wait_for_function("() => document.querySelector('.tutor-send').textContent === 'Ask' && !document.querySelector('.tutor .wait-line')", timeout=20000)
      r['thread_answers'] = await pg.locator('.tutor .msg.assistant').count()
      r['followup_history_turns'] = len(sent[-1]['messages'])
      r['followup_context_answered'] = 'learner chose' in sent[-1]['context']
      await pg.screenshot(path=f'tests/shots/{name}-tutor.png', full_page=True)
      # resume
      await pg.click('.next'); await pg.wait_for_selector('.tutor'); await pg.reload(); await pg.wait_for_selector('[data-mode="all"]')
      r['resume_button'] = await pg.inner_text('[data-mode="all"]')
      await pg.click('[data-mode="all"]'); await pg.wait_for_selector('.quiz-top'); r['resumed_counter'] = await pg.inner_text('.quiz-top .fine')
      r['errors'] = errs; res[name] = r; await ctx.close()
    print(json.dumps(res, indent=1)); await b.close()
asyncio.run(main())
