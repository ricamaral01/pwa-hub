"""
Router para Teste de Programação Automática (ADMIN-only)

Implementa lógica de programação automática baseada em:
1. Formas disponíveis por setor
2. Compatibilidade forma-poste
3. Demanda de postes
4. Algoritmo 2-FASES: Urgente → Normal
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import json

from app.models import TesteProgramacao, Forma, Setor, MapeamentoFormaPoste, NivelAcesso
from app.schemas.teste_programacao import (
    TesteProgramacaoRequest,
    TesteProgramacaoResponse,
    DemandaItem,
    PlanoItem,
    RelatorioDia,
)
from app.core.database import get_db
from app.core.security import require_roles

router = APIRouter(prefix="/api/teste-prog", tags=["teste-programacao"])

# Constantes
DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex"]


def _get_formas_setor(db: Session, setor_id: int) -> List[Forma]:
    """Retorna todas as formas de um setor."""
    formas = db.query(Forma).filter(Forma.setor_id == setor_id).all()
    return formas


def _get_compatibilidade(db: Session, forma_id: int) -> Dict[str, bool]:
    """
    Retorna mapeamento de compatibilidade: {poste: True/False}
    Extrai da tabela mapeamento_forma_poste
    """
    mapeamentos = db.query(MapeamentoFormaPoste).filter(
        MapeamentoFormaPoste.codigo_forma == forma_id
    ).all()
    
    compat = {}
    for m in mapeamentos:
        compat[m.poste_circular] = True
    return compat


def _parse_demand(demanda: List[DemandaItem]) -> Tuple[Dict[str, int], List[str]]:
    """
    Processa lista de demanda.
    Retorna: (demand_dict, priority_list)
    
    demand_dict: {poste: quantidade}
    priority_list: [postes urgentes em ordem]
    """
    demand = {}
    priority = []
    
    for item in demanda:
        poste = item.poste.upper().replace(" X ", "X").replace(" x ", "X")
        demand[poste] = item.quantidade
        if item.urgente:
            priority.append(poste)
    
    return demand, priority


def _programar_2fases(
    formas_list: List,  # List of forma objects
    compatibilidade: Dict[int, Dict[str, bool]],  # {forma_id: {poste: bool}}
    demand: Dict[str, int],
    priority_postes: List[str],
) -> Tuple[Dict, Dict[str, int]]:
    """
    Implementa algoritmo 2-FASES de alocação.
    
    FASE 1: Aloca 100% dos postes URGENTE em todos os dias
    FASE 2: Aloca postes NORMAIS dia por dia (maior quantidade primeiro)
    
    Retorna:
    - plano: {dia: {forma_id: poste_alocado}}
    - remaining: {poste: quantidade_restante}
    """
    
    remaining = demand.copy()
    plano = {}
    for dia in DIAS_SEMANA:
        plano[dia] = {}
    
    # Inicializa slots disponíveis por dia
    formas_ids = [f.id for f in formas_list]
    for dia in DIAS_SEMANA:
        for forma_id in formas_ids:
            plano[dia][forma_id] = None
    
    # FASE 1: ITENS URGENTE
    for dia in DIAS_SEMANA:
        available_formas = set(formas_ids)
        
        for poste in priority_postes:
            if remaining.get(poste, 0) <= 0:
                continue
            
            # Encontra formas compatíveis disponíveis
            possible_formas = []
            for forma_id in available_formas:
                compat_dict = compatibilidade.get(forma_id, {})
                if compat_dict.get(poste, False):
                    possible_formas.append(forma_id)
            
            possible_formas.sort()
            
            # Aloca até o número de formas possíveis
            n_alocado = min(len(possible_formas), remaining[poste])
            for i in range(n_alocado):
                forma_id = possible_formas[i]
                plano[dia][forma_id] = poste
                available_formas.discard(forma_id)
            
            remaining[poste] -= n_alocado
    
    # FASE 2: ITENS NORMAIS
    for dia in DIAS_SEMANA:
        available_formas = set(formas_ids)
        
        while available_formas:
            # Ordena por quantidade (decrescente) + nome (crescente)
            candidatos = [
                (poste, remaining[poste])
                for poste in remaining
                if remaining.get(poste, 0) > 0 and poste not in priority_postes
            ]
            candidatos.sort(key=lambda x: (-x[1], x[0]))
            
            if not candidatos:
                break
            
            alocou_algo = False
            
            for poste, qty_left in candidatos:
                if qty_left <= 0:
                    continue
                
                possible_formas = []
                for forma_id in available_formas:
                    compat_dict = compatibilidade.get(forma_id, {})
                    if compat_dict.get(poste, False):
                        possible_formas.append(forma_id)
                
                if not possible_formas:
                    continue
                
                possible_formas.sort()
                n_alocado = min(len(possible_formas), qty_left)
                
                for i in range(n_alocado):
                    forma_id = possible_formas[i]
                    plano[dia][forma_id] = poste
                    available_formas.discard(forma_id)
                
                remaining[poste] -= n_alocado
                alocou_algo = True
                
                if not available_formas:
                    break
            
            if not alocou_algo:
                break
    
    return plano, remaining


def _gerar_resumo_diario(
    plano: Dict,
    formas_list: List,
    dias: List[str],
    data_inicio_str: str,
) -> List[RelatorioDia]:
    """Gera resumo por dia a partir do plano."""
    data_inicio = datetime.strptime(data_inicio_str, "%Y-%m-%d")
    resumo = []
    
    for idx, dia in enumerate(dias):
        data = data_inicio + timedelta(days=idx)
        data_str = data.strftime("%d/%m/%Y")
        
        postes_dia = {}
        for forma_id, poste in plano[dia].items():
            if poste:
                postes_dia[poste] = postes_dia.get(poste, 0) + 1
        
        resumo.append(RelatorioDia(
            dia=dia,
            data=data_str,
            postes=postes_dia,
            total=len([p for p in plano[dia].values() if p])
        ))
    
    return resumo


def _calcular_nao_alocados(
    demanda_original: Dict[str, int],
    remaining: Dict[str, int],
):
    """Calcula itens não alocados."""
    nao_alocados = []
    for poste, qty_orig in demanda_original.items():
        qty_rest = remaining.get(poste, 0)
        if qty_rest > 0:
            nao_alocados.append({
                "poste": poste,
                "demandado": qty_orig,
                "nao_alocado": qty_rest,
                "alocado": qty_orig - qty_rest,
            })
    nao_alocados.sort(key=lambda x: (-x["nao_alocado"], x["poste"]))
    return nao_alocados


def _gerar_memo_calculo(
    data_inicio: str,
    num_formas: int,
    demand_original: Dict[str, int],
    priority_postes: List[str],
    plano_resultado: Dict,
    remaining: Dict[str, int],
    nao_alocados: List,
) -> str:
    """Gera memória de cálculo em formato texto."""
    
    demanda_total = sum(demand_original.values())
    alocado_total = sum(1 for dia_plano in plano_resultado.values() for p in dia_plano.values() if p)
    cap_semanal = num_formas * 5
    
    memo = f"""PROGRAMAÇÃO AUTOMÁTICA - MEMÓRIA DE CÁLCULO
