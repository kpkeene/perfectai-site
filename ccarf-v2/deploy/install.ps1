<#
  Architect Studio v2 · Windows install (no admin needed for the default logon task)

  What it does
    1. Writes run.cmd next to this script with your settings (model URL, port, access code).
    2. Registers a Scheduled Task "ArchitectStudioV2" that starts run.cmd at logon, and starts it now.
    3. Prints the Caddy site block to add for ccarf2.perfectai.tech.

  It does NOT touch the existing site, Caddy config, DNS, firewall or ports.

  Usage (PowerShell, from the ccarf-v2 folder):
    .\deploy\install.ps1 -ModelBase "http://127.0.0.1:8080/v1" -ModelName "qwen3-4b" -ModelLabel "Local 4B"
    .\deploy\install.ps1 -Uninstall
#>
param(
  [string]$ModelBase = "http://127.0.0.1:8080/v1",
  [string]$ModelName = "local-model",
  [string]$ModelLabel = "Local 4B",
  [string]$ModelKey = "",
  [int]$Port = 8790,
  [string]$AccessCode = "",
  [int]$DailyCharBudget = 1500000,
  [int]$RatePerMin = 8,
  [string]$TaskName = "ArchitectStudioV2",
  [switch]$Uninstall
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$runCmd = Join-Path $root "run.cmd"
$logDir = Join-Path $root "logs"

if ($Uninstall) {
  schtasks /End /TN $TaskName 2>$null | Out-Null
  schtasks /Delete /F /TN $TaskName 2>$null | Out-Null
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like "*$root*server.mjs*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
  Write-Host "Removed task $TaskName and stopped the server. Files were left in place."
  exit 0
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { throw "node was not found on PATH. Install Node 18+ first." }
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$lines = @(
  "@echo off",
  "cd /d `"$root`"",
  "set HOST=127.0.0.1",
  "set PORT=$Port",
  "set TRUST_PROXY=1",
  "set MODEL_BASE=$ModelBase",
  "set MODEL_NAME=$ModelName",
  "set MODEL_LABEL=$ModelLabel",
  "set DAILY_CHAR_BUDGET=$DailyCharBudget",
  "set RATE_PER_MIN=$RatePerMin"
)
if ($ModelKey) { $lines += "set MODEL_KEY=$ModelKey" }
if ($AccessCode) { $lines += "set ACCESS_CODE=$AccessCode" }
$lines += ":loop"
$lines += "`"$($node.Source)`" server.mjs >> `"$logDir\server.log`" 2>&1"
$lines += "timeout /t 5 /nobreak >nul"
$lines += "goto loop"
Set-Content -Path $runCmd -Value ($lines -join "`r`n") -Encoding ASCII

schtasks /End /TN $TaskName 2>$null | Out-Null
schtasks /Delete /F /TN $TaskName 2>$null | Out-Null
schtasks /Create /F /SC ONLOGON /TN $TaskName /TR "`"$runCmd`"" | Out-Null
schtasks /Run /TN $TaskName | Out-Null
Start-Sleep -Seconds 3

try {
  $h = Invoke-RestMethod "http://127.0.0.1:$Port/api/health" -TimeoutSec 5
  Write-Host "Server is up on http://127.0.0.1:$Port  model: $($h.model)  version: $($h.version)"
} catch {
  Write-Warning "Server did not answer yet. Check $logDir\server.log"
}

Write-Host ""
Write-Host "Add this to your Caddyfile, then reload Caddy (caddy reload --config <your Caddyfile>):"
Write-Host ""
Get-Content (Join-Path $root "deploy\Caddyfile.ccarf2.txt") | ForEach-Object { Write-Host "  $_" }
Write-Host ""
Write-Host "DNS: an A record for ccarf2.perfectai.tech pointing at the same address as ccarf.perfectai.tech."
