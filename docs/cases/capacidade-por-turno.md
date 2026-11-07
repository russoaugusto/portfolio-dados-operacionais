# Capacidade por turno

**Status:** Previsto para 01/03/2027  
**Tipo:** Estudo demonstrativo com dados 100% sintéticos; não representa métricas ou projetos corporativos reais.

## 1. Problema / pergunta

O saldo do dia pode esconder déficit relevante em uma faixa horária?

## 2. Arquitetura e fluxo

Cargas e disponibilidade por período fictícias → sql/novos/capacidade-por-turno.sql → novos_cases.py → painel após liberação.

## 3. Metodologia

Calcular carga e minutos produtivos por faixa, em vez de analisar apenas o somatório diário.

## 4. Código e reprodução

Consulta: [`sql/novos/capacidade-por-turno.sql`](../../sql/novos/capacidade-por-turno.sql). Para executar os exemplos, use `python3 novos_cases.py` (estudos da série) e `python3 build_data.py` na raiz do repositório; o painel pode ser servido localmente com `python3 -m http.server 8000 --directory site`.

## 5. Testes e verificações

novos_cases.validate_cases confere saldos dos quatro períodos.

## 6. Resultados sintéticos e limitações

Há déficit de 72 minutos em uma faixa do exemplo, apesar de saldo diário não negativo. Os cenários são simplificados; não permitem inferir eficácia, escala ou ganhos em ambiente de produção.

## 7. Decisões possíveis

Comparar alocação por horário e analisar redistribuições de escala.

## Evidências públicas

- [Código e validação](https://github.com/russoaugusto/portfolio-dados-operacionais/blob/main/sql/novos/capacidade-por-turno.sql)
- [Painel interativo](https://russoaugusto.github.io/portfolio-dados-operacionais/#novos-cases)
- **Atenção:** a seção da série no painel exibirá este estudo somente a partir da data de liberação indicada.
