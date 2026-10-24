# Certificado de Qualidade → módulo do Laboratório no Unificado (v2)

**Estado:** aprovado para execução (24/10/2026). Substitui a v1.
**Escopo:** **somente o Certificado de Qualidade.** Fica fora tudo o que não é emitir o certificado:
trilha `db/` antiga (QR de CP, `sync_sheets.py`, `import_cp.py`), dashboards, cadastro completo de
equipamentos, página pública de verificação por QR (vira melhoria futura).

## 1. Regra central

> **A resistência vem da data de produção do poste.** Para cada data de produção informada, o sistema
> busca no Controle Estatístico os corpos de prova moldados **nessa mesma data** e usa esse resultado.

- Chave da busca: `data_producao` do poste = data de moldagem do CP no Controle Estatístico.
- Postes com a mesma data de produção compartilham o mesmo resultado (uma linha por data).
- Se houver vários CPs na data: mostrar nº de CPs, **média** por idade (3, 7 e 28 dias) e **mínimo** aos 28 dias.
- Se houver **mais de um traço/concretagem na mesma data**: usar o de **maior média aos 28 dias** e
  registrar qual foi usado.
- Conformidade: **média 28 dias > fck**.
- Sem CP na data: "Sem resultado para esta data" e emissão bloqueada.
- O lote impresso continua derivado da data (`LAAAAMMDD`), só como identificação.

## 2. Fluxo revisado

```
1. CLIENTE
   cliente · nota fiscal · endereço · data de emissão
        │
2. POSTES  (o usuário informa primeiro)
   modelo (cadastro → altura, carga, peso) · quantidade · DATA DE PRODUÇÃO
   lote gerado automaticamente a partir da data
        │
3. RESULTADO DOS CORPOS DE PROVA  (automático)
   para cada data de produção distinta →
   Controle Estatístico (VPS antiga, somente leitura): CPs moldados nessa data
   → nº de CPs · média 3d / 7d / 28d · mínimo 28d
        │
4. SITUAÇÃO POR DATA
   ✓ Conforme              28d atende o fck
   ⏳ Aguardando 28 dias    ainda não rompeu (mostra a data prevista)
   ✗ Não conforme          28d abaixo do fck → emissão bloqueada
   ∅ Sem resultado         nenhum CP na data → emissão bloqueada
        │
5. DECISÃO
   todas as datas conformes ──► EMITIR
   alguma pendente ───────────► SALVAR RASCUNHO e voltar depois
        │
6. EMISSÃO
   número CQ-AAAA-NNNN · grava cópia fixa dos resultados usados
   · trava edição · gera PDF A4 no servidor
        │
7. HISTÓRICO
   buscar · reabrir · baixar PDF · corrigir = nova revisão (a anterior fica "Substituída")
```

Reabrir um rascunho refaz a busca do passo 3 (pega rompimentos que saíram depois). Um certificado
**emitido** nunca refaz a busca: mostra a cópia gravada na emissão.

## 3. Telas (mockups já aprovados para revisão)

| Tela | Situação |
|---|---|
| 01 Emitir | Mantida. A coluna da tabela de resistências passa a destacar **Data de produção** como chave |
| 02 Histórico | Mantida |
| 03 PDF A4 | Mantido. Tabela 2 identificada por data de produção (lote ao lado) |
| 03b PDF A4 com poucas datas | Rodapé ampliado (até 5 datas) |
| 04 Verificação QR | **Fora do escopo desta entrega** (melhoria futura) |

## 4. O que muda em relação ao sistema atual

| Hoje | Novo |
|---|---|
| Planilhas 2025/2026 por coluna fixa (AC/AO/AY, AB/AN/AZ) | Controle Estatístico, somente leitura |
| Pega a **primeira linha** que casa a data | Todos os CPs da data: média e mínimo |
| Salva só a resistência da 1ª data | Grava o resultado de **todas** as datas do certificado |
| Número por horário `CQ-AAAAMMDD-HHMMSS` | Sequencial `CQ-AAAA-NNNN` |
| fck, resp. técnico e texto da prensa no código | Parâmetros editáveis no módulo |
| Sobrescreve ao salvar | Emitido travado; correção = revisão |
| `window.print()` / html2pdf sem botão | PDF A4 gerado no servidor |

## 5. Dados (Unificado)

- `cq_certificados`: numero, revisao, status (rascunho / emitido / substituido), cliente, endereco,
  nota_fiscal, data_emissao, resp_laboratorio, resp_tecnico, observacoes, fck_mpa, pdf_path, pdf_hash,
  emitido_por, emitido_em, criado_por, criado_em.
