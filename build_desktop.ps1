<#
.SYNOPSIS
    Build Academic Tracker Windows Desktop executable.
.DESCRIPTION
    1. Builds the React frontend (npm run build)
    2. Generates a placeholder icon if missing
    3. Installs Python build dependencies if missing
    4. Runs PyInstaller with the spec file
    5. Prints the output location
#>

$ErrorActionPreference = "Stop"
$RepoRoot = $PSScriptRoot
Set-Location $RepoRoot

Write-Host "=== Academic Tracker Desktop Build ===" -ForegroundColor Cyan

# --- Step 1: Build frontend ---
Write-Host "[1/4] Building frontend..." -ForegroundColor Yellow
Set-Location (Join-Path $RepoRoot "frontend")
$ErrorActionPreference = "Continue"
npm run build
$buildExit = $LASTEXITCODE
$ErrorActionPreference = "Stop"
if ($buildExit -ne 0) { throw "Frontend build failed" }

# --- Step 2: Ensure icon ---
Write-Host "[2/4] Checking icon..." -ForegroundColor Yellow
$iconPath = Join-Path (Join-Path $RepoRoot "assets") "icon.ico"
if (-not (Test-Path $iconPath)) {
    Write-Host "  Generating placeholder icon.ico..." -ForegroundColor Gray
    $null = New-Item -ItemType Directory -Path (Join-Path $RepoRoot "assets") -Force
    python -c @"
import struct
w = h = 32
bmp_size = 40 + w * h * 4 + w * h // 8
offset = 6 + 16
with open(r'$iconPath', 'wb') as f:
    f.write(struct.pack('<HHH', 0, 1, 1))
    f.write(struct.pack('<BBBBHHII', w, h, 0, 0, 1, 32, bmp_size, offset))
    f.write(struct.pack('<IiiHHIIiiII', 40, w, h * 2, 1, 32, 0, w * h * 4, 0, 0, 0, 0))
    for y in range(h):
        for x in range(w):
            r = int(80 + (x / w) * 100)
            g = int(60 + (y / h) * 80)
            b = int(180 + ((w - x) / w) * 75)
            f.write(struct.pack('BBBB', b, g, r, 255))
    and_row_size = ((w + 31) // 32) * 4
    for _ in range(h):
        f.write(b'\x00' * and_row_size)
"@
}

# --- Step 3: Install pywebview/pyinstaller if not present ---
Write-Host "[3/4] Checking Python dependencies..." -ForegroundColor Yellow
$savedPref = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$checks = @(
    @{ import = "webview";      pip = "pywebview" },
    @{ import = "PyInstaller";  pip = "pyinstaller" }
)
foreach ($c in $checks) {
    python -c "import $($c.import)" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Installing $($c.pip)..." -ForegroundColor Gray
        pip install $c.pip
    } else {
        Write-Host "  $($c.pip) already installed" -ForegroundColor Gray
    }
}
$ErrorActionPreference = $savedPref

# --- Step 4: Run PyInstaller ---
Write-Host "[4/4] Running PyInstaller..." -ForegroundColor Yellow
Set-Location $RepoRoot
pyinstaller academic-tracker.spec --clean --noconfirm
if ($LASTEXITCODE -ne 0) { throw "PyInstaller failed" }

# --- Done ---
$outputDir = Join-Path (Join-Path $RepoRoot "dist") "AcademicTracker"
Write-Host "`n=== Build complete! ===" -ForegroundColor Green
Write-Host "Executable at:" -ForegroundColor Cyan
Write-Host "  $outputDir\AcademicTracker.exe" -ForegroundColor White
Write-Host "`nTo run, double-click AcademicTracker.exe (no terminal shown)." -ForegroundColor Gray
