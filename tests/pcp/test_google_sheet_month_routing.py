"""The TV must not silently import October from August's workbook."""
from datetime import date
import os
from pathlib import Path
import sys
from unittest.mock import patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'unificado' / 'pcp' / 'backend'))
os.environ['DEBUG'] = 'false'
from app.repositories.google_sheets_repository import GoogleSheetsRepository, GoogleSheetsRepositoryError
from app.repositories import google_sheets_repository as repo_module


def test_october_2026_uses_its_own_workbook():
    with patch.object(repo_module.settings, 'SPREADSHEET_ID_10', 'october-sheet'):
        repository = GoogleSheetsRepository()
        assert repository._spreadsheet_id_para_periodo(date(2026, 10, 16), date(2026, 10, 16)) == 'october-sheet'


def test_october_missing_configuration_fails_closed():
    with patch.object(repo_module.settings, 'SPREADSHEET_ID_10', ''):
        repository = GoogleSheetsRepository()
        with pytest.raises(GoogleSheetsRepositoryError, match='outubro'):
            repository._spreadsheet_id_para_periodo(date(2026, 10, 16), date(2026, 10, 16))


def test_explicit_workbook_is_honored_for_read_only_diagnostics():
    repository = GoogleSheetsRepository(spreadsheet_id='diagnostic-sheet')
    assert repository._spreadsheet_id_para_periodo(date(2026, 10, 16), date(2026, 10, 16)) == 'diagnostic-sheet'
