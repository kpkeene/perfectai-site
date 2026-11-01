# Architect Studio v2.1: status report (2026-11-01)

## What this is

A rebuilt study game for the Claude Certified Architect – Foundations exam, intended to run at **https://ccarf2.perfectai.tech** beside the current site. Same local 4B model, separate folder, separate port, separate Caddy site block. The current site is untouched.

## Verified in this session (cloud workspace, headless Chromium, fake model server)

| Check | Result |
|---|---|
| Mission rubrics, all five levels (`tests/logic.test.mjs`) | Pass. Each level has more than one route to 100; reckless routes score C. Deterministic. |
| Builder rubric and budgets | Pass. The three example designs ship inside budget; the "every brick" design is over budget and gets *Ship with fixes*; a hook placed after the write gets *Do not ship*. |
| Model proxy against a fake OpenAI-compatible stream | Pass. `<think>` stripped across chunk boundaries, `reasoning_content` dropped, second request queued, bad input rejected, path traversal 404, feedback endpoint validates and appends. |
| Browser end-to-end, desktop 1440×900 and mobile 390×844 | Pass, 0 console errors: five missions playable, pager HUD, stamped grades, builder drag/keyboard/save/compare, night-shift quiz ends after three pages, streaming answer with separate quips, cancel keeps partial text, saved progress survives reload. |
| Label overlap (measured from DOM boxes) | 0 overlaps on desktop; on phones labels compact and hide rather than overlap. |
| Screenshots | `tests/shots/`, reviewed by eye. |

## Verified on your PC (2026-11-01, afternoon)

- Files installed at `C:\Users\kpkee\.gemini\antigravity\scratch\ccarf-v2` (beside the current app), via a temporary branch on `kpkeene/perfectai-site`.
- Model: the live stack is **Ollama** with `gemma4:e4b`, not llama.cpp. v2 points at `http://127.0.0.1:11434/v1`, model `gemma4:e4b`, label "Local Gemma 4 E4B via Ollama", `NO_THINK=0`. One cold request took 67 s to the first token (model load); a warm request from outside took 4.3 s to first token and 8.4 s total for about 2,900 characters. Answer followed the section format with an in-character opening line.
- Caddy: block for `ccarf2.perfectai.tech` appended to `Documents\Codex\2026-10-28\1-x20\outputs\perfectai-api\Caddyfile` (backup `Caddyfile.bak-ccarf2-20261101-092455` beside it), loaded through Caddy's admin API so its own environment resolved the placeholders. Certificate issued. The old site answered 200 from outside before and after.
- Live page loads in a browser with zero console errors, WebGL on, model pill showing the real model, question bank v3 served.

## Not verified / still open

1. **Auto-start at logon.** `schtasks` refused a logon task without admin rights, and the safety check on my side would not let me add a Startup-folder launcher. The server is running now from a minimized Command Prompt window; closing it or rebooting stops it. The fixed `deploy\install.ps1` falls back to a Startup launcher when run by you.
2. **GPU performance under load.** Not measured on the 4090; use Settings → *Measure for 8 seconds* while Patch is generating.
3. **Importing old-site progress.** The old site's storage keys are unknown; the importer matches question-ID lists under keys mentioning bookmarks or mistakes.
4. **Humor quality on Gemma 4 E4B.** One sample read fine but mild. Rate answers in Ask Patch; they accumulate in `data\feedback.jsonl`.

## Question bank: v3 shipped

`data/questions.json` is now the v3 rewrite (`data/questions.v3.json`; the live v2 bank stays in `data/questions.live-snapshot.json`). Independent checks I ran on the output, not on the author's report: 200 ids unchanged, 20 per domain, keys 50/50/50/50, every item's options within a 1.35× length ratio, key is the longest option in 49/200 (24.5%; was 96/200), key is the only option with a safeguard word in 4 items (was ~39), no near-duplicate stems, every option has a rationale.

- All 200 items had their options rewritten with plausible distractors; keys were re-dealt by a seeded balanced shuffle.
- 3 ambiguous items reworded or replaced, P200-092 re-filed, 5 weak-distractor items fixed, citation mismatches corrected.
- 26 off-blueprint items replaced with new items on tool_choice, Message Batches, extended thinking, prompt caching, structured outputs, citations, the Agent SDK, MCP authorization/sampling/elicitation/roots, `.mcp.json`, CLAUDE.md hierarchy and imports, plan mode, slash commands, subagents and hooks. Each cites the official page it was checked against on 2026-11-01 (`data/v3-changelog.md`, with its own caveats section).
- Still assistant-reviewed only: no independent expert or psychometric validation. I spot-checked four items by hand.

## Deployment summary

- DNS: `A ccarf2.perfectai.tech → 75.46.228.209`, TTL 600, added at Porkbun.
- Server: `run.cmd` (restart loop) started by hand; port 8790 on loopback; `TRUST_PROXY=1`, 20 chat requests per minute per address, daily budget set very high (50M characters) per your "no limitations" answer, no access code.
- Caddy: see above. Rollback: remove the `ccarf2.perfectai.tech` block (or copy the `.bak-ccarf2-*` file back), POST it to `http://127.0.0.1:2019/load` as `text/caddyfile` or restart Caddy, close the server window, delete the DNS record.
- Helper files left in `C:\Users\kpkee\Demo`: `ccarf2-setup1.cmd`, `ccarf2-setup2a.cmd`, `ccarf2-setup2b.cmd`, `ccarf2-install.ps1`, three `ccarf2-*.txt` logs, `ccarf2-caddyfile-path.txt`. Safe to delete.
- GitHub: branch `ccarf2-transfer` on `kpkeene/perfectai-site` now holds only a README (the proxy here refuses branch deletion); delete it in GitHub's branch list.

## Not done

No model comparison (4B vs 8B), no checkpoint-lineage check, no training. Rated answers now accumulate in `data/feedback.jsonl` as reviewable candidates for a future, properly licensed fine-tuning run.
