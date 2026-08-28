# Automated Multi-Stage Gameplay Screenshots Capture Script
$ErrorActionPreference = "Continue"

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
  $edgePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
}

$outputDir = Join-Path $PSScriptRoot "..\gameplay_screenshots"
if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}

$indexPath = (Get-Item (Join-Path $PSScriptRoot "..\index.html")).FullName.Replace("\", "/")
$baseUrl = "file:///" + $indexPath

$scenes = @(
  @{ name = "1_stage1_cyber_grid_ducking.png"; hash = "gameplay_stage1"; desc = "Stage 1: Cyber Grid (Ducking Overhead Bar & 5X Streak)" },
  @{ name = "2_stage2_solar_flare_fireballs.png"; hash = "gameplay_stage2"; desc = "Stage 2: Solar Flare (Orbiting Fireballs & Molten Tracks)" },
  @{ name = "3_stage3_toxic_core_slime.png"; hash = "gameplay_stage3"; desc = "Stage 3: Toxic Core (Acid Slime & Crash Shields)" },
  @{ name = "4_stage4_void_warp_portals.png"; hash = "gameplay_stage4"; desc = "Stage 4: Void Warp (Paired Quantum Portals)" },
  @{ name = "5_stage5_cyber_glacier_ice.png"; hash = "gameplay_stage5"; desc = "Stage 5: Cyber Glacier (Cryo Ice Spikes & Frost Disc)" },
  @{ name = "6_stage8_fractured_abyss_collapse.png"; hash = "gameplay_stage8"; desc = "Stage 8: Fractured Abyss (11 Lanes & Collapsing Tracks)" }
)

foreach ($scene in $scenes) {
  $outPath = Join-Path $outputDir $scene.name
  Write-Host "Capturing $($scene.desc)..."
  $argList = @(
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--virtual-time-budget=3200",
    "--window-size=1280,720",
    "--screenshot=$outPath",
    "$baseUrl#$($scene.hash)"
  )
  Start-Process -FilePath $edgePath -ArgumentList $argList -Wait -NoNewWindow
  Start-Sleep -Milliseconds 400
}

Write-Host "Finished capturing all gameplay screenshots!"
Get-ChildItem $outputDir | Select-Object Name, Length, LastWriteTime
