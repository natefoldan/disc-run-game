# Automated Master Screenshot Capture Suite for App Store & Google Play
$ErrorActionPreference = "Continue"

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
  $edgePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$actualDir = Join-Path $root "actual_screenshots"
$promoDir = Join-Path $root "promo_screenshots"
$gameplayDir = Join-Path $root "gameplay_screenshots"

foreach ($dir in @($actualDir, $promoDir, $gameplayDir)) {
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
}

$indexPath = (Get-Item (Join-Path $root "index.html")).FullName.Replace("\", "/")
$promoGenPath = (Get-Item (Join-Path $root "scripts\generate_store_promo_screenshots.html")).FullName.Replace("\", "/")

Write-Host "========================================="
Write-Host "1. CAPTURING AUTHENTIC MENU SCREENSHOTS (NO ADS)"
Write-Host "========================================="

$menuScreens = @(
  @{ name = "1_main_menu_and_workshop.png"; url = "file:///$indexPath#mainmenu_clean"; w = 1280; h = 760; wait = 2500; desc = "Clean Main Menu & Upgrade Shop (No Ads)" },
  @{ name = "2_achievements_modal.png"; url = "file:///$indexPath#achievements"; w = 1280; h = 820; wait = 3000; desc = "20 Runner Achievements & Trophies Modal" },
  @{ name = "3_postrun_second_chance.png"; url = "file:///$indexPath#postrun"; w = 1280; h = 760; wait = 3000; desc = "Post-Run Revive & 2X Multiplier Decisions" },
  @{ name = "4_lifetime_stats.png"; url = "file:///$indexPath#stats"; w = 1280; h = 760; wait = 3000; desc = "Lifetime Career Stats & High Scores" },
  @{ name = "5_pause_menu.png"; url = "file:///$indexPath#pause"; w = 1280; h = 760; wait = 3000; desc = "In-Game Pause Modal" },
  @{ name = "6_stage_unlocked_modal.png"; url = "file:///$indexPath#stage_unlocked"; w = 1280; h = 760; wait = 3000; desc = "Celebratory Stage Unlock Modal" }
)

foreach ($item in $menuScreens) {
  $target = Join-Path $actualDir $item.name
  Write-Host "Capturing $($item.desc)..."
  $args = @(
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--virtual-time-budget=$($item.wait)",
    "--window-size=$($item.w),$($item.h)",
    "--screenshot=$target",
    $item.url
  )
  Start-Process -FilePath $edgePath -ArgumentList $args -Wait -NoNewWindow
  Start-Sleep -Milliseconds 400
}

Write-Host "========================================="
Write-Host "2. CAPTURING AUTHENTIC PROMO SCREENSHOTS"
Write-Host "========================================="

$promoScreens = @(
  @{ name = "1_promo_survive_turntable.png"; url = "file:///$indexPath#promo_1"; desc = "Promo 1: Survive Turntable & Perfect Ducks" },
  @{ name = "2_promo_solar_fireballs.png"; url = "file:///$indexPath#promo_2"; desc = "Promo 2: Dodge Orbiting Fireballs & Molten Tracks" },
  @{ name = "3_promo_shields_deflectors.png"; url = "file:///$indexPath#promo_3"; desc = "Promo 3: Crash Shields & Hazard Deflector" },
  @{ name = "4_promo_quantum_portals.png"; url = "file:///$indexPath#promo_4"; desc = "Promo 4: Warp Through Quantum Portals" },
  @{ name = "5_promo_orbit_multipliers.png"; url = "file:///$indexPath#promo_5"; desc = "Promo 5: Charge 10X Orbit Multipliers" },
  @{ name = "6_promo_expanding_worlds.png"; url = "file:///$indexPath#promo_6"; desc = "Promo 6: Master 8 Expanding Sci-Fi Worlds" }
)

foreach ($item in $promoScreens) {
  $target = Join-Path $promoDir $item.name
  Write-Host "Capturing $($item.desc)..."
  $args = @(
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--virtual-time-budget=3400",
    "--window-size=1280,720",
    "--screenshot=$target",
    $item.url
  )
  Start-Process -FilePath $edgePath -ArgumentList $args -Wait -NoNewWindow
  Start-Sleep -Milliseconds 400
}

Write-Host "========================================="
Write-Host "3. CAPTURING PURE GAMEPLAY SCREENSHOTS"
Write-Host "========================================="

$gameplayScreens = @(
  @{ name = "1_stage1_cyber_grid_ducking.png"; url = "file:///$indexPath#gameplay_stage1"; desc = "Stage 1: Cyber Grid (Ducking Overhead Bar)" },
  @{ name = "2_stage2_solar_flare_fireballs.png"; url = "file:///$indexPath#gameplay_stage2"; desc = "Stage 2: Solar Flare (Orbiting Fireballs)" },
  @{ name = "3_stage3_toxic_core_slime.png"; url = "file:///$indexPath#gameplay_stage3"; desc = "Stage 3: Toxic Core (Acid Slime & Shields)" },
  @{ name = "4_stage4_void_warp_portals.png"; url = "file:///$indexPath#gameplay_stage4"; desc = "Stage 4: Void Horizon (Paired Portals)" },
  @{ name = "5_stage5_cyber_glacier_ice.png"; url = "file:///$indexPath#gameplay_stage5"; desc = "Stage 5: Cyber Glacier (Cryo Ice)" },
  @{ name = "6_stage8_fractured_abyss_collapse.png"; url = "file:///$indexPath#gameplay_stage8"; desc = "Stage 8: Fractured Abyss (11 Lanes Collapse)" }
)

foreach ($item in $gameplayScreens) {
  $target = Join-Path $gameplayDir $item.name
  Write-Host "Capturing $($item.desc)..."
  $args = @(
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--virtual-time-budget=3200",
    "--window-size=1280,720",
    "--screenshot=$target",
    $item.url
  )
  Start-Process -FilePath $edgePath -ArgumentList $args -Wait -NoNewWindow
  Start-Sleep -Milliseconds 400
}

Write-Host "All Master Screenshots generated successfully!"
