<#
  Switch ccarf2.perfectai.tech from the local Ollama model to Gemini on Google Vertex AI.

  What it does, in order:
    1. Asks for your Vertex AI API key (hidden input; the key is never printed or logged).
    2. Tests which Gemini model the key can call (tiny request each).
    3. Saves the key to %USERPROFILE%\.ccarf2\vertex.key and the model to vertex.model.
    4. Copies the new build from -Source into the install folder (keeps run.cmd, logs, data).
    5. Backs up run.cmd to run.local.cmd, writes a Vertex run.cmd.
    6. Restarts only the studio: its run.cmd loop and the node that loop started.
    7. Asks Ollama to unload gemma4:e4b from the GPU (Ollama keeps running for other apps).
  Log: <script folder>\ccarf2-vertex-log.txt. Undo: deploy\switch-to-local.cmd.
#>
param(
  [string]$Source = '',
  [string]$Install = (Join-Path $env:USERPROFILE '.gemini\antigravity\scratch\ccarf-v2'),
  [string[]]$Models = @('gemini-3-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash'),
  [string]$LocalModel = 'gemma4:e4b'
)
$ErrorActionPreference = 'Continue'
$logDir = if ($PSScriptRoot) { $PSScriptRoot } else { $env:TEMP }
$log = Join-Path $logDir 'ccarf2-vertex-log.txt'
"=== switch to Vertex $(Get-Date -Format s) ===" | Out-File $log
function L($m) { $m | Out-File $log -Append; Write-Host $m }

# 1. key (hidden)
Write-Host ''
Write-Host 'Paste your Vertex AI API key and press Enter (nothing will show while you paste):' -ForegroundColor Yellow
$sec = Read-Host -AsSecureString
$key = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)).Trim()
if ($key.Length -lt 20) { L 'No key entered (or too short). Nothing was changed.'; Read-Host 'Press Enter to close'; exit 1 }
L "key received ($($key.Length) characters, not logged)"

# 2. which model works
$chosen = $null
foreach ($m in $Models) {
  $uri = "https://aiplatform.googleapis.com/v1/publishers/google/models/${m}:generateContent"
  $body = '{"contents":[{"role":"user","parts":[{"text":"Reply with the single word OK."}]}],"generationConfig":{"maxOutputTokens":64}}'
  try {
    $r = Invoke-WebRequest -Uri $uri -Method Post -Headers @{ 'x-goog-api-key' = $key } -ContentType 'application/json' -Body $body -UseBasicParsing -TimeoutSec 40
    L "model $m -> HTTP $($r.StatusCode)"; $chosen = $m; break
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    $msg = ''; try { $msg = ((New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() | ConvertFrom-Json).error.status } catch {}
    L "model $m -> HTTP $code $msg"
  }
}
if (-not $chosen) { L 'The key could not call any of the models above. Nothing was changed. Check that the key is a Vertex AI (express mode) key.'; Read-Host 'Press Enter to close'; exit 1 }
L "using model $chosen"

# 3. store key + model in the user profile (not in the site folder, never served)
$secretDir = Join-Path $env:USERPROFILE '.ccarf2'
New-Item -ItemType Directory -Force -Path $secretDir | Out-Null
$keyFile = Join-Path $secretDir 'vertex.key'
Set-Content -Path $keyFile -Value $key -NoNewline -Encoding ASCII
Set-Content -Path (Join-Path $secretDir 'vertex.model') -Value $chosen -NoNewline -Encoding ASCII
$key = $null; $sec = $null
L "saved key and model under $secretDir"

# 4. copy the new build
if ($Source -and (Test-Path (Join-Path $Source 'server.mjs'))) {
  $rc = (Start-Process robocopy -ArgumentList @("`"$Source`"", "`"$Install`"", '/E', '/XD', 'node_modules', '.git', 'shots', 'logs', '/XF', 'feedback.jsonl', 'run.cmd', 'run.local.cmd', '/NFL', '/NDL', '/NJH', '/R:2', '/W:1') -Wait -PassThru -NoNewWindow).ExitCode
  L "robocopy exit $rc (0-7 means ok)"
} else { L 'no -Source given: using the files already installed' }
L "installed: $((Select-String -Path (Join-Path $Install 'server.mjs') -Pattern 'const VERSION').Line)"

# 5. run.cmd for Vertex (old one kept for switch-to-local)
$run = Join-Path $Install 'run.cmd'; $backup = Join-Path $Install 'run.local.cmd'
if ((Test-Path $run) -and -not (Select-String -Path $run -Pattern 'MODEL_PROVIDER=vertex' -Quiet)) { Copy-Item $run $backup -Force; L 'backed up run.cmd to run.local.cmd' }
$node = (Get-Command node).Source
New-Item -ItemType Directory -Force -Path (Join-Path $Install 'logs') | Out-Null
$lines = @(
  '@echo off', "cd /d `"$Install`"",
  'set HOST=127.0.0.1', 'set PORT=8790', 'set TRUST_PROXY=1',
  'set MODEL_PROVIDER=vertex', "set VERTEX_KEY_FILE=$keyFile",
  'set MAX_TOKENS=4096', 'set CONCURRENCY=4',
  'set DAILY_CHAR_BUDGET=4000000', 'set RATE_PER_MIN=12',
  ':loop',
  "`"$node`" server.mjs >> `"$Install\logs\server.log`" 2>&1",
  'timeout /t 5 /nobreak >nul',
  'goto loop')
Set-Content -Path $run -Value ($lines -join "`r`n") -Encoding ASCII
L 'run.cmd now uses Vertex AI'

# 6. restart only the studio (parent-process rule: never match on "server.mjs" alone)
$loops = @(Get-CimInstance Win32_Process -Filter "Name='cmd.exe'" | Where-Object { $_.CommandLine -like '*ccarf-v2\run*.cmd*' } | ForEach-Object { $_.ProcessId })
$kids = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $loops -contains $_.ParentProcessId } | ForEach-Object { $_.ProcessId })
$loops | ForEach-Object { L "stopping loop $_"; Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
$kids | ForEach-Object { L "stopping studio node $_"; Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
if (-not $kids.Count) {
  # The node started before this rule existed may have lost its parent; pick it only by port 8790.
  $own = Get-NetTCPConnection -LocalPort 8790 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($p in $own) { $pr = Get-CimInstance Win32_Process -Filter "ProcessId=$p"; if ($pr.Name -eq 'node.exe') { L "stopping node on port 8790: $p"; Stop-Process -Id $p -Force -ErrorAction SilentlyContinue } }
}
Start-Sleep 2
Start-Process -FilePath $run -WorkingDirectory $Install -WindowStyle Minimized
Start-Sleep 6

# 7. free the GPU (Ollama stays up; it reloads the model only if something else asks for it)
try { Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/generate' -Method Post -ContentType 'application/json' -Body (@{ model = $LocalModel; keep_alive = 0 } | ConvertTo-Json) -TimeoutSec 20 | Out-Null; L "asked Ollama to unload $LocalModel" } catch { L "Ollama unload skipped: $($_.Exception.Message)" }
try { $ps = Invoke-RestMethod 'http://127.0.0.1:11434/api/ps' -TimeoutSec 10; L ("models still loaded in Ollama: " + (($ps.models | ForEach-Object { $_.name }) -join ', ')) } catch {}

try { $h = Invoke-RestMethod 'http://127.0.0.1:8790/api/health'; L ("health: " + ($h | ConvertTo-Json -Compress)) } catch { L "health failed: $_" }
L '=== done ==='
Read-Host 'Done. Press Enter to close'
