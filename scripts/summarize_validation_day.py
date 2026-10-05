"""Summarize test-environment errors and problem reports for one local day."""

from __future__ import annotations

import argparse
from datetime import date
import json
import subprocess


def run(*args: str) -> str:
    return subprocess.run(args, check=True, text=True, capture_output=True).stdout


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("day", nargs="?", default=date.today().isoformat())
    args = parser.parse_args()
    day = date.fromisoformat(args.day).isoformat()
    sql = f"""
WITH bounds AS (
  SELECT ('{day}'::date AT TIME ZONE 'America/Sao_Paulo') AS start_at,
         (('{day}'::date + 1) AT TIME ZONE 'America/Sao_Paulo') AS end_at
)
SELECT json_build_object(
  'problem_reports', (SELECT count(*) FROM unificado_auth.problem_reports,bounds WHERE created_at>=start_at AND created_at<end_at),
  'client_errors', (SELECT count(*) FROM unificado_auth.client_errors,bounds WHERE created_at>=start_at AND created_at<end_at),
  'client_error_groups', COALESCE((SELECT json_agg(row_to_json(g)) FROM (
    SELECT route,error_code,count(*) AS total FROM unificado_auth.client_errors,bounds
    WHERE created_at>=start_at AND created_at<end_at GROUP BY route,error_code ORDER BY total DESC
  ) g),'[]'::json),
  'reports', COALESCE((SELECT json_agg(row_to_json(r)) FROM (
    SELECT created_at AT TIME ZONE 'America/Sao_Paulo' AS local_time,actor,screen,version,report_text
    FROM unificado_auth.problem_reports,bounds WHERE created_at>=start_at AND created_at<end_at ORDER BY created_at
  ) r),'[]'::json)
);
"""
    db = run("sudo", "-u", "postgres", "psql", "-X", "-A", "-t", "-d", "mapa_unificado_teste",
             "-c", sql).strip()
    journal = run("journalctl", "-u", "mapa-unificado-auth.service", "--since", day + " 00:00:00",
                  "--until", day + " 23:59:59", "--no-pager", "-o", "cat")
    server_errors = []
    for line in journal.splitlines():
        if '"event":"http_error"' in line:
            try:
                server_errors.append(json.loads(line[line.index("{"):]))
            except (ValueError, json.JSONDecodeError):
                pass
    result = json.loads(db)
    result["server_http_errors"] = len(server_errors)
    counts = {}
    for item in server_errors:
        key = f"{item.get('method')} {item.get('route')} {item.get('status')}"
        counts[key] = counts.get(key, 0) + 1
    result["server_error_groups"] = counts
    print(json.dumps(result, ensure_ascii=False, indent=2, default=str))


if __name__ == "__main__":
    main()
