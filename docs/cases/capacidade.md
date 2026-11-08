# Capacidade e evolução da fila

**Status:** Publicado  
**Tipo:** Estudo demonstrativo com dados 100% sintéticos; não representa métricas ou projetos corporativos reais.

## 1. Problema / pergunta

Como a distribuição diária da demanda altera a fila, mesmo quando a capacidade semanal parece suficiente?

## 2. Arquitetura e fluxo

SQLite em memória: sql/fixtures.sql → sql/capacidade.sql → build_data.py → site/data.json → painel GitHub Pages.

## 3. Metodologia

CTE recursiva carrega a fila de fechamento para o dia seguinte. Em cada dia, as conclusões são limitadas pela capacidade disponível, e a capacidade ociosa não é transferida entre dias.

## 4. Código e reprodução

Consulta: [`sql/capacidade.sql`](../../sql/capacidade.sql). Para executar os exemplos, use `python3 novos_cases.py` (estudos da série) e `python3 build_data.py` na raiz do repositório; o painel pode ser servido localmente com `python3 -m http.server 8000 --directory site`.

## 5. Testes e verificações

build_data.validate_capacity verifica conservação de fluxo, conclusão, fila e capacidade ociosa.

## 6. Resultados sintéticos e limitações

Os cinco dias fictícios permitem comparar demanda, capacidade e fila de fechamento; o gráfico evidencia gargalos temporais. Os cenários são simplificados; não permitem inferir eficácia, escala ou ganhos em ambiente de produção.

## 7. Decisões possíveis

Reavaliar distribuição de recursos por período, sem tratar o saldo semanal como capacidade instantaneamente transferível.

## Testar com sua planilha

A calculadora aplica a mesma lógica de saldo ao histórico diário de um `.xlsx` ou `.csv`. A fila de fechamento é a fila inicial mais entradas menos conclusões. No cenário futuro, as conclusões são limitadas pela capacidade informada e pelo volume disponível. O prazo, a demanda prevista e os dias de operação são premissas escolhidas por quem usa a ferramenta.

O arquivo é lido no navegador. Para experimentar de imediato, use o exemplo fictício integrado. [Abrir a calculadora](https://russoaugusto.github.io/portfolio-dados-operacionais/fila/)

## Evidências públicas

- [Código e validação](https://github.com/russoaugusto/portfolio-dados-operacionais/blob/main/sql/capacidade.sql)
- [Painel interativo](https://russoaugusto.github.io/portfolio-dados-operacionais/#capacidade)
