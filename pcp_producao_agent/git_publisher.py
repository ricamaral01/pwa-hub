"""
git_publisher.py
Publica o relatório HTML no GitHub Pages via git add/commit/push.
"""
import logging
import subprocess
from pathlib import Path

import config

logger = logging.getLogger("pcp_producao_agent")


class GitPublisher:
    def __init__(self):
        self.repo_root = config.PROJECT_ROOT
        self.base_url = config.REPORT_BASE_URL.rstrip("/")
        self.dry_run = config.DRY_RUN

    def publish(self, report_path: Path, date_str: str) -> str | None:
        """
        Faz git add/commit/push do relatório e retorna a URL pública.
        Em dry-run, apenas loga e retorna a URL que seria gerada.

        Retorna a URL pública do relatório ou None em caso de falha.
        """
        # Garante que report_path é um objeto Path
        report_path = Path(report_path)

        # Caminho relativo ao repositório (usado na URL e no git add)
        try:
            rel_path = report_path.resolve().relative_to(self.repo_root.resolve())
        except ValueError:
            logger.error(
                f"O relatório '{report_path}' está fora do repositório '{self.repo_root}'. "
                "Não é possível publicar."
            )
            return None

        # URL pública que será enviada pelo WhatsApp
        public_url = f"{self.base_url}/{rel_path.as_posix()}"

        if self.dry_run:
            logger.info("=== [GIT PUBLISH SIMULATION (DRY-RUN)] ===")
            logger.info(f"  git add {rel_path}")
            logger.info(f'  git commit -m "relatorio: PCP x Producao {date_str}"')
            logger.info("  git push")
            logger.info(f"  URL pública: {public_url}")
            logger.info("===========================================")
            return public_url

        logger.info(f"Publicando relatório no GitHub Pages: {rel_path}")
        try:
            self._run(["git", "add", str(rel_path)])
            has_changes = subprocess.run(
                ["git", "diff", "--cached", "--quiet", "--", str(rel_path)],
                cwd=str(self.repo_root),
                check=False,
            ).returncode != 0

            if has_changes:
                self._run(["git", "commit", "-m", f"relatorio: PCP x Producao {date_str}"])
            else:
                logger.info("Relatório sem alterações; nenhum novo commit necessário.")

            self._run(["git", "push"])
            logger.info(f"Relatório publicado com sucesso: {public_url}")
            return public_url
        except subprocess.CalledProcessError as e:
            logger.error(f"Falha ao publicar relatório via git: {e}")
            return None

    def _run(self, cmd: list[str]):
        result = subprocess.run(
            cmd,
            cwd=str(self.repo_root),
            capture_output=True,
            text=True,
            encoding="utf-8",
            check=True,
        )
        if result.stdout.strip():
            logger.info(f"[git] {result.stdout.strip()}")
        if result.stderr.strip():
            logger.debug(f"[git stderr] {result.stderr.strip()}")
        return result
