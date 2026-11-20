# Deduplicação determinística de eventos de ingestão

**Status:** programado para 2027-04-01; **não disponível no painel antes dessa data**  
**Tipo:** estudo demonstrativo, exclusivamente com dados fictícios.

## 1. Problema / pergunta

Como escolher um único registro por evento quando reprocessamentos geram duplicatas e duas versões chegam no mesmo instante?

## 2. Arquitetura e fluxo

Sete linhas fictícias em CTE SQLite → janela `ROW_NUMBER` e contagem por chave → [SQL](../../sql/novos/deduplicacao-eventos.sql) → [novos_cases.py](../../novos_cases.py) → `build_data.py` → `site/data.json` → painel **somente após a data programada**.

## 3. Metodologia

O grão de saída é uma linha por `evento`. A versão canônica é a maior `ingestao`; em empate, prevalece o maior `carga_id`, suposto único. `COUNT(*) OVER (PARTITION BY evento)` mede versões e `ROW_NUMBER()` escolhe a linha; `versoes - 1` contabiliza descartes. Os timestamps fictícios usam o mesmo fuso implícito, em formato ISO ordenável. Não se presume que o registro mais recente seja sempre o correto em sistemas reais.

## 4. Código e reprodução

[Consulta SQLite autocontida](../../sql/novos/deduplicacao-eventos.sql) · [Registro e validação](../../novos_cases.py) · [Testes](../../test_portfolio.py).

Na raiz do projeto, execute `python3 novos_cases.py`, `python3 -m unittest discover -v` e `python3 build_data.py`. A consulta também pode ser executada diretamente com `sqlite3 :memory: < sql/novos/deduplicacao-eventos.sql`.

## 5. Testes e verificações

Os testes objetivos verificam quatro chaves distintas, sete versões de origem, três descartes, escolha do valor 25 para E02 no empate de timestamp, ausência de chaves repetidas e corte de publicação em 31/03/2027 versus 01/04/2027. O workflow do PR executa também compilação Python, scanner de segredos e verificações de frontend. A execução do CI deve ser consultada no PR; este documento não afirma aprovação antecipada.

## 6. Resultados sintéticos e limitações

No conjunto **fictício** de sete registros, quatro versões canônicas permanecem e três duplicatas são descartadas; E02 mantém valor 25 por `carga_id=4`. É apenas demonstração de regra de resolução: não testa escalabilidade, concorrência, idempotência entre lotes, fuso horário real, origem de eventos ou correção semântica do valor.

## 7. Decisões possíveis

Definir chave de negócio, política de precedência, trilha de auditoria das versões rejeitadas e alertas de duplicidade antes de alimentar indicadores. Em produção, confirmar com a área responsável se a versão mais recente pode substituir a anterior e como lidar com correções retroativas.

## Evidências públicas

- [SQL e fixture sintética](https://github.com/russoaugusto/portfolio-dados-operacionais/blob/main/sql/novos/deduplicacao-eventos.sql) — link na branch principal somente após merge
- [Testes e validação](https://github.com/russoaugusto/portfolio-dados-operacionais/blob/main/test_portfolio.py)
- [Painel](https://russoaugusto.github.io/portfolio-dados-operacionais/#novos-cases) — **programado para 01/04/2027; não disponível antecipadamente**
