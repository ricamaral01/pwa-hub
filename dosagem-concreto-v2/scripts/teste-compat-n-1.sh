#!/usr/bin/env bash
set -euo pipefail
PYTHONPATH=api python -m pytest api/tests/test_n_minus_one41.py -q
