"""Inspect only safe booleans for the GED frontend's internal API setting."""
import json
import sys

items = json.load(sys.stdin)
matches = [item.split("=", 1)[1] for item in items if item.startswith("GED_INTERNAL_API_URL=")]
value = matches[0] if matches else ""
print({"internal_api_env_present": bool(matches),
       "internal_api_env_absolute_http": value.startswith(("http://", "https://"))})
