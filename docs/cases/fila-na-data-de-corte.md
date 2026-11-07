# Estado da fila em um instante

**Status:** Previsto para 01/01/2027  
**Tipo:** Estudo demonstrativo com dados 100% sintéticos; não representa métricas ou projetos corporativos reais.

## 1. Problema / pergunta

Como reconstruir o estado dos chamados na hora de fechamento quando há histórico de eventos?

## 2. Arquitetura e fluxo

Eventos fictícios em CTE → sql/novos/fila-na-data-de-corte.sql → novos_cases.py → painel após liberação.

## 3. Metodologia

Selecionar o último evento por chamado até o corte, com critério de desempate para eventos na mesma hora.

## 4. Código e reprodução

Consulta: [`sql/novos/fila-na-data-de-corte.sql`](../../sql/novos/fila-na-data-de-corte.sql). Para executar os exemplos, use `python3 novos_cases.py` (estudos da série) e `python3 build_data.py` na raiz do repositório; o painel pode ser servido localmente com `python3 -m http.server 8000 --directory site`.

## 5. Testes e verificações

novos_cases.validate_cases valida quatro chamados e dois em fila no recorte fictício.

## 6. Resultados sintéticos e limitações

O estado no corte não deve ser confundido com a situação atual de um chamado reaberto ou concluído depois. Os cenários são simplificados; não permitem inferir eficácia, escala ou ganhos em ambiente de produção.

## 7. Decisões possíveis

Produzir snapshots reproduzíveis para comparações operacionais.

## Evidências públicas

- [Código e validação](https://github.com/russoaugusto/portfolio-dados-operacionais/blob/main/sql/novos/fila-na-data-de-corte.sql)
- [Painel interativo](https://russoaugusto.github.io/portfolio-dados-operacionais/#novos-cases)
- **Atenção:** a seção da série no painel exibirá este estudo somente a partir da data de liberação indicada.
