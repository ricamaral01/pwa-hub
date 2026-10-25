"""Configuration for the private reporting process."""

import os
from types import SimpleNamespace


settings = SimpleNamespace(POSTGRES_URL=os.environ["USINAS_REPORTING_DATABASE_URL"])
