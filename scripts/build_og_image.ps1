Add-Type -AssemblyName System.Drawing

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$mapPath = Join-Path $projectRoot 'public\figma\hero.png'
$logoPath = Join-Path $projectRoot 'public\figma\header-logo.png'
$outputPath = Join-Path $projectRoot 'public\portada-mapa-del-agua.png'

$canvas = [System.Drawing.Bitmap]::new(1200, 630)
$map = [System.Drawing.Image]::FromFile($mapPath)
$logo = [System.Drawing.Image]::FromFile($logoPath)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

try {
  $graphics.Clear([System.Drawing.Color]::White)
  $graphics.DrawImage($map, [System.Drawing.Rectangle]::new(0, 0, 1200, 630))
  $veil = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(242, 255, 255, 255))
  $navy = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(26, 39, 65))
  $red = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(201, 54, 54))
  $white = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
  $titleFont = [System.Drawing.Font]::new('Arial', 24, [System.Drawing.FontStyle]::Bold)
  $labelFont = [System.Drawing.Font]::new('Arial', 16, [System.Drawing.FontStyle]::Bold)
  try {
    $graphics.FillRectangle($veil, 0, 0, 750, 630)
    $graphics.FillRectangle($red, 0, 0, 1200, 66)
    $graphics.DrawString('SANTA FE · PREVENCIÓN HÍDRICA', $labelFont, $white, 64, 22)
    $graphics.DrawImage($logo, [System.Drawing.Rectangle]::new(60, 185, 640, 169))
    $graphics.FillRectangle($navy, 0, 544, 1200, 86)
    $graphics.DrawString('TATI RESTAGNO', $titleFont, $white, 60, 565)
  }
  finally {
    $veil.Dispose(); $navy.Dispose(); $red.Dispose(); $white.Dispose()
    $titleFont.Dispose(); $labelFont.Dispose()
  }
  $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
  $graphics.Dispose(); $map.Dispose(); $logo.Dispose(); $canvas.Dispose()
}
