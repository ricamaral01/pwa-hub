"""Exit nonzero when the Supabase legacy mirror has not succeeded recently."""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path


state_path = Path("/opt/concrefer-unificado/migration/supabase-sync/state.json")
last_success = datetime.fromisoformat(
    json.loads(state_path.read_text(encoding="utf-8"))["last_success_utc"]
)
age = (datetime.now(timezone.utc) - last_success).total_seconds()
print("mirror_success_age_seconds=" + str(round(age, 1)))
sys.exit(0 if age <= 120 else 1)
