# Deploying v2 beside the current site

Target: `https://ccarf2.perfectai.tech` → Caddy → `127.0.0.1:8790` → `node server.mjs` → your local llama.cpp server.

1. **DNS (Porkbun):** add an `A` record, host `ccarf2`, same address as the existing `ccarf` record. If `ccarf` is a `CNAME` to a dynamic-DNS name, make `ccarf2` the same `CNAME`.
2. **Server:** from the `ccarf-v2` folder in PowerShell:
   ```powershell
   .\deploy\install.ps1 -ModelBase "http://127.0.0.1:8080/v1" -ModelName "<name llama.cpp expects>" -ModelLabel "Local 4B"
   ```
   This registers a logon task that keeps `node server.mjs` running (auto-restart loop, logs in `logs\server.log`).
3. **Caddy:** append `deploy\Caddyfile.ccarf2.txt` to your Caddyfile and reload. Caddy fetches the certificate automatically because ports 80/443 are already open for the existing site.
4. **Check:** open `https://ccarf2.perfectai.tech/api/health`. `demo` must be `false` and `model` must show your label.

`flush_interval -1` keeps the token stream unbuffered through the proxy. `TRUST_PROXY=1` makes rate limits use the real client address from `X-Forwarded-For`.

Optional protection for a public URL: `-AccessCode "<secret>"` makes chat (not missions, builder or quiz) require a code that visitors enter once in Settings. `-DailyCharBudget` caps total generated characters per day.

Rollback: `.\deploy\install.ps1 -Uninstall`, remove the Caddy block, reload Caddy, delete the DNS record.


## Restarting the server after an update

`run.cmd` keeps node alive in a loop, so to pick up a new `server.mjs` stop both the loop and its node, then start `run.cmd` again. The node process to stop is the one **whose parent is that loop** (command line `"C:\Program Files\nodejs\node.exe"  server.mjs`). Do not match on `server.mjs` alone: OpenAI Codex's computer-use helpers also run a `./server.mjs` under `cua_node`, and the api.perfectai.tech service runs `perfectai-api\server.mjs`. `deploy\install.ps1` (and `-Uninstall`) use the parent-process rule.


## Using Gemini on Vertex AI instead of the local model

1. Get a Vertex AI **express mode** API key (Google Cloud console, signed in with the Google account you want billed or on the free express quota).
2. Run `deploy\switch-to-vertex.cmd`. It asks for the key with hidden input, tests `gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-3-flash` and `gemini-2.5-flash` in that order, stores the key in `%USERPROFILE%\.ccarf2\vertex.key` (outside the site folder; never served or logged), backs up `run.cmd` to `run.local.cmd`, writes a Vertex `run.cmd`, restarts only the studio, and asks Ollama to unload `gemma4:e4b`.
3. To go back: `deploy\switch-to-local.cmd`.

Server settings for Vertex: `MODEL_PROVIDER=vertex`, `VERTEX_KEY_FILE` (or `VERTEX_KEY`), `VERTEX_MODEL` (default read from `vertex.model` next to the key, else `gemini-3-flash`), `MAX_TOKENS` (default 4096), `CONCURRENCY` (default 4), `VERTEX_BASE` (for tests). The adapter calls `https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:streamGenerateContent?alt=sse` with the key in the `x-goog-api-key` header. Thought parts are dropped; `MAX_TOKENS` finish shows the Continue button; safety blocks and 401/403/404/429 become plain error messages.

Cost control: `DAILY_CHAR_BUDGET=4000000` generated characters per UTC day (about 1M output tokens) and `RATE_PER_MIN=12` per visitor. With the express-mode free quota you hit Google's limits first; with billing enabled, set a budget alert in Google Cloud too.
