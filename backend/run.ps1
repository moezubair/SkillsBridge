# Run the API with a predictable interpreter (avoids picking up global Python when the venv prompt is wrong).
$ErrorActionPreference = "Stop"
$BackendDir = $PSScriptRoot
$SkillsBridgeRoot = Split-Path $BackendDir -Parent

$candidates = @(
    (Join-Path $SkillsBridgeRoot ".lotushack\Scripts\python.exe"),
    (Join-Path $BackendDir "venv\Scripts\python.exe")
)

$python = $null
foreach ($p in $candidates) {
    if (Test-Path -LiteralPath $p) {
        $python = $p
        break
    }
}

if (-not $python) {
    $cmd = Get-Command python -ErrorAction SilentlyContinue
    if ($cmd) { $python = $cmd.Source }
}

if (-not $python) {
    Write-Error @"
No Python interpreter found.
  Install deps into one of:
    $SkillsBridgeRoot\.lotushack   (repo venv)
    $BackendDir\venv               (backend-local venv)
  Then: pip install -r requirements.txt
"@
    exit 1
}

Set-Location -LiteralPath $BackendDir
Write-Host "Using: $python" -ForegroundColor DarkGray
& $python main.py
