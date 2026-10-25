from copy import deepcopy
from datetime import datetime, timezone

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from ..auth import pode_unidade
from ..config import get_config
from ..erros import ErroAPI
from ..modelos import Auditoria, AvaliacaoImpacto, Documento, MaterialVersao, TracoVersao, Usuario
from ..validacao import validar_generico, validar_traco
from ..calc.traco41 import calculate_trace41
from ..calc.moisture41 import correct_moisture41
from ..calc.norms41 import approval_water_cement41, preparation_available41

METHODS_41 = {"principal_abrams", "alternativo_concrefer"}


def _compare_calculation(client: dict | None, server: dict) -> None:
    if not isinstance(client, dict):
        raise ErroAPI("DIVERGENCIA_CALCULO", "Resultado do cliente obrigatório.")
    differences = {}
    def compare(path: str, expected, supplied):
        if isinstance(expected, (int, float)) and not isinstance(expected, bool):
            tolerance = 0.001 if path.endswith(("Ratio", "Fraction")) else 0.05
            if not isinstance(supplied, (int, float)) or abs(supplied - expected) > tolerance:
                differences[path] = {"cliente": supplied, "servidor": expected}
        elif isinstance(expected, list):
            if not isinstance(supplied, list) or len(supplied) != len(expected):
                differences[path] = {"cliente": supplied, "servidor": expected}
            else:
                for index, value in enumerate(expected):
                    compare(f"{path}[{index}]", value, supplied[index])
    for key, value in server.items():
        compare(key, value, client.get(key))
    if differences:
        raise ErroAPI("DIVERGENCIA_CALCULO", "Cálculo do cliente diverge do servidor.", differences)


