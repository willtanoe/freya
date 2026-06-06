<#
.SYNOPSIS
    Freya cloud-first Windows installer.

.DESCRIPTION
    One-command installer for Freya on native Windows. Downloads Python,
    git, and uv (if missing), clones the repo, installs dependencies,
    and sets up the freya CLI shim.

    Usage (one-liner):
      irm https://willtanoe.github.io/freya/install.ps1 | iex

    After install, run:
      freya serve       (starts API server on localhost:8000)
      cd Freya\src\frontend && npm install && npm run dev  (starts frontend)
#>

[CmdletBinding()]
param(
    [switch] $Force
)

$ErrorActionPreference = 'Stop'

if (-not $Force -and $env:FREYA_FORCE) { $Force = $true }

function Write-Info  ($msg) { Write-Host "[info]  $msg" -ForegroundColor Cyan }
function Write-Ok    ($msg) { Write-Host "[ok]    $msg" -ForegroundColor Green }
function Write-Warn2 ($msg) { Write-Host "[warn]  $msg" -ForegroundColor Yellow }
function Write-Fail  ($msg) {
    Write-Host "[fail]  $msg" -ForegroundColor Red
    exit 1
}

# ── PATH refresh ──
function Update-PathFromRegistry {
    $machinePath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
    $userPath    = [System.Environment]::GetEnvironmentVariable('Path', 'User')
    $combined    = "$machinePath;$userPath"
    $env:Path = [System.Environment]::ExpandEnvironmentVariables($combined)
}

function Install-WithWinget {
    param([string] $WingetId, [string] $CommandName)
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { return $null }
    Write-Info "  Installing $WingetId via winget..."
    & winget install --id $WingetId --silent --accept-source-agreements --accept-package-agreements 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { return $null }
    Update-PathFromRegistry
    $cmd = Get-Command $CommandName -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    return $null
}

# ── 1. OS check ──
Write-Info "Checking OS..."
if ($PSVersionTable.Platform -and $PSVersionTable.Platform -ne 'Win32NT') {
    Write-Fail "install.ps1 is for native Windows. Use install.sh on Linux/macOS."
}
$build = [System.Environment]::OSVersion.Version.Build
if ($build -lt 17763) {
    Write-Fail "Windows 10 1809 (build 17763) or newer required."
}
Write-Ok "Windows build $build"

# ── 2. Python ──
Write-Info "Checking Python (3.10 - 3.13)..."
$pythonExe = (Get-Command python3 -ErrorAction SilentlyContinue).Source
if (-not $pythonExe) { $pythonExe = (Get-Command python -ErrorAction SilentlyContinue).Source }
if (-not $pythonExe) {
    Write-Info "Python not found — installing via winget..."
    $pythonExe = Install-WithWinget -WingetId 'Python.Python.3.13' -CommandName 'python'
    if (-not $pythonExe) {
        Write-Fail "Install Python from https://python.org, then re-run."
    }
}
Write-Ok "Python found ($pythonExe)"

# ── 3. git ──
Write-Info "Checking git..."
$gitExe = (Get-Command git -ErrorAction SilentlyContinue).Source
if (-not $gitExe) {
    $gitExe = Install-WithWinget -WingetId 'Git.Git' -CommandName 'git'
    if (-not $gitExe) { Write-Fail "Install git from https://git-scm.com, then re-run." }
}
Write-Ok "git found"

# ── 4. Node.js ──
Write-Info "Checking Node.js 20+..."
$nodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodeExe) {
    Write-Info "Node.js not found — installing via winget..."
    $nodeExe = Install-WithWinget -WingetId 'OpenJS.NodeJS.LTS' -CommandName 'node'
    if (-not $nodeExe) { Write-Warn2 "Install Node.js from https://nodejs.org, then re-run." }
}
if ($nodeExe) { Write-Ok "Node.js found" }

