# Granularidade e contagem após JOIN

**Status:** Publicado  
**Tipo:** Estudo demonstrativo com dados 100% sintéticos; não representa métricas ou projetos corporativos reais.

## 1. Problema / pergunta

Por que uma junção com históricos pode inflar indicadores que deveriam contar entidades únicas?

## 2. Arquitetura e fluxo

Fixtures sintéticas com work_order e order_event → agregação SQL → build_data.py → painel.

## 3. Metodologia

Agrupar eventos por ordem ANTES do LEFT JOIN. Comparar linhas do relacionamento com a quantidade de ordens para preservar a unidade do indicador.

## 4. Código e reprodução

Consulta: [`sql/granularidade.sql`](../../sql/granularidade.sql). Para executar os exemplos, use `python3 novos_cases.py` (estudos da série) e `python3 build_data.py` na raiz do repositório; o painel pode ser servido localmente com `python3 -m http.server 8000 --directory site`.

## 5. Testes e verificações

test_portfolio.py valida cardinalidade das quatro ordens e multiplicidade total do exemplo.

## 6. Resultados sintéticos e limitações

Quatro ordens fictícias podem gerar mais de quatro linhas na junção direta em função dos eventos. Os cenários são simplificados; não permitem inferir eficácia, escala ou ganhos em ambiente de produção.

## 7. Decisões possíveis

Definir o grão do indicador e validar chaves antes de publicar números no BI.

## Evidências públicas

- [Código e validação](https://github.com/russoaugusto/portfolio-dados-operacionais/blob/main/sql/granularidade.sql)
- [Painel interativo](https://russoaugusto.github.io/portfolio-dados-operacionais/#sql)