def _validate_experimental_plan(document: dict, approving: bool) -> None:
    plan = document.get("planoExperimental")
    if not isinstance(plan, dict) or int(plan.get("misturasPrevistas") or 0) < 3:
        raise ErroAPI("BLOQUEIO_ESTADO", "Defina o plano experimental antes de liberar o traço.")
    ages = plan.get("idadesDias")
    cps = int(plan.get("cpsPorIdade") or 0)
    conditions = plan.get("condicoes")
    count = int(plan["misturasPrevistas"])
    if (not isinstance(ages, list) or not ages or any(not isinstance(age, int) or age < 1 for age in ages)
            or cps < 2 or not isinstance(conditions, list) or len(conditions) != count
            or not isinstance(plan.get("volumeBetonadaL"), (int, float)) or plan["volumeBetonadaL"] <= 0):
        raise ErroAPI("BLOQUEIO_ESTADO", "Plano experimental incompleto.")
    signatures = []
    ids = []
    for condition in conditions:
        if not isinstance(condition, dict) or not condition.get("id"):
            raise ErroAPI("BLOQUEIO_ESTADO", "Condição de mistura inválida.")
        signature = tuple(condition.get(key) for key in ("dia", "loteCimento", "variacaoAguaKg", "variacaoAditivoKg"))
        if all(value in (None, "", 0) for value in signature):
            raise ErroAPI("BLOQUEIO_ESTADO", "Defina a condição de cada mistura.")
        signatures.append(signature)
        ids.append(condition["id"])
    if len(set(ids)) != count or len(set(signatures)) != count:
        raise ErroAPI("BLOQUEIO_ESTADO", "As condições das misturas devem ser distintas.")
    fresh = plan.get("ensaiosFresco")
    is_caa = document.get("tipoConcreto") == "caa"
    required_fresh = ({"espalhamentoMm", "t500S", "iev", "manutencaoEspalhamento", "arPct", "massaEspecificaKgM3"}
                      if is_caa else {"abatimentoMm", "abatimento30MinMm", "arPct", "massaEspecificaKgM3"})
    required_classes = document.get("objetivo", {}).get("classesCAA") if is_caa else None
    if is_caa and (not isinstance(required_classes, dict) or
                   required_classes.get("SF") not in ("SF1", "SF2", "SF3") or
                   required_classes.get("VS") not in ("VS1", "VS2") or
                   required_classes.get("IEV") not in (0, 1, 2, 3)):
        raise ErroAPI("BLOQUEIO_ESTADO", "Defina as classes CAA SF, VS e IEV exigidas.")
    if not isinstance(fresh, list) or not required_fresh.issubset(fresh):
        raise ErroAPI("BLOQUEIO_ESTADO", "Ensaios de concreto fresco incompletos.")
    if not approving:
        return
    experiments = document.get("experimentais") or []
    if len(experiments) < count:
        raise ErroAPI("BLOQUEIO_ESTADO", "Faltam misturas do plano experimental.")
    minimum = float(plan.get("resistenciaMinMPa") or document["objetivo"]["fckMPa"])
    all_strengths = []
    matched = set()
    for experiment in experiments:
        condition_id = experiment.get("condicaoId")
        if condition_id not in ids or condition_id in matched:
            raise ErroAPI("BLOQUEIO_ESTADO", "Mistura sem condição única no plano.")
        matched.add(condition_id)
        if is_caa:
            spread = experiment.get("espalhamentoMm")
            limits = {"SF1": (550, 650), "SF2": (660, 750), "SF3": (760, 850)}
            low, high = limits[required_classes["SF"]]
            if not isinstance(spread, (int, float)) or not low <= spread <= high:
                raise ErroAPI("BLOQUEIO_ESTADO", "Espalhamento fora da classe CAA exigida.")
            t500 = experiment.get("t500S")
            if not isinstance(t500, (int, float)) or t500 < 0 or ((t500 <= 2) != (required_classes["VS"] == "VS1")):
                raise ErroAPI("BLOQUEIO_ESTADO", "T500 fora da classe CAA exigida.")
            if experiment.get("iev") != required_classes["IEV"]:
                raise ErroAPI("BLOQUEIO_ESTADO", "Estabilidade visual fora da classe CAA exigida.")
            maintenance = experiment.get("manutencaoEspalhamento")
            times = plan.get("temposManutencaoMin") or [10, 20, 30]
            if not isinstance(maintenance, list) or [point.get("minuto") for point in maintenance if isinstance(point, dict)] != times:
                raise ErroAPI("BLOQUEIO_ESTADO", "Manutenção do espalhamento CAA incompleta.")
            maximum_loss = plan.get("perdaEspalhamentoMaxPct")
            for point in maintenance:
                value = point.get("espalhamentoMm")
                if not isinstance(value, (int, float)) or value <= 0 or (maximum_loss is not None and (spread - value) / spread * 100 > maximum_loss):
                    raise ErroAPI("BLOQUEIO_ESTADO", "Manutenção do espalhamento CAA fora do critério.")
            if not isinstance(experiment.get("indicadorFinosKgM3"), (int, float)):
                raise ErroAPI("BLOQUEIO_ESTADO", "Indicador de finos CAA obrigatório.")
        else:
            slump = experiment.get("abatimentoMm")
            target = document["objetivo"].get("abatimentoMm")
            tolerance = document["objetivo"].get("toleranciaMm")
            if not isinstance(slump, (int, float)) or abs(slump - target) > tolerance:
                raise ErroAPI("BLOQUEIO_ESTADO", "Abatimento fora do plano experimental.")
        for field in required_fresh - {"abatimentoMm", "espalhamentoMm", "manutencaoEspalhamento"}:
            if not isinstance(experiment.get(field), (int, float)):
                raise ErroAPI("BLOQUEIO_ESTADO", "Ensaio de concreto fresco ausente.")
        if not is_caa and experiment["abatimento30MinMm"] < float(plan.get("abatimento30MinMinMm") or 0):
            raise ErroAPI("BLOQUEIO_ESTADO", "Manutenção fora do critério.")
        if not float(plan.get("arMinPct", 0)) <= experiment["arPct"] <= float(plan.get("arMaxPct", 100)):
            raise ErroAPI("BLOQUEIO_ESTADO", "Ar fora do critério.")
        if experiment["massaEspecificaKgM3"] < float(plan.get("massaEspecificaMinKgM3") or 0):
            raise ErroAPI("BLOQUEIO_ESTADO", "Massa específica fora do critério.")
        for age in ages:
            rupture = next((r for r in experiment.get("rupturas", []) if r.get("idadeDias") == age), None)
            values = rupture.get("resultadosMPa", []) if rupture else []
            if len(values) < cps or any(not isinstance(v, (int, float)) or v < minimum for v in values[:cps]):
                raise ErroAPI("BLOQUEIO_ESTADO", "CPs ausentes ou abaixo do critério do plano.")
            all_strengths.extend(values[:cps])
    if len(matched) != count or sum(all_strengths) / len(all_strengths) < float(plan.get("resistenciaMediaMinMPa") or minimum):
        raise ErroAPI("BLOQUEIO_ESTADO", "Plano incompleto ou resistência média insuficiente.")