- `cq_itens`: certificado_id, modelo, altura_m, carga_dan, peso_kg, quantidade, data_producao, lote.
- `cq_resultados_data`: certificado_id, data_producao, traco, n_cps, r3_media, r7_media, r28_media,
  r28_min, resultado — **cópia gravada na emissão**.
- `cq_parametros`: fck padrão, responsável técnico (nome + CREA + **imagem da assinatura**), texto de observação.
- `cq_prensas` (prensa de ensaio/aferição): fabricante, modelo, nº de série, patrimônio, capacidade (kN),
  classe, nº do certificado de calibração, laboratório calibrador (RBC), data da calibração, validade,
  arquivo do certificado de calibração (PDF), ativa. O certificado escolhe a prensa e **grava uma cópia
  desses dados na emissão**; prensa com validade vencida bloqueia a emissão.
- Assinatura: imagem PNG com fundo transparente, guardada fora da pasta pública, só o ADMIN troca;
  aplicada no PDF somente quando o certificado é emitido (rascunho e pré-visualização saem sem assinatura).
- `cq_modelos_poste`: modelo, altura, carga, peso.

## 6. Leitura do Controle Estatístico

- Uma consulta: `CPs moldados em <data>` → traço, idade, resistência de cada CP, data de rompimento.
- Acesso **somente leitura** (view ou endpoint) da VPS nova para a antiga; credencial em variável de ambiente.
- Controle Estatístico fora do ar → aviso na tela e emissão bloqueada.

## 7. Etapas

1. **Análise (só leitura):** como o Controle Estatístico guarda a data de moldagem, o traço e cada CP; propor a consulta por data.
2. **Protótipo** das telas 01–03 e do PDF no `:18446`; você imprime o PDF em papel.
3. **Banco e API** (migração só de adição, com reversão) e importação do histórico do Sheets.
4. **Integração real** e emissão; homologação comparando 10 certificados antigos com os novos.
5. **Produção** com o procedimento de deploy já ensaiado.

## 8. Decisões do Ricardo (24/10/2026)

1. **Conformidade:** conforme quando a **média dos CPs aos 28 dias > fck** (35 MPa). Sem critério de mínimo.
2. **Mais de um traço na mesma data:** usar o **maior** resultado aos 28 dias. O sistema escolhe
   sozinho e registra qual traço foi usado.
3. **Numeração:** permanece (ver nota abaixo).
4. **Permissões:** **emitir** = todos os perfis com acesso ao módulo. **Corrigir (revisão)** = somente
   Ricardo, Alex, Philippe e Marcelo.
5. **Assinaturas no PDF:** nome impresso + imagem da assinatura.
   - **Engenheiro responsável (fixo):** Eng. Marcelo Eduardo Ishizaki de Sousa · CREA 5063392251, com a
     imagem de assinatura cadastrada.
   - **Responsável pelo laboratório:** escolha entre **Ricardo Do Amaral** e **Philippe Augusto**
     (imagem de assinatura de cada um quando cadastrada; sem imagem, só o nome).
6. **Até 10 datas de produção por certificado**, tudo em **uma folha A4**:
   - tabela de produtos e tabela de resistência com uma linha por data, fonte 12 px e linhas compactas;
   - sem a seção "Parecer"; normas e prensa num único quadro compacto;
   - QR e texto de emissão eletrônica reduzidos a uma faixa no rodapé;
   - a folha comporta 10 datas e ainda sobra espaço para alguns modelos a mais na tabela de produtos;
     acima do limite, o sistema avisa antes de emitir (não quebra em duas páginas).

Numeração (decisão para execução): novos certificados em `CQ-AAAA-NNNN`, sequencial por ano gerado
pelo servidor; certificados antigos importados do Sheets **mantêm o número original**.

7. **Rodapé adaptável:** até 5 datas de produção → QR maior, título "Documento emitido eletronicamente"
   e assinatura maior; de 6 a 10 datas → rodapé compacto.
8. **Coluna Modelo** larga (≈38% da tabela), aceita nomes até ~2× o tamanho de "DT 11/300".
9. **Tabelas do PDF centralizadas**; tabela de resistência **sem coluna Traço** (o traço fica gravado no
   banco e visível na tela de emissão).
10. **Assinatura do responsável pelo laboratório:** só o nome impresso até haver imagem cadastrada.
11. **Fora do escopo:** página pública de verificação por QR (o QR e o link vão no PDF; a página fica
    como melhoria futura e o link pode responder "em breve" até lá).
