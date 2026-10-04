"""Build a password-free account matching review from test databases."""

from __future__ import annotations

from datetime import datetime
import json
from pathlib import Path
import subprocess


ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "docs" / "unificacao-contas.md"


def display(row: dict, side: str) -> str:
    login = row["login"]
    name = row["name"]
    role = row["role"]
    active = "ativa" if row["active"] else "inativa"
    first = "primeiro acesso" if row["first_access"] else "acesso normal"
    return f"`{login}` | {name} | {role} | {active}, {first}"


def table(rows: list[dict], side: str) -> list[str]:
    lines = ["| Login | Nome | Perfil | Situação |", "|---|---|---|---|"]
    for row in rows:
        lines.append("| " + display(row, side).replace(" | ", " | ") + " |")
    return lines


def main() -> None:
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "/opt/concrefer-unificado/mapa-api/.venv/bin/python",
         "/opt/concrefer-unificado/migration/audit_unificado_accounts.py"],
        text=True, encoding="utf-8")
    report = json.loads(raw)
    confirmed = {(item["pcp_user_id"], item["mapa_login"])
                 for item in report["confirmed_links"]}
    pending = [item for item in report["candidate_pairs"]
               if (item["pcp"]["id"], item["mapa"]["login"]) not in confirmed]
    now = datetime.now().astimezone().strftime("%d/%m/%Y %H:%M %Z")
    lines = ["# Unificação de contas — revisão de identidades", "",
             f"Inventário dos bancos de testes em {now}. Nenhuma senha ou hash foi consultado para gerar este documento.", "",
             f"**Pares confirmados: {len(confirmed)}.** Somente o par com login e nome iguais foi vinculado automaticamente. Os demais permanecem separados até confirmação individual do Ricardo.", "",
             f"PCP: {report['counts']['pcp']} contas; Mapa: {report['counts']['mapa']} contas. "
             f"Só PCP: {len(report['pcp_only'])}; só Mapa: {len(report['mapa_only'])}; "
             f"pares candidatos pendentes: {len(pending)}; logins iguais com nomes diferentes: {len(report['same_login_different_names'])}.", "",
             "## Contas só do PCP (sem par candidato)", ""]
    lines.extend(table(report["pcp_only"], "pcp"))
    lines.extend(["", "## Contas só do Mapa (sem par candidato)", ""])
    lines.extend(table(report["mapa_only"], "mapa"))
    lines.extend(["", "## Pares candidatos — confirmar um a um", "",
                  "| Nº | PCP: login, nome, perfil, situação | Mapa: login, nome, perfil, situação | Motivo | Decisão |",
                  "|---:|---|---|---|---|"])
    for index, item in enumerate(report["candidate_pairs"], 1):
        decision = "confirmado automaticamente; Mapa é a base" if \
            (item["pcp"]["id"], item["mapa"]["login"]) in confirmed else "pendente"
        lines.append(f"| {index} | {display(item['pcp'], 'pcp').replace(' | ', '<br>')} | "
                     f"{display(item['mapa'], 'mapa').replace(' | ', '<br>')} | {item['reason']} | {decision} |")
    lines.extend(["", "## Mesmo login, nomes diferentes — revisar antes de unir", "",
                  "| Login | PCP: nome, perfil, situação | Mapa: nome, perfil, situação | Decisão |",
                  "|---|---|---|---|"])
    for item in report["same_login_different_names"]:
        pcp, mapa = item["pcp"], item["mapa"]
        lines.append(f"| `{pcp['login']}` | {pcp['name']}, {pcp['role']}, "
                     f"{'ativa' if pcp['active'] else 'inativa'} | {mapa['name']}, "
                     f"{mapa['role']}, {'ativa' if mapa['active'] else 'inativa'} | pendente |")
    lines.extend(["", "## Ricardo", "",
                  "O login literal `Ricardo` existe no PCP de testes com perfil ADMIN, ativo e fora de primeiro acesso. "
                  "No Mapa de testes, o cadastro ativo de nome `Ricardo` tem login `user-ricardo`, perfil GERENCIA e não está em primeiro acesso. "
                  "Não há login literal `Ricardo` no Mapa. Há ainda `user-ricardo-do-amaral`, inativo e em primeiro acesso; "
                  "o nome coincide com o cadastro PCP, mas isto não confirma identidade. "
                  "Nenhuma senha do Ricardo foi acessada para esta auditoria.", "",
                  "## Regras até confirmação", "",
                  "- Cada conta mantém seu próprio login, senha, perfil e situação.",
                  "- Vincular automaticamente somente login e nome iguais, únicos dos dois lados; nos demais, não unir sem confirmação.",
                  "- Após confirmação, registrar a identidade no serviço de autenticação de testes e preservar os perfis específicos de cada módulo.", ""])
    lines.extend([
        "## Implementação no ambiente de testes", "",
        "A tela de login existente envia a credencial ao serviço do unificado. Contas só do PCP recebem sessão PCP; contas só do Mapa recebem sessão Mapa; o logout encerra as duas. A página `/unificado/testar/` exige uma dessas sessões. Primeiro acesso de cada sistema usa o mesmo formulário visual, com senha nova de no mínimo seis caracteres; senhas antigas mais curtas continuam aceitas até a troca.", "",
        "`unificado_auth.identity_links` no PostgreSQL Mapa de testes guarda somente pares confirmados e hashes, sem texto de senha. O par exato Marcelo foi vinculado; no primeiro login válido com a credencial do Mapa, o serviço gravará o hash compatível no PCP e abrirá ambos os módulos sem troca forçada. Os demais pares seguem pendentes. A nova senha gera bcrypt para o PCP e Argon2id para o Mapa. `scripts/refresh_unificado_snapshots.py` chama `scripts/reapply_unified_auth.py` depois de restaurar as fotografias.", "",
        "O teste sintético de ambos os bancos passou para: só-PCP, só-Mapa, par com senhas iguais, par com senhas diferentes, mesma grafia de login sem vínculo, senha incorreta, troca dos dois hashes, mínimo de seis, inativação de um lado e reaplicação após simular uma fotografia. O login e primeiro acesso também passaram no navegador para contas temporárias dos dois módulos; todas foram removidas.", "",
        "As duas rotas públicas de Usuários passam pelo serviço unificado. O fluxo PCP é encaminhado ao backend PCP original e, se o cadastro estiver vinculado, a nova senha é refletida no Mapa; o fluxo Mapa já é atendido pelo serviço e reflete a alteração no PCP. Um par sintético confirmou as duas direções pela URL pública. O backend PCP original permanece idêntico (47 arquivos). A tela de login, primeiro acesso e logout foram testados em navegador com contas removidas ao final.", "",
        "**Limite:** as telas completas de administração de usuários ainda não tiveram comparação visual e de permissões por perfil. O par exato está confirmado, mas sua senha Mapa somente será adotada no primeiro login válido. Os hashes são reaplicados após a fotografia; a rotina passou no teste sintético de restauração de hashes e flags, mas ainda não houve uma fotografia integral após esse primeiro login.", "",
    ])
    TARGET.write_text("\n".join(lines), encoding="utf-8")
    print(f"pcp_only={len(report['pcp_only'])} mapa_only={len(report['mapa_only'])} "
          f"pending_candidates={len(pending)} confirmed={len(confirmed)} collisions={len(report['same_login_different_names'])}")


if __name__ == "__main__":
    main()
