param (
    [string]$Message = ""
)

Write-Host "=== DISC RUN AUTOMATED RELEASE PIPELINE ===" -ForegroundColor Cyan

$buildGradlePath = "android/app/build.gradle"
if (-not (Test-Path $buildGradlePath)) {
    Write-Host "ERROR: Could not find android/app/build.gradle" -ForegroundColor Red
    exit 1
}

$buildGradleContent = Get-Content $buildGradlePath -Raw
if ($buildGradleContent -match 'versionCode\s+(\d+)') {
    $currentVersionCode = [int]$matches[1]
} else {
    Write-Host "ERROR: Could not parse versionCode from build.gradle" -ForegroundColor Red
    exit 1
}

$nextVersionCode = $currentVersionCode + 1
$nextVersionName = "1.0.$nextVersionCode"

if ($Message -eq "") {
    $Message = "Automated release v$nextVersionName (Version Code $nextVersionCode)"
}

Write-Host "Current Version: Code $currentVersionCode" -ForegroundColor Yellow
Write-Host "Bumping to:      Code $nextVersionCode (v$nextVersionName)" -ForegroundColor Green
Write-Host "Commit Message:  $Message" -ForegroundColor Gray

# 1. Update android/app/build.gradle
$buildGradleContent = $buildGradleContent -replace 'versionCode\s+\d+', "versionCode $nextVersionCode"
$buildGradleContent = $buildGradleContent -replace 'versionName\s+"[^"]+"', "versionName `"$nextVersionName`""
Set-Content -Path $buildGradlePath -Value $buildGradleContent -Encoding UTF8
Write-Host "[1/5] Updated android/app/build.gradle" -ForegroundColor Green

# 2. Update .github/workflows/build-android.yml
$workflowPath = ".github/workflows/build-android.yml"
if (Test-Path $workflowPath) {
    $workflowContent = Get-Content $workflowPath -Raw
    $workflowContent = $workflowContent -replace "default:\s+'\d+'", "default: '$nextVersionCode'"
    $workflowContent = $workflowContent -replace "default:\s+'1\.0\.\d+'", "default: '$nextVersionName'"
    $workflowContent = $workflowContent -replace 'tag_name:\s+"v1\.0\.\d+"', "tag_name: `"v$nextVersionName`""
    $workflowContent = $workflowContent -replace 'name:\s+"Disc Run Pure Native Android Release \(v1\.0\.\d+\)"', "name: `"Disc Run Pure Native Android Release (v$nextVersionName)`""
    Set-Content -Path $workflowPath -Value $workflowContent -Encoding UTF8
    Write-Host "[2/5] Updated .github/workflows/build-android.yml" -ForegroundColor Green
}

# 3. Sync web assets
$assetsDir = "android/app/src/main/assets"
if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null
}

$filesToSync = @(
    'index.html',
    'style.css',
    'game.js',
    'audio.js',
    'three.min.js',
    'manifest.json',
    'icon-192.png',
    'icon-512.png',
    'icon-512-maskable.png'
)

foreach ($f in $filesToSync) {
    if (Test-Path $f) {
        Copy-Item $f -Destination "$assetsDir/$f" -Force
    }
}
Write-Host "[3/5] Synced web assets into android/app/src/main/assets/" -ForegroundColor Green

# 4. Sync 3D icons
$resDir = "android/app/src/main/res"
$densities = @('mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi')
foreach ($d in $densities) {
    $mipmapDir = "$resDir/mipmap-$d"
    if (-not (Test-Path $mipmapDir)) {
        New-Item -ItemType Directory -Path $mipmapDir -Force | Out-Null
    }
    if (Test-Path "icon-512.png") {
        Copy-Item "icon-512.png" -Destination "$mipmapDir/ic_launcher.png" -Force
    }
    if (Test-Path "icon-512-maskable.png") {
        Copy-Item "icon-512-maskable.png" -Destination "$mipmapDir/ic_launcher_round.png" -Force
        Copy-Item "icon-512-maskable.png" -Destination "$mipmapDir/ic_launcher_foreground.png" -Force
    }
}
Write-Host "[4/5] Synced 3D icons to Android mipmap densities" -ForegroundColor Green

# 5. Git Commit & Push
Write-Host "[5/5] Committing and pushing to GitHub..." -ForegroundColor Cyan
git add .
git commit -m "$Message"
git push origin main
Write-Host ""
Write-Host "SUCCESS! Release pipeline triggered on GitHub Actions." -ForegroundColor Green
Write-Host "Monitor build: https://github.com/natefoldan/disc-run-game/actions" -ForegroundColor Cyan
Write-Host "Release tag:   v$nextVersionName" -ForegroundColor Yellow
