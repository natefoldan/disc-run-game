# Automated In-Game Screenshot Capture Script
$ErrorActionPreference = "Continue"

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
  $edgePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
}

$outputDir = Join-Path $PSScriptRoot "..\actual_screenshots"
if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}

$indexPath = (Get-Item (Join-Path $PSScriptRoot "..\index.html")).FullName.Replace("\", "/")
$baseUrl = "file:///" + $indexPath

$scenes = @(
  @{ name = "1_main_menu_and_workshop.png"; url = $baseUrl; width = 1280; height = 760; wait = 2500 },
  @{ name = "2_achievements_modal.png"; url = "$($baseUrl)#achievements"; width = 1280; height = 800; wait = 3000 },
  @{ name = "3_postrun_second_chance.png"; url = "$($baseUrl)#postrun"; width = 1280; height = 760; wait = 3000 },
  @{ name = "4_lifetime_stats.png"; url = "$($baseUrl)#stats"; width = 1280; height = 760; wait = 3000 },
  @{ name = "5_gameplay_action.png"; url = "$($baseUrl)#gameplay"; width = 1280; height = 760; wait = 3500 }
)

foreach ($scene in $scenes) {
  $outPath = Join-Path $outputDir $scene.name
  Write-Host "Capturing $($scene.name)..."
  $argList = @(
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--virtual-time-budget=$($scene.wait)",
    "--window-size=$($scene.width),$($scene.height)",
    "--screenshot=$outPath",
    $scene.url
  )
  Start-Process -FilePath $edgePath -ArgumentList $argList -Wait -NoNewWindow
  Start-Sleep -Milliseconds 500
}

Write-Host "Finished capturing authentic in-game screenshots!"
Get-ChildItem $outputDir | Select-Object Name, Length, LastWriteTime
