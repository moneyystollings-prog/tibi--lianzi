param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$taskSite = Join-Path $PSScriptRoot 'site'
$taskRuntime = Join-Path $taskSite '.runtime'
New-Item -ItemType Directory -Path $taskRuntime -Force | Out-Null
$taskUrl = 'http://127.0.0.1:4173'
$taskRunning = $false
try {
    $taskHealth = Invoke-RestMethod -Uri "$taskUrl/api/health" -TimeoutSec 2
    if ($taskHealth.app -eq 'zijian') { $taskRunning = $true }
} catch { }
if (-not $taskRunning) {
    $taskNode = (Get-Command node -ErrorAction Stop).Source
    Push-Location -LiteralPath $taskSite
    try {
        & $taskNode 'scripts/build.mjs'
        if ($LASTEXITCODE -ne 0) { throw '网站构建失败，请查看提示。' }
        $taskProcess = Start-Process -FilePath $taskNode -ArgumentList 'scripts/server.mjs' -WorkingDirectory $taskSite -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $taskRuntime 'server.log') -RedirectStandardError (Join-Path $taskRuntime 'server-error.log')
        $taskProcess.Id | Set-Content -LiteralPath (Join-Path $taskRuntime 'server.pid')
    } finally { Pop-Location }
    for ($taskAttempt = 0; $taskAttempt -lt 30; $taskAttempt++) {
        try { $taskHealth = Invoke-RestMethod -Uri "$taskUrl/api/health" -TimeoutSec 1; if ($taskHealth.app -eq 'zijian') { $taskRunning = $true; break } } catch { }
        Start-Sleep -Milliseconds 200
    }
}
if (-not $taskRunning) { throw '本地网站未能启动，请查看 site\.runtime\server-error.log。' }
if (-not $NoBrowser) { Start-Process $taskUrl }