def agora() -> str:
    return datetime.now(timezone.utc).isoformat()


def chave_documento(tipo: str, id_: str, versao: int) -> str:
    return f"{tipo}:{id_}:v{versao}"


def atual(session: Session, tipo: str, id_: str, lock: bool = False) -> Documento | None:
    query = select(Documento).where(Documento.tipo == tipo, Documento.id == id_).order_by(Documento.versao.desc()).limit(1)
    if lock:
        query = query.with_for_update()
    return session.scalar(query)


def gravar(session: Session, tipo: str, d: dict, antigo: Documento | None = None) -> Documento:
    chave = chave_documento(tipo, str(d["id"]), int(d["versao"]))
    row = antigo if antigo is not None and antigo.chave == chave else Documento(chave=chave, tipo=tipo, id=str(d["id"]))
    row.versao = int(d["versao"])
    row.revisao = int(d["revisao"])
    row.unidade = str(d["unidade"])
    row.status = str(d.get("status") or "")
    row.nome = str(d.get("nome") or d.get("nomeProduto") or "")
    row.fck_mpa = (d.get("objetivo") or {}).get("fckMPa") if tipo == "tracos" else None
    row.metodo = str(d.get("metodo") or "") if tipo == "tracos" else None
    row.piloto = antigo.piloto if antigo is not None and antigo.chave == chave else get_config().modo_piloto
    d["piloto"] = row.piloto
    row.conteudo = d
    row.alterado_em = datetime.now(timezone.utc)
    session.add(row)
    session.flush()
    return row


def auditar(session: Session, usuario: Usuario, acao: str, tipo: str | None, d: dict | None, antes: dict | None = None) -> None:
    session.add(Auditoria(email=usuario.email, acao=acao, unidade=(d or antes or {}).get("unidade"), tipo=tipo,
                          documento_id=(d or antes or {}).get("id"), antes=antes, depois=d,
                          piloto=get_config().modo_piloto))


def listar(session: Session, tipo: str, filtros: dict, usuario: Usuario) -> list[dict]:
    query = select(Documento).where(Documento.tipo == tipo)
    if usuario.papel != "admin" and "*" not in usuario.unidades:
        query = query.where(Documento.unidade.in_(usuario.unidades))
    if filtros.get("unidade"):
        if not pode_unidade(usuario, str(filtros["unidade"])):
            raise ErroAPI("SEM_PERMISSAO", "Unidade não autorizada.")
        query = query.where(Documento.unidade == str(filtros["unidade"]))
    if filtros.get("status"):
        query = query.where(Documento.status == str(filtros["status"]))
    if filtros.get("nome"):
        query = query.where(Documento.nome.ilike("%" + str(filtros["nome"]) + "%"))
    return [row.conteudo for row in session.scalars(query.order_by(Documento.alterado_em.desc()).limit(1000))]


def obter(session: Session, tipo: str, dados: dict, usuario: Usuario) -> dict:
    if not dados.get("id"):
        raise ErroAPI("VALIDACAO", "ID obrigatório.")
    query = select(Documento).where(Documento.tipo == tipo, Documento.id == str(dados["id"]))
    if dados.get("versao"):
        query = query.where(Documento.versao == int(dados["versao"]))
    row = session.scalar(query.order_by(Documento.versao.desc()).limit(1))
    if row is None or not pode_unidade(usuario, row.unidade):
        raise ErroAPI("NAO_ENCONTRADO", "Documento não encontrado.")
    return row.conteudo


