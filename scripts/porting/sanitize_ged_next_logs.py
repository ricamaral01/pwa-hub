"""Summarize GED Next errors without printing URLs, tokens or request content."""
import re
import sys

log = sys.stdin.read()
types = sorted(set(re.findall(r"\b(?:TypeError|ReferenceError|SyntaxError|RangeError|Error):", log)))
properties = sorted(set(re.findall(r"reading ['\"]([A-Za-z_]+)['\"]", log)))
codes = sorted(set(re.findall(r"\b(?:ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EAI_AGAIN)\b", log)))
phrases = [phrase for phrase in ("fetch failed", "invalid url", "Failed to parse URL") if phrase in log]
bad_urls = re.findall(r"Failed to parse URL from ([^\s]+)", log)
url_shapes = sorted({(value.startswith("/"), value.startswith(("http://", "https://")),
                      "calibrations" in value, "undefined" in value, len(value)) for value in bad_urls})
print({"error_types": types, "properties": properties, "network_codes": codes,
       "known_phrases": phrases,
       "relative_calibration_fetch": "Failed to parse URL from /api/calibrations" in log,
       "absolute_internal_fetch": "Failed to parse URL from http://backend:" in log,
       "bad_url_shapes": url_shapes,
       "bad_url_is_prefixed_api": any(v.startswith("/unificado/ged/api/") for v in bad_urls),
       "bad_url_is_plain_api": any(v.startswith("/api/") for v in bad_urls),
       "log_lines": len(log.splitlines())})
