"""Convert supplied KML/KMZ/ZIP neighborhood data without merging records."""
from __future__ import annotations

import io
import json
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

NS = {"k": "http://www.opengis.net/kml/2.2"}
PROPERTY_NAMES = {
    "id_renabap": "renabap_id", "renabap_id": "renabap_id",
    "familias": "familias", "localidad": "localidad",
    "departamento": "departamento", "provincia": "provincia",
    "situacion": "situacion",
}


def kml_payloads(data: bytes):
    if not zipfile.is_zipfile(io.BytesIO(data)):
        yield data
        return
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        for name in archive.namelist():
            if name.lower().endswith((".kml", ".kmz", ".zip")):
                yield from kml_payloads(archive.read(name))


def ring_coordinates(boundary: ET.Element) -> list[list[float]]:
    text = boundary.findtext("k:LinearRing/k:coordinates", namespaces=NS) or ""
    ring = [[float(value) for value in coordinate.split(",")[:2]] for coordinate in text.split()]
    if not ring:
        raise ValueError("Empty polygon ring")
    if ring[0] != ring[-1]:
        ring.append(ring[0][:])
    if len(ring) < 4 or any(not (-180 <= lon <= 180 and -90 <= lat <= 90) for lon, lat in ring):
        raise ValueError("Invalid polygon coordinates")
    return ring


def convert(source: Path, output: Path) -> None:
    features = []
    polygon_count = 0
    for payload in kml_payloads(source.read_bytes()):
        root = ET.fromstring(payload)
        for placemark in root.findall(".//k:Placemark", NS):
            properties = {"barrio": placemark.findtext("k:name", namespaces=NS) or ""}
            for item in placemark.findall("k:ExtendedData/k:Data", NS):
                key = PROPERTY_NAMES.get(item.get("name", "").lower())
                if key:
                    value = item.findtext("k:value", namespaces=NS) or ""
                    properties[key] = int(value) if key in ("renabap_id", "familias") and value else value
            polygons = []
            for polygon in placemark.findall(".//k:Polygon", NS):
                outer = polygon.find("k:outerBoundaryIs", NS)
                if outer is None:
                    raise ValueError(f"Missing outer boundary: {properties['barrio']}")
                polygons.append([ring_coordinates(outer), *[
                    ring_coordinates(inner) for inner in polygon.findall("k:innerBoundaryIs", NS)
                ]])
            if not polygons:
                raise ValueError(f"Missing polygon: {properties['barrio']}")
            polygon_count += len(polygons)
            geometry = {"type": "Polygon", "coordinates": polygons[0]} if len(polygons) == 1 else {
                "type": "MultiPolygon", "coordinates": polygons,
            }
            features.append({"type": "Feature", "properties": properties, "geometry": geometry})
    if not features:
        raise ValueError("No neighborhoods found")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{output}: {len(features)} records, {polygon_count} polygon parts")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: convert_neighborhood_kmz.py <source.kmz.zip> <output.geojson>")
    convert(Path(sys.argv[1]), Path(sys.argv[2]))