Gerada em: {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}

═══════════════════════════════════════════════════════════════════

1) ENTRADA

Data de Início (segunda-feira): {data_inicio}
Semana: SEG–FRI (5 dias úteis)
Nº de Formas (Capacidade Diária): {num_formas} postes/dia
Capacidade Semanal: {num_formas} × 5 = {cap_semanal} postes/semana

Demanda Total: {demanda_total} postes

Itens URGENTE marcados: {len(priority_postes)}
{chr(10).join(f'  - {p}' for p in priority_postes[:5]) if priority_postes else '  (nenhum)'}
{f'  ... e mais {len(priority_postes) - 5}' if len(priority_postes) > 5 else ''}

═══════════════════════════════════════════════════════════════════

2) ALGORÍTMO (2 FASES)

FASE 1 - ITENS URGENTE:
  ✓ Para cada dia da semana
  ✓ Aloca 100% dos postes urgentes PRIMEIRO
  ✓ Usa 1 forma por poste (máx)
  ✓ Ordena por prioridade (ordem de entrada)

FASE 2 - ITENS NORMAIS:
  ✓ Preenche espaços ociosos (formas ainda disponíveis)
  ✓ Dia por dia, respeitando compatibilidade
  ✓ Ordena por: quantidade (maior → menor) + nome (A→Z)
  ✓ Aloca máximo possível com formas compatíveis

═══════════════════════════════════════════════════════════════════

3) RESULTADO

Alocado Total: {alocado_total} postes
Taxa de Utilização: {(alocado_total / cap_semanal * 100):.1f}% do total de slots
Taxa de Atendimento: {(alocado_total / demanda_total * 100):.1f}% da demanda
Diferença: {demanda_total - alocado_total} postes {'NÃO ALOCADOS ⚠️' if demanda_total - alocado_total > 0 else 'ALOCADOS ✓'}

═══════════════════════════════════════════════════════════════════

4) ITENS NÃO ALOCADOS

{chr(10).join(f'  • {x["poste"]}: demandado {x["demandado"]}, NÃO ALOCADO {x["nao_alocado"]}' for x in nao_alocados[:10]) if nao_alocados else '  ✓ Nenhum item não alocado'}
{f'  ... e mais {len(nao_alocados) - 10}' if len(nao_alocados) > 10 else ''}