def salvar_traco(session: Session, dados: dict, usuario: Usuario) -> dict:
    d = deepcopy(dados)
    if d.get("metodo") in METHODS_41:
        try:
            calculation = calculate_trace41(d)
        except (ValueError, KeyError, TypeError, ZeroDivisionError) as exc:
            raise ErroAPI("VALIDACAO", str(exc)) from exc
        d["itens"] = calculation["items"]
        d["resultadoCalculado"] = calculation["result"]
        d["resumoCalculado"] = calculation["summary"]
        d.pop("betonadaCorrigida", None)
        if "correctedBatch" in calculation:
            d["betonadaCorrigida"] = calculation["correctedBatch"]
            d["referenciaAgregados"] = calculation["correctedBatch"]["referenceCondition"]
    validar_traco(d)
    if not pode_unidade(usuario, str(dados["unidade"])):
        raise ErroAPI("SEM_PERMISSAO", "Unidade não autorizada.")
    anterior = atual(session, "tracos", str(dados["id"]), lock=True)
    antes = deepcopy(anterior.conteudo) if anterior else None
    instante = agora()
    if anterior is None:
        codigo = session.execute(text("SELECT nextval('traco_codigo_seq')")).scalar_one()
        d.update(codigo=f"TR-{codigo:04d}", versao=1, revisao=1, status="rascunho")
        d["auditoria"] = {"criadoPor": usuario.email, "criadoEm": instante, "alteradoPor": usuario.email, "alteradoEm": instante}
    else:
        anterior_d = anterior.conteudo
        if int(dados.get("versao") or 0) != anterior.versao or int(dados.get("revisao") or 0) != anterior.revisao:
            raise ErroAPI("CONFLITO_REVISAO", "Traço alterado por outra pessoa.", {"atual": anterior_d})
        if anterior.status == "aprovado":
            d.update(codigo=anterior_d["codigo"], versao=anterior.versao + 1, revisao=1, status="rascunho",
                     baseVersaoId=f"{anterior.id}:v{anterior.versao}", aprovacao=None)
        else:
            d.update(codigo=anterior_d["codigo"], versao=anterior.versao, revisao=anterior.revisao + 1, status=anterior.status)
        d["auditoria"] = {**anterior_d.get("auditoria", {}), "alteradoPor": usuario.email, "alteradoEm": instante}
    row = gravar(session, "tracos", d, anterior)
    auditar(session, usuario, "tracos.salvarVersao", "tracos", d, antes)
    return {"id": row.id, "codigo": d["codigo"], "versao": row.versao, "revisao": row.revisao, "documento": d}