# ── 5. uv ──
Write-Info "Checking uv..."
$uvExe = (Get-Command uv -ErrorAction SilentlyContinue).Source
if (-not $uvExe) {
    Write-Info "Installing uv..."
    Invoke-RestMethod -Uri 'https://astral.sh/uv/install.ps1' -UseBasicParsing | Invoke-Expression
    $uvDir = Join-Path $env:USERPROFILE '.local\bin'
    if (Test-Path (Join-Path $uvDir 'uv.exe')) { $env:Path = "$uvDir;$env:Path" }
}
Write-Ok "uv ready"

# ── 6. Clone ──
$installRoot = if ($env:FREYA_HOME) { $env:FREYA_HOME } else { Join-Path $env:LOCALAPPDATA 'Freya' }
$srcDir = Join-Path $installRoot 'src'
Write-Info "Install root: $installRoot"

if (-not (Test-Path $installRoot)) { New-Item -ItemType Directory -Path $installRoot | Out-Null }

$repoUrl = if ($env:FREYA_REPO_URL) { $env:FREYA_REPO_URL } else { 'https://github.com/willtanoe/freya.git' }

if (Test-Path (Join-Path $srcDir '.git')) {
    if ($Force) {
        Write-Info "Pulling latest..."
        & $gitExe -C $srcDir pull --ff-only
    } else {
        Write-Ok "Repo already cloned (use -Force to update)"
    }
} else {
    Write-Info "Cloning $repoUrl..."
    & $gitExe clone --depth 1 $repoUrl $srcDir
}

# ── 7. Install Python deps ──
Write-Info "Installing Python dependencies..."
Push-Location $srcDir
try {
    & $uvExe sync --extra server --extra inference-cloud
    if ($LASTEXITCODE -ne 0) { Write-Fail "uv sync failed" }
} finally { Pop-Location }
Write-Ok "Python dependencies installed"

# ── 8. Install frontend deps ──
$frontendDir = Join-Path $srcDir 'frontend'
if (Test-Path $frontendDir) {
    Write-Info "Installing frontend dependencies..."
    Push-Location $frontendDir
    try {
        & npm install
    } finally { Pop-Location }
    Write-Ok "Frontend dependencies installed"
}

# ── 9. freya.cmd shim ──
$binDir = Join-Path $installRoot 'bin'
if (-not (Test-Path $binDir)) { New-Item -ItemType Directory -Path $binDir | Out-Null }
$shimPath = Join-Path $binDir 'freya.cmd'
@"
@echo off
setlocal
set "SRC=%~dp0..\src"
uv run --project "%SRC%" freya %*
"@ | Set-Content -Path $shimPath -Encoding ASCII

$userPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$pathOnUser = $false
if ($userPath) {
    foreach ($entry in ($userPath -split ';')) {
        if ([System.Environment]::ExpandEnvironmentVariables($entry) -ieq $binDir) { $pathOnUser = $true; break }
    }
}
$pathNeedsRefresh = $false
if (-not $pathOnUser) {
    $newUserPath = if ($userPath) { "$userPath;$binDir" } else { $binDir }
    [System.Environment]::SetEnvironmentVariable('Path', $newUserPath, 'User')
    $pathNeedsRefresh = $true
}
Write-Ok "freya shim installed"

# ── 10. Done ──
Write-Host ""
Write-Host "  ┌──────────────────────────────────────┐" -ForegroundColor Green
Write-Host "  │      Freya install complete!         │" -ForegroundColor Green
Write-Host "  └──────────────────────────────────────┘" -ForegroundColor Green
Write-Host ""
Write-Host "  Repo:    $srcDir"
Write-Host ""

if ($pathNeedsRefresh) {
    Write-Host "  Open a NEW PowerShell, then:" -ForegroundColor Yellow
    Write-Host "    freya serve                      (start API server)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  In another terminal:" -ForegroundColor Yellow
    Write-Host "    cd $srcDir\\frontend && npm run dev   (start frontend)" -ForegroundColor Yellow
} else {
    Write-Host "  Start the backend:" -ForegroundColor Yellow
    Write-Host "    freya serve" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Start the frontend in another terminal:" -ForegroundColor Yellow
    Write-Host "    cd $srcDir\\frontend && npm run dev" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "  Then open http://localhost:5173 and configure your cloud API keys."
Write-Host ""
Write-Host "  Docs:    https://willtanoe.github.io/freya/"
Write-Host ""
