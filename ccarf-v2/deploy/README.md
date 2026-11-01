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
