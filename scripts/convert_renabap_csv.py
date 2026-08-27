from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path


POLYGON_PATTERN = re.compile(r"POLYGON\s*\(\((.*?)\)\)", re.IGNORECASE | re.DOTALL)
RING_SEPARATOR = re.compile(r"\)\s*,\s*\(")


def parse_polygon_payload(payload: str) -> list[list[list[float]]]:
    rings: list[list[list[float]]] = []
    for ring_text in RING_SEPARATOR.split(payload):
        ring: list[list[float]] = []
        for coordinate in ring_text.split(","):
            values = coordinate.strip().split()
            if len(values) < 2:
                raise ValueError(f"Coordenada WKT inválida: {coordinate!r}")
            ring.append([float(values[0]), float(values[1])])

        if len(ring) < 4:
            raise ValueError("Un anillo debe contener al menos cuatro coordenadas.")
        if ring[0] != ring[-1]:
            ring.append(ring[0])
        rings.append(ring)

    return rings


def parse_geometry(wkt: str) -> tuple[dict[str, object], int]:
    polygon_payloads = POLYGON_PATTERN.findall(wkt)
    if not polygon_payloads:
        raise ValueError(f"Geometría no soportada: {wkt[:80]}")

    polygons = [parse_polygon_payload(payload) for payload in polygon_payloads]
    if len(polygons) == 1:
        return {"type": "Polygon", "coordinates": polygons[0]}, 1
    return {"type": "MultiPolygon", "coordinates": polygons}, len(polygons)


def integer_or_none(value: str | None) -> int | None:
    text = (value or "").strip()
    return int(text) if text else None


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Uso: convert_renabap_csv.py <origen.csv> <salida.geojson>")

    source_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    features: list[dict[str, object]] = []
    polygon_parts = 0
    min_lon = min_lat = float("inf")
    max_lon = max_lat = float("-inf")

    with source_path.open("r", encoding="utf-8-sig", newline="") as source:
        rows = csv.DictReader(source)
        required = {"WKT", "Nombre", "Descripción", "provincia", "departamento", "localidad", "familias"}
        missing = required.difference(rows.fieldnames or [])
        if missing:
            raise ValueError(f"Faltan columnas requeridas: {', '.join(sorted(missing))}")

        for row_number, row in enumerate(rows, start=2):
            try:
                geometry, parts = parse_geometry(row["WKT"])
            except ValueError as error:
                raise ValueError(f"Fila {row_number}: {error}") from error

            polygon_parts += parts
            coordinate_groups = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
            for polygon in coordinate_groups:
                for ring in polygon:
                    for longitude, latitude in ring:
                        min_lon = min(min_lon, longitude)
                        min_lat = min(min_lat, latitude)
                        max_lon = max(max_lon, longitude)
                        max_lat = max(max_lat, latitude)

            features.append({
                "type": "Feature",
                "id": int(row["Nombre"]),
                "geometry": geometry,
                "properties": {
                    "renabap_id": int(row["Nombre"]),
                    "barrio": row["Descripción"].strip(),
                    "familias": integer_or_none(row["familias"]),
                    "localidad": row["localidad"].strip(),
                    "departamento": row["departamento"].strip(),
                    "provincia": row["provincia"].strip(),
                },
            })

    bbox = [min_lon, min_lat, max_lon, max_lat]
    collection = {
        "type": "FeatureCollection",
        "name": "Barrios RENABAP - Santa Fe",
        "source": source_path.name,
        "bbox": bbox,
        "features": features,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(collection, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    geometry_counts: dict[str, int] = {}
    for feature in features:
        geometry_type = str(feature["geometry"]["type"])
        geometry_counts[geometry_type] = geometry_counts.get(geometry_type, 0) + 1

    print(json.dumps({
        "features": len(features),
        "polygon_parts": polygon_parts,
        "geometry_types": geometry_counts,
        "families": sum(int(feature["properties"]["familias"] or 0) for feature in features),
        "bbox": bbox,
        "output": str(output_path),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
