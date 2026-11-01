# Architect Studio v2 · night shift (local preview, not live)

A rebuilt study game for the Claude Certified Architect – Foundations exam. It is a separate
folder from `ccarf-4b-architect` and runs on its own port. Nothing here touches Caddy, DNS,
`api.perfectai.tech`, the router, credentials, or the live site.

## Run it (Windows, PowerShell)

Node 18+ is the only requirement. No `npm install`; three.js is vendored in `public/vendor` (MIT).

```powershell
cd ccarf-v2
# Point at the SAME local model server the live app uses (OpenAI-compatible /v1 endpoint).
# Typical defaults: llama.cpp server http://127.0.0.1:8080/v1 · LM Studio http://127.0.0.1:1234/v1 · Ollama http://127.0.0.1:11434/v1
$env:MODEL_BASE = "http://127.0.0.1:8080/v1"
$env:MODEL_NAME = "qwen3-4b"          # whatever name your server expects
$env:MODEL_LABEL = "Local 4B"         # what the UI shows; keep it accurate
node server.mjs                        # → http://127.0.0.1:8790
```

Without `MODEL_BASE`, chat runs in **demo mode** with scripted answers. The UI labels them
as scripted samples.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` / `HOST` | `8790` / `127.0.0.1` | Loopback only by default |
| `MODEL_BASE` | unset (demo mode) | OpenAI-compatible base URL of your local model server |
| `MODEL_KEY` | unset | Only if your local server requires a bearer token |
| `NO_THINK` | `1` | Prepends `/no_think` (Qwen3). Thinking text is also stripped server-side and never shown |
| `MAX_TOKENS` | `1400` (capped at 2400) | Safe generation limit; answers are always "detailed" |
| `QUESTIONS_FILE` | `data/questions.json` | Practice bank (same schema as the live `/api/questions`) |
| `QUESTIONS_URL` | unset | Alternative: fetch the bank from a URL |
| `TRUST_PROXY` | unset | Set to `1` behind Caddy so rate limits use `X-Forwarded-For` |
| `RATE_PER_MIN` | `8` | Chat requests per minute per client address |
| `DAILY_CHAR_BUDGET` | `1500000` | Generated characters per UTC day across all visitors; then chat pauses until midnight |
| `ACCESS_CODE` | unset | If set, chat and feedback require this code (entered once in Settings) |
| `FEEDBACK_FILE` | `data/feedback.jsonl` | Where rated answers are appended |

Deployment behind Caddy on a new subdomain: see `deploy/README.md`.

`data/questions.json` is a snapshot of the live bank downloaded on 2026-11-01 (200 items, same schema).

## What changed from the live version

- **AI-first: Patch is the front door of every page.** The tutor sits at the top of the clipboard on every view with an always-present ask bar (press `/` to focus it). Answers open in a conversation layer over whatever you are doing, and "Back" returns you to the untouched mission, design or question. Patch sees what you are doing (the mission step you are on, your builder design and its last verdict, the practice question in front of you) and anchors answers in it without spoiling scores or keyed answers. The bar also takes orders, handled by the studio itself with no model call: "quiz me on MCP", "play level 3", "review my mistakes", "help me design a refund agent", "how am I doing?" (a progress report from your saved state). While a mission or design is on the table the stage is left alone; otherwise the scene illustrates the answer.
- **Questions: the full 200, with a tutor under each one.** "Full test" runs every question in the bank once, shuffled, and saves your place after each answer so you can stop and resume. Every question has its own Patch thread underneath: ask for a hint before answering (Patch is told not to reveal the letter), then keep asking follow-ups after; the thread remembers the question and the earlier answers. Option letters in the verdict and in Patch's context are the letters you see on screen.
- **Missions you play, not watch.** You choose each tool call. There are five synthetic incidents:
  1. The late valve (evidence, retries, approval before writes)
  2. The context diet (retrieval, stale revisions, compaction, budget)
  3. The refund that talks back (prompt injection, permission hooks)
  4. Friday, 4:55 pm, Claude Code (CLAUDE.md, settings.json deny rules, PreToolUse hooks, subagents, --max-turns)
  5. Three servers walk into a host (MCP stdio vs Streamable HTTP, lifecycle, authorization, isError, untrusted tool output)

  A pager counts the times you got paged (traps and blocked writes). Grades are stamped on the clipboard.
- **Night shift mode** in Boss rush: 12 exam-weighted questions, hardest last, three pages and you're out.
- **Builder budgets.** Each scenario has a cost and latency budget, so "add every safeguard" is no longer the answer. Save designs and compare them.
- **Rated answers → training data.** In Ask Patch, rate an answer (funny / accurate / wrong), add a note, and save it. The server appends it to `data/feedback.jsonl` for review before any fine-tuning.
- **Look.** A lit clipboard beside a night-time site: paper for everything you read, night for everything that moves, rubber stamps for verdicts. Patch is a 24×24 sprite with seven expressions and a blink.

  The transcript shows real Messages API shapes: `tool_use`, `tool_result`, `tool_use_id`, `is_error`, `stop_reason`. Each mission has a deterministic 100-point rubric with more than one valid ending.
- **Builder with stress tests.** Pick from 20 components and order them. The rubric checks ordering (guards before what they guard) and scores safety, grounding, reliability and cost. It then runs four scripted chaos tests per scenario. Several different designs can pass. Mouse drag, touch tap, and keyboard (Alt+↑/↓ to move, Delete to remove) all work.
- **One shared 3D stage.** Procedural studded bricks, round bricks, curved pipes with elbows and collars, original brick-built robots and people, status lamps, an approval barrier arm, and a context-budget tower. Blocked calls physically bounce off the gate in a short, bounded animation.
  - Rendering only runs while something moves.
  - Every step is paced and supports pause, previous, next and replay.
  - Labels avoid each other and compact on phones.
  - There is a wide view, a 2D schematic, a text list of steps, a reduced-motion mode and a low-GPU mode.
  - Rendering is raster (environment reflections plus shadow maps). It is not ray tracing.
- **Patch's personality.** One opening line and one closing line, with at most two jokes, and never inside code or numbers. Humor and detailed answers are always on. Obsolete saved humor or budget settings are ignored. Streaming quips appear in a separate bubble labelled "not the answer, not reasoning".
- **Boss rush.** Exam-weighted 20-question runs (D1 5, D2 4, D3 4, D4 4, D5 3), domain drills, mistake review, bookmarks and streaks. Options are shuffled, and each option shows why it is right or wrong.
- **Server hardening.** One generation at a time (queued), 12 requests/min per IP, 4,000-character input cap, last 8 turns only, client cancel aborts the upstream request, CSP, and path-traversal protection.

## Bring your progress over from the old site

The live site and this preview are different origins, so their browser storage is separate.
On `ccarf.perfectai.tech`, open DevTools → Console and run:

```js
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({...localStorage})]));a.download='ccarf-live-progress.json';a.click();
```

Then in v2: **Settings → Import progress**. Any lists of question IDs stored under keys
mentioning bookmarks or mistakes are merged in. I could not see the live app's storage keys,
so check the counts it reports.

## Tests

```bash
node tests/logic.test.mjs          # mission rubrics and builder verdicts (deterministic)
node tests/fake-model.mjs &        # fake streaming model on :8791 (emits <think> and reasoning_content)
MODEL_BASE=http://127.0.0.1:8791/v1 PORT=8792 node server.mjs &
python3 tests/e2e.py http://127.0.0.1:8792   # Playwright: desktop 1440×900 + mobile 390×844, screenshots in tests/shots
```

## Honest status

See `REPORT.md` for what was verified, what was not, and what needs your decision.