def mudar_status_traco(session: Session, dados: dict, usuario: Usuario, aprovar: bool) -> dict:
    id_ = str(dados.get("id") or "")
    versao = int(dados.get("versao") or 0)
    row = session.scalar(select(Documento).where(Documento.tipo == "tracos", Documento.id == id_, Documento.versao == versao).with_for_update())
    if row is None:
        raise ErroAPI("NAO_ENCONTRADO", "Traço não encontrado.")
    if not pode_unidade(usuario, row.unidade):
        raise ErroAPI("SEM_PERMISSAO", "Unidade não autorizada.")
    if int(dados.get("revisao") or 0) != row.revisao:
        raise ErroAPI("CONFLITO_REVISAO", "Revisão diferente.", {"atual": row.conteudo})
    if row.status != ("em_teste" if aprovar else "rascunho"):
        raise ErroAPI("VALIDACAO", "Situação do traço não permite esta ação.")
    if row.conteudo.get("metodo") not in METHODS_41:
        raise ErroAPI("BLOQUEIO_ESTADO", "Aprovação exige um dos métodos da Dosagem 4.1.")
    if aprovar and row.conteudo.get("balanco") != "complete":
        raise ErroAPI("BLOQUEIO_ESTADO", "Modo planilha não pode ser aprovado.")
    try:
        calculation = calculate_trace41(row.conteudo)
    except (ValueError, KeyError, TypeError, ZeroDivisionError) as exc:
        raise ErroAPI("VALIDACAO", str(exc)) from exc
    _compare_calculation(dados.get("resultadoCliente"), calculation["result"])
    _validate_experimental_plan(row.conteudo, aprovar)
    validar_traco({**row.conteudo, "itens": calculation["items"]})
    result = calculation["result"]
    if row.conteudo.get("balanco") == "complete" and abs(result["physicalVolumeL"] - 1000) > 1:
        raise ErroAPI("BLOQUEIO_ESTADO", "Volume fora de 1000 ± 1 L.")
    if aprovar:
        objective = row.conteudo["objetivo"]
        exposure = objective["classe"]
        cement = result["cementKg"]
        effective_water = row.conteudo["metodoDados"]["waterEffectiveKg"]
        minimum_cement = {"I": 260, "II": 280, "III": 320, "IV": 360}[exposure]
        minimum_fck = {"I": 20, "II": 25, "III": 30, "IV": 40}[exposure]
        condition = (row.conteudo.get("planoExperimental") or {}).get("condicaoPreparo", "A")
        if not approval_water_cement41(effective_water / cement, exposure) or cement < minimum_cement or objective["fckMPa"] < minimum_fck:
            raise ErroAPI("BLOQUEIO_ESTADO", "Traço não atende aos limites de agressividade.")
        if not preparation_available41(objective["fckMPa"], condition):
            raise ErroAPI("BLOQUEIO_ESTADO", "Condição de preparo indisponível para a classe.")
    antes = deepcopy(row.conteudo)
    d = deepcopy(antes)
    d["status"] = "aprovado" if aprovar else "em_teste"
    d["itens"] = calculation["items"]
    d["resultadoCalculado"] = calculation["result"]
    d["resumoCalculado"] = calculation["summary"]
    d["revisao"] = row.revisao + 1
    if aprovar:
        d["aprovacao"] = {"por": usuario.email, "em": agora(), "parecer": str(dados.get("parecer") or "")}
        snapshot_items = []
        for item in d["itens"]:
            material_id = item.get("materialId")
            material_version = session.scalar(select(MaterialVersao).where(MaterialVersao.material_id == material_id).order_by(MaterialVersao.versao.desc()).limit(1)) if material_id else None
            snapshot_items.append({**item, "materialVersao": material_version.versao if material_version else None})
        session.add(TracoVersao(chave=chave_documento("tracos", row.id, row.versao), traco_id=row.id,
                                versao=row.versao, unidade=row.unidade, estado="aprovado",
                                documento=d, snapshot={"itens": snapshot_items}, resultado=calculation["result"],
                                piloto=get_config().modo_piloto))
    gravar(session, "tracos", d, row)
    auditar(session, usuario, "tracos.aprovar" if aprovar else "tracos.enviarAprovacao", "tracos", d, antes)
    return {"id": row.id, "versao": row.versao, "revisao": row.revisao, "documento": d}


def salvar_generico(session: Session, tipo: str, dados: dict, usuario: Usuario) -> dict:
    validar_generico(tipo, dados)
    if not pode_unidade(usuario, str(dados["unidade"])):
        raise ErroAPI("SEM_PERMISSAO", "Unidade não autorizada.")
    row = atual(session, tipo, str(dados["id"]), lock=True)
    if row and int(dados.get("revisao") or 0) != row.revisao:
        raise ErroAPI("CONFLITO_REVISAO", "Cadastro alterado por outra pessoa.", {"atual": row.conteudo})
    d = deepcopy(dados)
    d["versao"] = row.versao if row else 1
    d["revisao"] = row.revisao + 1 if row else 1
    if tipo in ("materiais", "fornecedores") and d.get("status") == "excluido":
        d["status"] = "inativo"
    antes = deepcopy(row.conteudo) if row else None
    gravar(session, tipo, d, row)
    if tipo == "materiais":
        previous_density = (antes or {}).get("massaEspecificaKgDm3")
        current_density = d.get("massaEspecificaKgDm3")
        if previous_density != current_density:
            session.add(MaterialVersao(material_id=str(d["id"]), versao=d["revisao"], propriedades=d,
                                      piloto=get_config().modo_piloto))
            if previous_density and current_density:
                for trace_version in session.scalars(select(TracoVersao).where(TracoVersao.estado.in_(["liberado_ensaio", "aprovado"]))):
                    matched = [item for item in trace_version.snapshot.get("itens", []) if item.get("materialId") == d["id"]]
                    if not matched:
                        continue
                    delta_volume = sum(item["massaKgM3"] / current_density - item["massaKgM3"] / item["massaEspecificaKgDm3"] for item in matched)
                    classification = "revisão necessária" if abs(delta_volume) > 2 else "sem impacto relevante"
                    session.add(AvaliacaoImpacto(traco_versao_chave=trace_version.chave, material_id=str(d["id"]),
                                                 classificacao=classification, estado="pendente",
                                                 diferencas={"volumeL": delta_volume, "densidadeAnterior": previous_density,
                                                             "densidadeNova": current_density}, piloto=get_config().modo_piloto))
    auditar(session, usuario, tipo + ".salvar", tipo, d, antes)
    return {"id": d["id"], "versao": d["versao"], "revisao": d["revisao"], "documento": d}


