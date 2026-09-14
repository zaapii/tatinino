param(
  [Parameter(Mandatory)][string]$InputArchive,
  [Parameter(Mandatory)][string]$OutputMigration,
  [string]$OutputPendingCsv
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::OpenRead($InputArchive)
try {
  $reader = [IO.StreamReader]::new($archive.GetEntry('doc.kml').Open())
  try { [xml]$document = $reader.ReadToEnd() } finally { $reader.Dispose() }
} finally { $archive.Dispose() }

function Sql-Text([string]$value) { return "'" + $value.Replace("'", "''") + "'" }
$aliases = @{
  'Desagüe tapado' = 'Desague tapado'
  'Desague' = 'Desague tapado'
  'Desague / Agua' = 'Desague tapado'
}
$allowed = @('Boca de tormenta obstruida', 'Acumulación de basura', 'Calle inundada', 'Canales o zanjones obstruidos', 'Población en zona de riesgo hídrico', 'Defensa o terraplén en mal estado', 'Obra paralizada', 'Otro', 'Desague tapado')
$rows = @()
$summary = @()
$missingCoordinates = @()
$index = 0
foreach ($mark in $document.SelectNodes('//*[local-name()="Placemark"]')) {
  $index++
  $fields = @{}
  foreach ($field in $mark.SelectNodes('./*[local-name()="ExtendedData"]/*[local-name()="Data"]')) {
    $fields[$field.GetAttribute('name')] = $field.SelectSingleNode('./*[local-name()="value"]').InnerText.Trim()
  }
  $topic = $fields['Tipo']
  if ($aliases.ContainsKey($topic)) { $topic = $aliases[$topic] }
  if ($topic -notin $allowed) { throw "Categoría desconocida en punto ${index}: $topic" }
  $point = $mark.SelectSingleNode('./*[local-name()="Point"]/*[local-name()="coordinates"]')
  if (!$point) {
    $missingCoordinates += [pscustomobject]@{ number = $index; neighborhood = $mark.SelectSingleNode('./*[local-name()="name"]').InnerText; category = $topic }
    continue
  }
  $parts = $point.InnerText.Trim() -split ','
  $longitude = [double]::Parse($parts[0], [cultureinfo]::InvariantCulture)
  $latitude = [double]::Parse($parts[1], [cultureinfo]::InvariantCulture)
  if (![double]::IsFinite($longitude) -or ![double]::IsFinite($latitude) -or $longitude -lt -60.95 -or $longitude -gt -60.45 -or $latitude -lt -31.82 -or $latitude -gt -31.45) { throw "Punto $index fuera del área permitida" }
  # Corrected exports may omit Descripcion; keep it empty for new rows and
  # preserve the prior value when the stable ID already exists.
  $description = [string]$fields['Descripcion']
  $neighborhood = $mark.SelectSingleNode('./*[local-name()="name"]').InnerText.Trim()
  if ($description.Length -gt 200 -or $neighborhood.Length -gt 120) { throw "Texto demasiado largo en punto $index; revisar sin truncar" }
  # Stable IDs make reruns safe; keep distinct placemarks even at the same point.
  $hash = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes("reclamos-asambleas-v1:$index"))).ToLower().Substring(0,32)
  $id = "$($hash.Substring(0,8))-$($hash.Substring(8,4))-$($hash.Substring(12,4))-$($hash.Substring(16,4))-$($hash.Substring(20,12))"
  # Deliberately ignore Localizacion / direccion; use only KML coordinates.
  $rows += "($(Sql-Text $id), $(Sql-Text $topic), $(Sql-Text $description), $(Sql-Text $neighborhood), $($latitude.ToString('R', [cultureinfo]::InvariantCulture)), $($longitude.ToString('R', [cultureinfo]::InvariantCulture)), null, null, null, 'approved')"
  $summary += $topic
}
if ($index -ne 204 -or $rows.Count -ne 204 -or $missingCoordinates.Count -ne 0) { throw 'El archivo corregido debe contener exactamente 204 puntos con coordenadas.' }
$sql = @"
-- Source: corrected Puntos de Reclamos.kmz.zip. Coordinates come exclusively from KML Points.
-- Stable IDs synchronize the prior 135 rows and insert the 69 newly georeferenced rows.
-- Existing descriptions are preserved because the corrected export does not contain them.
begin;
alter table public.citizen_reports drop constraint citizen_reports_topic_check;
alter table public.citizen_reports add constraint citizen_reports_topic_check check (topic in (
  $(( $allowed | ForEach-Object { Sql-Text $_ }) -join ', ')
));
-- Bypass the photo requirement only for this transaction's reviewed import.
-- ALTER TABLE holds an exclusive lock until COMMIT; public submissions remain validated.
alter table public.citizen_reports disable trigger validate_citizen_report_submission;
insert into public.citizen_reports (id, topic, description, neighborhood, latitude, longitude, photo_path, photo_name, address, status) values
$($rows -join ",`n")
on conflict (id) do update set
  topic = excluded.topic,
  description = case
    when excluded.description = '' then citizen_reports.description
    else excluded.description
  end,
  neighborhood = excluded.neighborhood,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  status = excluded.status;
alter table public.citizen_reports enable trigger validate_citizen_report_submission;
commit;
"@
$sql | Set-Content -LiteralPath $OutputMigration -Encoding utf8
$summary | Group-Object | Select-Object Name,Count | Format-Table -AutoSize
Write-Output "Pendientes sin coordenadas: $($missingCoordinates.Count)"
if ($OutputPendingCsv) { $missingCoordinates | Export-Csv -LiteralPath $OutputPendingCsv -NoTypeInformation -Encoding utf8 }
