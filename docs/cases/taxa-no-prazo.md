# Taxa agregada e composição da demanda

**Status:** Previsto para 01/02/2027  
**Tipo:** Estudo demonstrativo com dados 100% sintéticos; não representa métricas ou projetos corporativos reais.

## 1. Problema / pergunta

Por que uma taxa total pode cair mesmo quando todos os segmentos melhoram?

## 2. Arquitetura e fluxo

Dados fictícios categorizados em SQL → sql/novos/taxa-no-prazo.sql → novos_cases.py → painel após liberação.

## 3. Metodologia

Calcular taxas e volume por grupo, separando evolução por segmento do efeito da mudança na composição.

## 4. Código e reprodução

Consulta: [`sql/novos/taxa-no-prazo.sql`](../../sql/novos/taxa-no-prazo.sql). Para executar os exemplos, use `python3 novos_cases.py` (estudos da série) e `python3 build_data.py` na raiz do repositório; o painel pode ser servido localmente com `python3 -m http.server 8000 --directory site`.

## 5. Testes e verificações

novos_cases.validate_cases verifica totais exemplificativos de 87% e 71%.

## 6. Resultados sintéticos e limitações

No exemplo sintético, a taxa geral cai enquanto taxas dos grupos melhoram; ilustra efeito de composição. Os cenários são simplificados; não permitem inferir eficácia, escala ou ganhos em ambiente de produção.

## 7. Decisões possíveis

Avaliar mix de demanda antes de atribuir uma mudança a desempenho da equipe.

## Evidências públicas

- [Código e validação](https://github.com/russoaugusto/portfolio-dados-operacionais/blob/main/sql/novos/taxa-no-prazo.sql)
- [Painel interativo](https://russoaugusto.github.io/portfolio-dados-operacionais/#novos-cases)
- **Atenção:** a seção da série no painel exibirá este estudo somente a partir da data de liberação indicada.