def salvar_producao41(session: Session, dados: dict, usuario: Usuario) -> dict:
    trace_key = str(dados.get("tracoVersaoChave") or "")
    version = session.get(TracoVersao, trace_key)
    if version is None or version.estado != "aprovado" or not pode_unidade(usuario, version.unidade):
        raise ErroAPI("BLOQUEIO_ESTADO", "Versao aprovada do traco nao encontrada.")
    if not get_config().modo_piloto and version.piloto:
        raise ErroAPI("BLOQUEIO_ESTADO", "Traco do piloto nao pode gerar producao oficial.")
    previous_batch = atual(session, "producoes", str(dados.get("id") or ""))
    if not get_config().modo_piloto and previous_batch is not None and previous_batch.piloto:
        raise ErroAPI("BLOQUEIO_ESTADO", "Betonada do piloto nao pode virar producao oficial.")
    pending = session.scalar(select(AvaliacaoImpacto).where(AvaliacaoImpacto.traco_versao_chave == trace_key,
                    AvaliacaoImpacto.estado != "liberada", AvaliacaoImpacto.classificacao == "revis\u00e3o necess\u00e1ria").limit(1))
    if pending:
        raise ErroAPI("BLOQUEIO_ESTADO", "Avaliacao de impacto nao liberada; betonada bloqueada.")
    volume = dados.get("volumeM3")
    if not isinstance(volume, (int, float)) or isinstance(volume, bool) or not 0 < volume <= 100:
        raise ErroAPI("VALIDACAO", "Volume da betonada invalido.")
    humidities = dados.get("umidades") or {}
    actual = dados.get("dosadoKg") or {}
    if not isinstance(humidities, dict) or not isinstance(actual, dict):
        raise ErroAPI("VALIDACAO", "Umidades e massas dosadas devem ser informadas por material.")
    items = version.snapshot.get("itens") or []
    tracking = dados.get("rastreabilidade")
    if tracking is not None:
        if not isinstance(tracking, dict) or any(not str(tracking.get(field) or "").strip()
                                                  for field in ("medidoEm", "responsavel", "balancaId")):
            raise ErroAPI("VALIDACAO", "Hora, responsavel e balanca da betonada sao obrigatorios.")
        try:
            measured_at = datetime.fromisoformat(tracking["medidoEm"].replace("Z", "+00:00"))
        except (TypeError, ValueError, AttributeError):
            raise ErroAPI("VALIDACAO", "Hora da medicao de umidade invalida.") from None
        if measured_at.tzinfo is None:
            raise ErroAPI("VALIDACAO", "Hora da medicao deve incluir fuso horario.")
        lots = tracking.get("lotesMateriais")
        if not isinstance(lots, dict) or any(not str(lots.get(item["id"]) or "").strip() for item in items):
            raise ErroAPI("VALIDACAO", "Lote de cada material da betonada e obrigatorio.")
        for item in items:
            if item.get("categoria") in ("areia", "brita"):
                measure = humidities.get(item["id"])
                if not isinstance(measure, dict) or measure.get("medidoEm") != tracking["medidoEm"] or measure.get("responsavel") != tracking["responsavel"]:
                    raise ErroAPI("VALIDACAO", "Medicao de umidade sem hora ou responsavel correspondente.")
    aggregates = []
    for item in items:
        if item.get("categoria") not in ("areia", "brita"):
            continue
        measurement = humidities.get(item["id"], {})
        if not isinstance(measurement, dict):
            raise ErroAPI("VALIDACAO", "Medicao de umidade invalida.")
        humidity = measurement.get("umidadePct", item.get("umidadePct", 0))
        absorption = measurement.get("absorcaoPct", item.get("absorcaoPct", 0))
        if any(not isinstance(value, (int, float)) or isinstance(value, bool) or not 0 <= value <= 100
               for value in (humidity, absorption)):
            raise ErroAPI("VALIDACAO", "Umidade ou absorcao fora da faixa.")
        aggregates.append({"referenceMassKg": item["massaKgM3"] * volume,
                           "humidityFraction": humidity / 100, "absorptionFraction": absorption / 100})
    result = version.resultado
    try:
        correction = correct_moisture41(
            aggregates, version.documento.get("referenciaAgregados", "dry"),
            version.documento["metodoDados"]["waterEffectiveKg"] * volume,
            result.get("waterFromAdmixturesKg", 0) * volume,
        )
    except (ValueError, KeyError, TypeError) as error:
        raise ErroAPI("VALIDACAO", f"Correcao da betonada invalida: {error}") from None
    planned = {}
    aggregate_index = 0
    for item in items:
        category = item["categoria"]
        if category in ("areia", "brita"):
            amount = correction["weighMassesKg"][aggregate_index]
            aggregate_index += 1
        elif category == "agua":
            amount = correction["waterToDoseKg"]
        else:
            amount = item["massaKgM3"] * volume
        planned[item["id"]] = {"nome": item["nome"], "categoria": category,
                               "massaAPesarKg": amount, "toleranciaPct": 1 if category in ("cimento", "agua") else
                               3 if category == "aditivo" else 2}
    alerts = []
    for material_id, dosed in actual.items():
        target = planned.get(material_id)
        if target is None or not isinstance(dosed, (int, float)) or isinstance(dosed, bool) or dosed < 0:
            raise ErroAPI("VALIDACAO", "Massa dosada invalida ou material desconhecido.")
        expected = target["massaAPesarKg"]
        difference = dosed - expected
        percent = 100 * difference / expected if expected else 0
        target["dosadoKg"] = dosed
        target["desvioKg"] = difference
        target["desvioPct"] = percent
        if abs(percent) > target["toleranciaPct"]:
            alerts.append({"materialId": material_id, "desvioPct": percent,
                           "toleranciaPct": target["toleranciaPct"], "estado": "pendente"})
    d = deepcopy(dados)
    d["unidade"] = version.unidade
    d["snapshotMateriais"] = version.snapshot
    d["resultadoAprovado"] = version.resultado
    d["planejado"] = planned
    d["aguaDosadaKg"] = correction["waterToDoseKg"]
    d["aguaLivreKg"] = correction["freeWaterKg"]
    d["alertas"] = alerts
    d["estadoDesforma"] = "aguardando_desforma"
    if get_config().modo_piloto:
        d["simulacao"] = True
    return salvar_generico(session, "producoes", d, usuario)


