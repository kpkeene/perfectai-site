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

## Not verified here (needs your machine)

1. **The real 4B model.** All answers came from a fake streamer. Humor and accuracy on your llama.cpp model are untested.
2. **GPU performance.** Software rendering here is meaningless; use Settings → *Measure for 8 seconds* while Patch is generating.
3. **Windows service and Caddy.** `deploy/install.ps1` and the Caddy block were written, not run.
4. **Importing old-site progress.** The old site's storage keys are unknown; the importer matches question-ID lists under keys mentioning bookmarks or mistakes.

## Question bank: v3 shipped

`data/questions.json` is now the v3 rewrite (`data/questions.v3.json`; the live v2 bank stays in `data/questions.live-snapshot.json`). Independent checks I ran on the output, not on the author's report: 200 ids unchanged, 20 per domain, keys 50/50/50/50, every item's options within a 1.35× length ratio, key is the longest option in 49/200 (24.5%; was 96/200), key is the only option with a safeguard word in 4 items (was ~39), no near-duplicate stems, every option has a rationale.

- All 200 items had their options rewritten with plausible distractors; keys were re-dealt by a seeded balanced shuffle.
- 3 ambiguous items reworded or replaced, P200-092 re-filed, 5 weak-distractor items fixed, citation mismatches corrected.
- 26 off-blueprint items replaced with new items on tool_choice, Message Batches, extended thinking, prompt caching, structured outputs, citations, the Agent SDK, MCP authorization/sampling/elicitation/roots, `.mcp.json`, CLAUDE.md hierarchy and imports, plan mode, slash commands, subagents and hooks. Each cites the official page it was checked against on 2026-11-01 (`data/v3-changelog.md`, with its own caveats section).
- Still assistant-reviewed only: no independent expert or psychometric validation. I spot-checked four items by hand.

## Deployment

- DNS: `A ccarf2.perfectai.tech → 75.46.228.209` (same as `ccarf`), TTL 600. Added at Porkbun on 2026-11-01 with your approval.
- Files, service and Caddy: see the final message for what was actually done on your PC.
- Rollback: `.\deploy\install.ps1 -Uninstall`, remove the Caddy block, reload Caddy, delete the DNS record.

## Not done

No model comparison (4B vs 8B), no checkpoint-lineage check, no training. Rated answers now accumulate in `data/feedback.jsonl` as reviewable candidates for a future, properly licensed fine-tuning run.
