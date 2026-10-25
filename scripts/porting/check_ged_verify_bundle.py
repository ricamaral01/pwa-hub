"""Report safe markers from a compiled GED calibration verification page."""
from pathlib import Path

for path in sorted(Path("/root/ged-a6-20261015-prepared").glob("chunk-*.js")):
    source = path.read_text(errors="replace")
    print({
        "chunk": path.name,
        "uses_internal_api_env": "GED_INTERNAL_API_URL" in source,
        "uses_public_api_env": "NEXT_PUBLIC_API_URL" in source,
        "embeds_relative_prefixed_api": "/unificado/ged/api/calibrations/public" in source,
        "embeds_relative_plain_api": "/api/calibrations/public" in source,
        "has_calibration_public": "calibrations/public" in source,
    })