def liberar_desforma41(session: Session, dados: dict, usuario: Usuario) -> dict:
    if get_config().modo_piloto:
        raise ErroAPI("BLOQUEIO_ESTADO", "Piloto: desforma real não pode ser liberada.")
    production_id = str(dados.get("id") or "")
    production = atual(session, "producoes", production_id, lock=True)
    if production is None or not pode_unidade(usuario, production.unidade):
        raise ErroAPI("NAO_ENCONTRADO", "Lote de producao nao encontrado.")
    if production.piloto:
        raise ErroAPI("BLOQUEIO_ESTADO", "Desforma de betonada do piloto nao pode ser liberada.")
    current = production.conteudo
    if current.get("estadoDesforma") == "liberada":
        raise ErroAPI("BLOQUEIO_ESTADO", "Desforma ja liberada.")
    product_id = str(current.get("produtoId") or "")
    product = atual(session, "produtos", product_id) if product_id else None
    if product is None or product.unidade != production.unidade:
        raise ErroAPI("BLOQUEIO_ESTADO", "Produto com criterio de desforma nao encontrado.")
    minimum = product.conteudo.get("desformaMinMPa")
    target_age = product.conteudo.get("desformaIdadeAlvoH")
    if any(not isinstance(value, (int, float)) or isinstance(value, bool) or value <= 0
           for value in (minimum, target_age)):
        raise ErroAPI("BLOQUEIO_ESTADO", "Criterio de desforma do produto incompleto.")
    age = dados.get("idadeHoras")
    strengths = dados.get("cpResultadosMPa")
    if not isinstance(age, (int, float)) or age < target_age or not isinstance(strengths, list) or len(strengths) < 2:
        raise ErroAPI("BLOQUEIO_ESTADO", "CPs do proprio lote na idade-alvo sao obrigatorios.")
    if any(not isinstance(value, (int, float)) or isinstance(value, bool) or value <= 0 for value in strengths):
        raise ErroAPI("VALIDACAO", "Resistencia de CP invalida.")
    exemplar = max(strengths[:2])
    if exemplar < minimum:
        raise ErroAPI("BLOQUEIO_ESTADO", "CP do lote abaixo do criterio de desforma.")
    if not str(dados.get("ensaiadoEm") or "").strip():
        raise ErroAPI("VALIDACAO", "Data e hora do ensaio do lote obrigatorias.")
    updated = deepcopy(current)
    updated["revisao"] = production.revisao
    updated["estadoDesforma"] = "liberada"
    updated["desforma"] = {"produtoId": product_id, "idadeHoras": age, "cpResultadosMPa": strengths,
                            "exemplarMPa": exemplar, "criterioMinMPa": minimum,
                            "ensaiadoEm": dados["ensaiadoEm"], "liberadoPor": usuario.email,
                            "liberadoEm": agora()}
    return salvar_generico(session, "producoes", updated, usuario)


