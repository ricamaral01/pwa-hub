"""Tipos de interface estáveis para cadastros e importação."""
from __future__ import annotations
from typing import Any
from pydantic import BaseModel, Field

class CadastroPayload(BaseModel):
    data: dict[str, Any] = Field(default_factory=dict)

class ImportLine(BaseModel):
    linha: int
    ok: bool
    erro: str | None = None

class ImportReport(BaseModel):
    ok: bool
    gravados: int
    linhas: list[ImportLine]
