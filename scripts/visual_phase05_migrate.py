"""Run the published migrations against the named homologation database only."""
import os,re,sys
from pathlib import Path
from urllib.parse import urlsplit
from sqlalchemy import event,Engine
from alembic.config import Config
from alembic import command

database='pcp_unificado_homolog_20261016'
target=urlsplit(os.environ['DATABASE_URL'])
assert target.hostname in ('localhost','127.0.0.1') and target.path=='/'+database,'Homologation DSN only'
role=os.environ['HOMOLOG_RUNTIME_ROLE']
assert re.fullmatch(r'[a-zA-Z_][a-zA-Z0-9_]*',role)

@event.listens_for(Engine,'before_cursor_execute',retval=True)
def isolated_grants(connection,cursor,statement,parameters,context,executemany):
    # Preserve migration bytes and business permissions. Substitute only the
    # environment-specific SQL service role in GRANT statements.
    statement=re.sub(r'\bTO\s+pcp_unificado_app\b','TO "'+role+'"',statement,flags=re.I)
    return statement,parameters

stage=Path(__file__).resolve().parent
config=Config(str(stage/'release/pcp-api/alembic.ini'))
config.set_main_option('script_location',str(stage/'release/pcp-api/alembic'))
command.upgrade(config,'head')
