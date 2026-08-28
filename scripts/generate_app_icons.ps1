Add-Type -AssemblyName System.Drawing

function MakeIcon([int]$size, [string]$path, [bool]$maskable) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Dark cyber background
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#080916'))
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)

    $s = $size / 512.0
    $cx = $size / 2.0
    $cy = $size / 2.0

    # Outer Disc Track (Cyan glow)
    $rOuter = if ($maskable) { 150 * $s } else { 190 * $s }
    $penGlow = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 0, 240, 255), [float](36 * $s))
    $g.DrawEllipse($penGlow, [float]($cx - $rOuter), [float]($cy - $rOuter), [float]($rOuter * 2), [float]($rOuter * 2))

    $penOuter = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#00f0ff'), [float](18 * $s))
    $g.DrawEllipse($penOuter, [float]($cx - $rOuter), [float]($cy - $rOuter), [float]($rOuter * 2), [float]($rOuter * 2))

    # Inner Hazard Ring (Hot Pink)
    $rInner = if ($maskable) { 95 * $s } else { 120 * $s }
    $penInnerGlow = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 255, 0, 85), [float](24 * $s))
    $g.DrawEllipse($penInnerGlow, [float]($cx - $rInner), [float]($cy - $rInner), [float]($rInner * 2), [float]($rInner * 2))

    $penInner = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#ff0055'), [float](12 * $s))
    $g.DrawEllipse($penInner, [float]($cx - $rInner), [float]($cy - $rInner), [float]($rInner * 2), [float]($rInner * 2))

    # Center Cyber Runner Cube
    $cSize = if ($maskable) { 68 * $s } else { 88 * $s }
    $cubeX = $cx - $cSize / 2.0
    $cubeY = $cy - $cSize / 2.0

    $cubeGlowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 0, 240, 255))
    $g.FillRectangle($cubeGlowBrush, [float]($cubeX - 8 * $s), [float]($cubeY - 8 * $s), [float]($cSize + 16 * $s), [float]($cSize + 16 * $s))

    $cubeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#00f0ff'))
    $g.FillRectangle($cubeBrush, [float]$cubeX, [float]$cubeY, [float]$cSize, [float]$cSize)

    # Visor
    $vW = $cSize * 0.65
    $vH = $cSize * 0.35
    $vX = $cx - $vW / 2.0
    $vY = $cy - $vH / 2.0
    $visorBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#ffffff'))
    $g.FillRectangle($visorBrush, [float]$vX, [float]$vY, [float]$vW, [float]$vH)

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    Write-Host "Created $path"
}

MakeIcon 512 'icon-512.png' $false
MakeIcon 192 'icon-192.png' $false
MakeIcon 512 'icon-512-maskable.png' $true