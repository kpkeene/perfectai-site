<#
  Undo switch-to-vertex: restore the local run.cmd (Ollama) saved as run.local.cmd and restart only the studio.
  The Vertex key stays in %USERPROFILE%\.ccarf2 until you delete it (and you can revoke it in Google Cloud).
#>
param([string]$Install = (Join-Path $env:USERPROFILE '.gemini\antigravity\scratch\ccarf-v2'))
$ErrorActionPreference = 'Continue'
$log = Join-Path $(if ($PSScriptRoot) { $PSScriptRoot } else { $env:TEMP }) 'ccarf2-local-log.txt'
"=== switch to local $(Get-Date -Format s) ===" | Out-File $log
function L($m) { $m | Out-File $log -Append; Write-Host $m }
$run = Join-Path $Install 'run.cmd'; $backup = Join-Path $Install 'run.local.cmd'
if (-not (Test-Path $backup)) { L "no $backup to restore"; Read-Host 'Press Enter to close'; exit 1 }
Copy-Item $backup $run -Force; L 'restored run.cmd from run.local.cmd'
$loops = @(Get-CimInstance Win32_Process -Filter "Name='cmd.exe'" | Where-Object { $_.CommandLine -like '*ccarf-v2\run*.cmd*' } | ForEach-Object { $_.ProcessId })
$kids = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $loops -contains $_.ParentProcessId } | ForEach-Object { $_.ProcessId })
$loops + $kids | ForEach-Object { L "stopping $_"; Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
Start-Sleep 2
Start-Process -FilePath $run -WorkingDirectory $Install -WindowStyle Minimized
Start-Sleep 6
try { $h = Invoke-RestMethod 'http://127.0.0.1:8790/api/health'; L ("health: " + ($h | ConvertTo-Json -Compress)) } catch { L "health failed: $_" }
Read-Host 'Done. Press Enter to close'
