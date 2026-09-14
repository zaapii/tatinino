param(
  [string]$InputDirectory = (Join-Path $env:USERPROFILE 'Downloads'),
  [string]$InputSuffix = ''
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.IO.Compression.FileSystem
$outputDirectory = Join-Path $PSScriptRoot '../public/data/hydraulics'
$imports = @(@('Canales.kmz.zip','canales.geojson'), @('Estaciones de bombeo.kmz.zip','estaciones_bombeo.geojson'), @('Reservorios.kmz.zip','reservorios.geojson'))
function Read-Coordinates($element) {
  $points = @($element.InnerText.Trim() -split '\s+' | ForEach-Object { $parts = $_ -split ','; ,@([double]::Parse($parts[0], [cultureinfo]::InvariantCulture), [double]::Parse($parts[1], [cultureinfo]::InvariantCulture)) })
  return ,$points
}
foreach ($item in $imports) {
  $inputName = $item[0].Replace('.kmz.zip', ".kmz$InputSuffix.zip")
  $zip = [IO.Compression.ZipFile]::OpenRead((Join-Path $InputDirectory $inputName))
  $reader = [IO.StreamReader]::new($zip.GetEntry('doc.kml').Open())
  [xml]$doc = $reader.ReadToEnd()
  $reader.Dispose(); $zip.Dispose()
  $features = @($doc.SelectNodes('//*[local-name()="Placemark"]') | ForEach-Object {
    $placemark = $_
    $shape = $placemark.SelectSingleNode('./*[local-name()="Point" or local-name()="LineString" or local-name()="Polygon"]')
    if (!$shape) { throw 'Unsupported geometry' }
    if ($shape.LocalName -eq 'Polygon') {
      $coordinates = @($shape.SelectNodes('.//*[local-name()="LinearRing"]/*[local-name()="coordinates"]') | ForEach-Object { ,(Read-Coordinates $_) })
    } else {
      $coordinates = Read-Coordinates $shape.SelectSingleNode('./*[local-name()="coordinates"]')
      if ($shape.LocalName -eq 'Point') { $coordinates = $coordinates[0] }
    }
    @{ type = 'Feature'; properties = @{ name = [string]$placemark.name; description = [string]$placemark.description; source = $inputName }; geometry = @{ type = $shape.LocalName; coordinates = $coordinates } }
  })
  @{ type = 'FeatureCollection'; features = $features } | ConvertTo-Json -Depth 30 -Compress | Set-Content -Encoding utf8 (Join-Path $outputDirectory $item[1])
  Write-Output "$($item[1]): $($features.Count)"
}