def listar_avaliacoes(session: Session, dados: dict, usuario: Usuario) -> list[dict]:
    trace_key = str(dados.get("tracoVersaoChave") or "")
    version = session.get(TracoVersao, trace_key)
    if version is None or not pode_unidade(usuario, version.unidade):
        raise ErroAPI("NAO_ENCONTRADO", "Versão do traço não encontrada.")
    rows = session.scalars(select(AvaliacaoImpacto).where(AvaliacaoImpacto.traco_versao_chave == trace_key)
                           .order_by(AvaliacaoImpacto.id)).all()
    return [{"id": row.id, "materialId": row.material_id, "classificacao": row.classificacao,
             "estado": row.estado, "diferencas": row.diferencas} for row in rows]


def decidir_avaliacao(session: Session, dados: dict, usuario: Usuario) -> dict:
    try:
        impact_id = int(dados.get("id") or 0)
    except (TypeError, ValueError):
        raise ErroAPI("VALIDACAO", "ID da avaliação inválido.") from None
    row = session.get(AvaliacaoImpacto, impact_id)
    if row is None:
        raise ErroAPI("NAO_ENCONTRADO", "Avaliação de impacto não encontrada.")
    version = session.get(TracoVersao, row.traco_versao_chave)
    if version is None or not pode_unidade(usuario, version.unidade):
        raise ErroAPI("SEM_PERMISSAO", "Unidade não autorizada.")
    decision = str(dados.get("decisao") or "")
    rationale = str(dados.get("justificativa") or "").strip()
    if decision not in ("liberar", "revisar") or len(rationale) < 10:
        raise ErroAPI("VALIDACAO", "Informe liberar ou revisar e justificativa de ao menos 10 caracteres.")
    if row.estado not in ("pendente", "revisao_necessaria"):
        raise ErroAPI("BLOQUEIO_ESTADO", "Avaliação já concluída.")
    before = {"estado": row.estado, "diferencas": deepcopy(row.diferencas)}
    row.estado = "liberada" if decision == "liberar" else "revisao_necessaria"
    row.diferencas = {**row.diferencas, "decisao": decision, "justificativa": rationale,
                     "decididoPor": usuario.email, "decididoEm": agora()}
    auditar(session, usuario, "avaliacoes.decidir", "avaliacoes", {"id": row.id, **row.diferencas}, before)
    return {"id": row.id, "estado": row.estado, "diferencas": row.diferencas}


def excluir_custo(session: Session, dados: dict, usuario: Usuario) -> dict:
    row = atual(session, "custos", str(dados.get("id") or ""), lock=True)
    if row is None or not pode_unidade(usuario, row.unidade):
        raise ErroAPI("NAO_ENCONTRADO", "Custo não encontrado.")
    if str(dados.get("confirmacao") or "") != str(row.conteudo.get("nomeProduto") or ""):
        raise ErroAPI("VALIDACAO", "Digite o nome do produto para confirmar.")
    antes = deepcopy(row.conteudo)
    resultado = {"id": row.id, "versao": row.versao, "revisao": row.revisao}
    session.delete(row)
    auditar(session, usuario, "custos.excluir", "custos", None, antes)
    return resultado
