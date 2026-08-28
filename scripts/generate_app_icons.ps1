Add-Type -AssemblyName System.Drawing

function Draw-DiscRunIcon([int]$size, [string]$path, [bool]$isMaskable) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $s = $size / 512.0
    $scaleFactor = if ($isMaskable) { 0.78 } else { 1.0 }
    $cx = $size / 2.0
    $cy = $size / 2.0

    # 1. Background: Deep Midnight Cyber Gradient
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#050614'))
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)

    # Ambient Background Radial Glow
    $glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $glowPath.AddEllipse([float]($cx - 240 * $s), [float]($cy - 240 * $s), [float](480 * $s), [float](480 * $s))
    $pbg = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
    $pbg.CenterColor = [System.Drawing.Color]::FromArgb(65, 0, 240, 255)
    $pbg.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 5, 6, 20))
    $g.FillPath($pbg, $glowPath)

    # 2. Isometric 3D Rotating Turntable Disc
    $discCenterY = $cy + 50 * $s * $scaleFactor
    $discW = 410 * $s * $scaleFactor
    $discH = 210 * $s * $scaleFactor

    # Disc Rim 3D Extrusion (Depth)
    $rimDepth = 26 * $s * $scaleFactor
    $discRimBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#0a1024'))
    $g.FillEllipse($discRimBrush, [float]($cx - $discW/2.0), [float]($discCenterY - $discH/2.0 + $rimDepth), [float]$discW, [float]$discH)

    # Disc Surface Platter
    $discSurfBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#0d1430'))
    $g.FillEllipse($discSurfBrush, [float]($cx - $discW/2.0), [float]($discCenterY - $discH/2.0), [float]$discW, [float]$discH)

    # Outer Neon Cyan Rim Glow & Stroke
    $penOuterGlow = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 0, 240, 255), [float](22 * $s * $scaleFactor))
    $g.DrawEllipse($penOuterGlow, [float]($cx - $discW/2.0), [float]($discCenterY - $discH/2.0), [float]$discW, [float]$discH)
    
    $penOuter = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#00f0ff'), [float](7 * $s * $scaleFactor))
    $g.DrawEllipse($penOuter, [float]($cx - $discW/2.0), [float]($discCenterY - $discH/2.0), [float]$discW, [float]$discH)

    # Track 2: Mid Neon Gold/Amber Groove
    $midW = $discW * 0.72
    $midH = $discH * 0.72
    $penMidGlow = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 255, 180, 0), [float](14 * $s * $scaleFactor))
    $g.DrawEllipse($penMidGlow, [float]($cx - $midW/2.0), [float]($discCenterY - $midH/2.0), [float]$midW, [float]$midH)

    $penMid = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#ffb700'), [float](4 * $s * $scaleFactor))
    $g.DrawEllipse($penMid, [float]($cx - $midW/2.0), [float]($discCenterY - $midH/2.0), [float]$midW, [float]$midH)

    # Track 3: Inner Hazard Neon Pink Track
    $inW = $discW * 0.44
    $inH = $discH * 0.44
    $penInGlow = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 255, 0, 85), [float](16 * $s * $scaleFactor))
    $g.DrawEllipse($penInGlow, [float]($cx - $inW/2.0), [float]($discCenterY - $inH/2.0), [float]$inW, [float]$inH)

    $penIn = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#ff0055'), [float](5 * $s * $scaleFactor))
    $g.DrawEllipse($penIn, [float]($cx - $inW/2.0), [float]($discCenterY - $inH/2.0), [float]$inW, [float]$inH)

    # Center Spindle Hub Orb
    $hubW = 46 * $s * $scaleFactor
    $hubH = 26 * $s * $scaleFactor
    $hubBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#00f0ff'))
    $g.FillEllipse($hubBrush, [float]($cx - $hubW/2.0), [float]($discCenterY - $hubH/2.0), [float]$hubW, [float]$hubH)

    # 3. Dynamic 3D Cyber Runner Character (Jumping forward above the disc)
    $cubeCx = $cx
    $cubeCy = $cy - 35 * $s * $scaleFactor
    $cubeW = 92 * $s * $scaleFactor
    $cubeH = 92 * $s * $scaleFactor
    $cubeD = 38 * $s * $scaleFactor

    # Speed Trail / Energy Particle Streaks behind cube
    $trailPen1 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 0, 240, 255), [float](6 * $s * $scaleFactor))
    $g.DrawLine($trailPen1, [float]($cubeCx - 36 * $s * $scaleFactor), [float]($cubeCy + 65 * $s * $scaleFactor), [float]($cubeCx - 70 * $s * $scaleFactor), [float]($cubeCy + 125 * $s * $scaleFactor))
    $g.DrawLine($trailPen1, [float]($cubeCx + 36 * $s * $scaleFactor), [float]($cubeCy + 65 * $s * $scaleFactor), [float]($cubeCx + 70 * $s * $scaleFactor), [float]($cubeCy + 125 * $s * $scaleFactor))

    # Cube Ambient Glow
    $cubeGlowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $cubeGlowPath.AddEllipse([float]($cubeCx - 90 * $s * $scaleFactor), [float]($cubeCy - 90 * $s * $scaleFactor), [float](180 * $s * $scaleFactor), [float](180 * $s * $scaleFactor))
    $cgp = New-Object System.Drawing.Drawing2D.PathGradientBrush($cubeGlowPath)
    $cgp.CenterColor = [System.Drawing.Color]::FromArgb(130, 0, 240, 255)
    $cgp.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 0, 240, 255))
    $g.FillPath($cgp, $cubeGlowPath)

    # 3D Cube: Front Face (Vibrant Neon Cyan)
    $frontBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#00d2ff'))
    $frontRect = New-Object System.Drawing.RectangleF([float]($cubeCx - $cubeW/2.0), [float]($cubeCy - $cubeH/2.0), [float]$cubeW, [float]$cubeH)
    $g.FillRectangle($frontBrush, $frontRect)

    # 3D Cube: Top Face (Highlight Bevel)
    $topBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#80f7ff'))
    $topPoly = @(
        (New-Object System.Drawing.PointF([float]($cubeCx - $cubeW/2.0), [float]($cubeCy - $cubeH/2.0))),
        (New-Object System.Drawing.PointF([float]($cubeCx - $cubeW/2.0 + $cubeD*0.6), [float]($cubeCy - $cubeH/2.0 - $cubeD*0.5))),
        (New-Object System.Drawing.PointF([float]($cubeCx + $cubeW/2.0 + $cubeD*0.6), [float]($cubeCy - $cubeH/2.0 - $cubeD*0.5))),
        (New-Object System.Drawing.PointF([float]($cubeCx + $cubeW/2.0), [float]($cubeCy - $cubeH/2.0)))
    )
    $g.FillPolygon($topBrush, $topPoly)

    # 3D Cube: Right Side Face (Shadow/Depth)
    $sideBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#0088cc'))
    $sidePoly = @(
        (New-Object System.Drawing.PointF([float]($cubeCx + $cubeW/2.0), [float]($cubeCy - $cubeH/2.0))),
        (New-Object System.Drawing.PointF([float]($cubeCx + $cubeW/2.0 + $cubeD*0.6), [float]($cubeCy - $cubeH/2.0 - $cubeD*0.5))),
        (New-Object System.Drawing.PointF([float]($cubeCx + $cubeW/2.0 + $cubeD*0.6), [float]($cubeCy + $cubeH/2.0 - $cubeD*0.5))),
        (New-Object System.Drawing.PointF([float]($cubeCx + $cubeW/2.0), [float]($cubeCy + $cubeH/2.0)))
    )
    $g.FillPolygon($sideBrush, $sidePoly)

    # Cube Edge Highlighting Pens
    $edgePen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#ffffff'), [float](3.5 * $s * $scaleFactor))
    $g.DrawRectangle($edgePen, $frontRect.X, $frontRect.Y, $frontRect.Width, $frontRect.Height)
    $g.DrawPolygon($edgePen, $topPoly)
    $g.DrawPolygon($edgePen, $sidePoly)

    # Glowing Runner Visor (White Core with Golden Energy Accents)
    $visorW = $cubeW * 0.72
    $visorH = $cubeH * 0.28
    $visorX = $cubeCx - $visorW / 2.0
    $visorY = $cubeCy - $visorH / 2.0 - 4 * $s * $scaleFactor

    $visorGlow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 255, 255, 255))
    $g.FillRectangle($visorGlow, [float]($visorX - 3 * $s * $scaleFactor), [float]($visorY - 3 * $s * $scaleFactor), [float]($visorW + 6 * $s * $scaleFactor), [float]($visorH + 6 * $s * $scaleFactor))

    $visorBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#ffffff'))
    $g.FillRectangle($visorBrush, [float]$visorX, [float]$visorY, [float]$visorW, [float]$visorH)

    # Golden Energy Dots (Sparks/Multiplier Energy)
    $sparkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#ffea00'))
    $g.FillEllipse($sparkBrush, [float]($cx - 150 * $s * $scaleFactor), [float]($cy - 120 * $s * $scaleFactor), [float](10 * $s * $scaleFactor), [float](10 * $s * $scaleFactor))
    $g.FillEllipse($sparkBrush, [float]($cx + 140 * $s * $scaleFactor), [float]($cy - 100 * $s * $scaleFactor), [float](12 * $s * $scaleFactor), [float](12 * $s * $scaleFactor))
    $g.FillEllipse($sparkBrush, [float]($cx + 110 * $s * $scaleFactor), [float]($cy + 60 * $s * $scaleFactor), [float](8 * $s * $scaleFactor), [float](8 * $s * $scaleFactor))

    # Save PNG
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated $path"
}

Draw-DiscRunIcon 512 'icon-512.png' $false
Draw-DiscRunIcon 192 'icon-192.png' $false
Draw-DiscRunIcon 512 'icon-512-maskable.png' $true