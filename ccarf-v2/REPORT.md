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


## Load-time fix (2026-11-01, 13:15)

Measured from outside before the fix: the module graph loaded in three sequential round trips (app.js → 11 modules → three.js), each ~600 ms over the home uplink, and nothing painted until all of it arrived: levels visible after 3.4 s. Changes (v2.1.1, live now):

- `modulepreload` hints for every module, so the whole graph downloads in one wave.
- The 3D stage (three.js) loads after the first paint; calls made before it is ready are queued and replayed in order. The clipboard shows a static skeleton immediately.
- ETag / Last-Modified with 304 revalidation for app files; vendor files immutable for 7 days.

After: levels visible after 1.1–1.3 s, 3D ready after 2.1–2.8 s; repeat visits paint in well under a second. Zero console errors.

**Local access:** from inside your LAN, `ccarf2.perfectai.tech` goes out to your public IP and back through the router (NAT hairpin), which on your router drops large responses (the question bank failed with "Failed to fetch"; the old site's bank timed out from the PC too). On the PC use **http://localhost:8790**; phones on Wi-Fi are affected the same way until they leave the Wi-Fi or you add a local DNS override.

**Collateral during the restart:** my process filter for the v2 server (`server.mjs`, not `perfectai-api`) also matched three helper processes of the OpenAI Codex app (`cua_node ... ./server.mjs`) and stopped them. Restart the Codex app if its tools misbehave. The live site's process was not touched.

## AI-first layer (2026-11-01, afternoon; v2.1.4)

Requested: "the AI tutor as an AI-first website for the entire site". Implemented as a layer rather than a page:

- `index.html`: a sticky **Patch dock** (portrait, speech line, ask bar) at the top of the clipboard on every view; the old Ask tab is now a conversation drawer (`#view-ask`) that opens over the current view and closes back to it. Deep link: `#missions/ask`, `#quiz/ask`, etc.
- `app.js`: `askPatch(text)` is the single entry point for the bar, the home chips, the mission debrief, the builder report and the per-question button. `routeIntent()` handles plain-language commands locally (navigation, play level N / a named incident, builder scenario, quiz modes and exam domains, weakest-domain drill, progress report). Everything else streams from the local model with `askContext()` attached: section, mission step history and pages, design order and failing stress tests, or the current question (marked "not answered yet" so Patch does not reveal the key). `stageIsFree()` keeps the mission/design on the 3D table while Patch answers; on the home, quiz and settings views the conceptual scene illustrates the answer as before.
- `chat.js`: the input and send button live outside the drawer; contextual suggestion chips per view; `local()` bubbles for studio-answered questions, labelled "no model call"; one Ask/Stop control.
- `quiz.js`: `start(mode, domain)` and `current()` exposed; new `exam` mode drills one published domain (D1–D5); answers now record their exam domain so "quiz me on my weakest domain" works.
- `persona.js`: Patch knows the three rooms, anchors on the context line, and will not name the exact next button in a mission.
- Verified headless (desktop 1440×900 and mobile 390×844, fake model): "quiz me on MCP" opens a D4 drill; "play level 3" starts the refund incident; asking mid-mission opens the drawer, keeps "Level 3" on the stage, and the request carries the mission context; closing returns to the live mission; "how am I doing?" answers locally.

## Deployment of v2.1.4 (2026-11-01, 14:34–14:40)

- Static files: `ccarf2-deploy.cmd` (Demo folder) downloaded the transfer branch, robocopied into the install folder, rewrote `run.cmd` with `MAX_TOKENS=2200`, stopped the old loop and started a new one. The old node (v2.1.1) survived the first pass because its command line has two spaces (`node.exe"  server.mjs`).
- `ccarf2-fix.cmd` then stopped the processes whose command line ends in `server.mjs`. That hit the studio's old node **and three OpenAI Codex computer-use helper processes** (`cua_node\…\node.exe ./server.mjs`). The api.perfectai.tech service (`perfectai-api\server.mjs`) was not touched. Codex restarts its helpers on demand; if a Codex session was open it may need to be restarted. The installer now stops only the node whose parent is the studio's own `run.cmd` loop (see deploy/README.md).
- Live after the fix: `/api/health` → version 2.1.4, maxTokens 2200, keepWarm "warm"; `/js/app.js` and `/` serve the AI-first build.

## v2.1.4 follow-up (15:30): full test, inline tutor, network errors

- Full test mode: all 200 questions once, resumable (`store.quiz.full`), per-domain breakdown at the end; 100 XP on completion.
- Inline tutor per question (`quiz.js mountTutor`, reusing `mountAsk`): hint chips before answering, why-wrong / why-right / example / memory-hook chips after; context switches from "NOT answered yet, do not reveal" to "learner chose X". Digits typed into the tutor box no longer answer the question.
- Bug fixed: options are shuffled and relabelled A–D, but the verdict and the Patch prompt used the bank's original letter, so "The keyed answer is C" could point at the wrong option. Both now use the on-screen letter.
- Ask Patch: a request that fails at the network level is retried once automatically; a second failure shows "Could not reach the studio server" plus, off-localhost, the hint to use http://localhost:8790 on the host PC. A tab running an older build shows a "newer version is live · Reload" bar.
- Tests: tests/e2e_tutor.py and tests/e2e_network.py (desktop + mobile), plus the existing suites, all clean.

## Not done

No model comparison (4B vs 8B), no checkpoint-lineage check, no training. Rated answers now accumulate in `data/feedback.jsonl` as reviewable candidates for a future, properly licensed fine-tuning run.