═══════════════════════════════════════════════════════════════════
"""
    
    return memo


@router.post("/programar", response_model=TesteProgramacaoResponse, status_code=200)
def programar_automaticamente(
    payload: TesteProgramacaoRequest,
    db: Session = Depends(get_db),
    _=Depends(require_roles(NivelAcesso.ADMIN)),
):
    """
    Executa programação automática baseada em demanda.
    
    - Endpoint ADMIN-only
    - Lê formas do setor
    - Calcula compatibilidades
    - Executa algoritmo 2-FASES
    - Retorna plano semanal + relatório
    """
    
    # Validações iniciais
    setor = db.query(Setor).filter(Setor.id == payload.setor_id).first()
    if not setor:
        raise HTTPException(status_code=404, detail="Setor não encontrado")
    
    # Obtém formas do setor
    formas = _get_formas_setor(db, payload.setor_id)
    if not formas:
        raise HTTPException(
            status_code=400,
            detail=f"Setor {setor.nome} não possui formas cadastradas"
        )
    
    num_formas = len(formas)
    cap_semanal = num_formas * 5
    
    # Parse demanda
    demand_dict, priority_list = _parse_demand(payload.demanda)
    demanda_total = sum(demand_dict.values())
    
    if demanda_total == 0:
        raise HTTPException(status_code=400, detail="Demanda total = 0")
    
    # Obtém compatibilidades
    compatibilidade = {}
    for forma in formas:
        compatibilidade[forma.id] = _get_compatibilidade(db, forma.id)
    
    # Executa programação
    plano_resultado, remaining = _programar_2fases(
        formas,
        compatibilidade,
        demand_dict,
        priority_list,
    )
    
    # Calcula métricas
    alocado_total = sum(1 for dia_plano in plano_resultado.values() for p in dia_plano.values() if p)
    
    # Gera relatório
    resumo_diario = _gerar_resumo_diario(plano_resultado, formas, DIAS_SEMANA, payload.data_inicio)
    nao_alocados = _calcular_nao_alocados(demand_dict, remaining)
    
    taxa_utilizacao = round(alocado_total / cap_semanal * 100, 1) if cap_semanal > 0 else 0
    taxa_atendimento = round(alocado_total / demanda_total * 100, 1) if demanda_total > 0 else 0
    
    memo = _gerar_memo_calculo(
        payload.data_inicio,
        num_formas,
        demand_dict,
        priority_list,
        plano_resultado,
        remaining,
        nao_alocados,
    )
    
    # Converte plano para formato compatível com resposta
    plano_resposta = {
        dia: {str(forma_id): poste for forma_id, poste in formas_dict.items()}
        for dia, formas_dict in plano_resultado.items()
    }
    
    # Salva no banco de dados
    teste = TesteProgramacao(
        data_inicio=payload.data_inicio,
        num_formas=num_formas,
        capacidade_semanal=cap_semanal,
        demanda_total=demanda_total,
        alocado_total=alocado_total,
        memo_calculo=memo,
        relatorio=json.dumps({
            "resumo_diario": [
                {
                    "dia": r.dia,
                    "data": r.data,
                    "postes": r.postes,
                    "total": r.total,
                }
                for r in resumo_diario
            ],
            "nao_alocados": nao_alocados,
        }),
    )
    db.add(teste)
    db.commit()
    db.refresh(teste)
    
    return TesteProgramacaoResponse(
        id=teste.id,
        data_inicio=payload.data_inicio,
        num_formas=num_formas,
        capacidade_semanal=cap_semanal,
        demanda_total=demanda_total,
        alocado_total=alocado_total,
        plano_semanal=plano_resposta,
        resumo_diario=resumo_diario,
        nao_alocados=nao_alocados,
        taxa_utilizacao=taxa_utilizacao,
        taxa_atendimento=taxa_atendimento,
        memo_calculo=memo,
    )


@router.get("/historico/{id}")
def obter_teste_programacao(
    id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles(NivelAcesso.ADMIN)),
):
    """Retorna um teste de programação salvo anteriormente."""
    teste = db.query(TesteProgramacao).filter(TesteProgramacao.id == id).first()
    if not teste:
        raise HTTPException(status_code=404, detail="Teste não encontrado")
    
    return {
        "id": teste.id,
        "data_criacao": teste.data_criacao.isoformat(),
        "data_inicio": teste.data_inicio,
        "num_formas": teste.num_formas,
        "capacidade_semanal": teste.capacidade_semanal,
        "demanda_total": teste.demanda_total,
        "alocado_total": teste.alocado_total,
        "memo_calculo": teste.memo_calculo,
        "relatorio": json.loads(teste.relatorio) if teste.relatorio else None,
    }


@router.get("/historico")
def listar_teste_programacoes(
    limit: int = 20,
    db: Session = Depends(get_db),
    _=Depends(require_roles(NivelAcesso.ADMIN)),
):
    """Lista últimos testes de programação."""
    testes = db.query(TesteProgramacao).order_by(
        TesteProgramacao.data_criacao.desc()
    ).limit(limit).all()
    
    return [
        {
            "id": t.id,
            "data_criacao": t.data_criacao.isoformat(),
            "data_inicio": t.data_inicio,
            "num_formas": t.num_formas,
            "demanda_total": t.demanda_total,
            "alocado_total": t.alocado_total,
            "taxa_atendimento": round(t.alocado_total / t.demanda_total * 100, 1) if t.demanda_total > 0 else 0,
        }
        for t in testes
    ]
