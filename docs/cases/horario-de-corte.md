# Comparação com horário de corte equivalente

**Status:** Publicado  
**Tipo:** Estudo demonstrativo com dados 100% sintéticos; não representa métricas ou projetos corporativos reais.

## 1. Problema / pergunta

Uma queda parcial do volume é real ou decorre da comparação de janelas incomparáveis?

## 2. Arquitetura e fluxo

Fixtures sintéticas com timestamps → sql/horario-de-corte.sql → build_data.py → painel.

## 3. Metodologia

Agrupar por dia e contabilizar eventos anteriores ou iguais a 12h, mantendo a contagem do dia completo como contexto retrospectivo.

## 4. Código e reprodução

Consulta: [`sql/horario-de-corte.sql`](../../sql/horario-de-corte.sql). Para executar os exemplos, use `python3 novos_cases.py` (estudos da série) e `python3 build_data.py` na raiz do repositório; o painel pode ser servido localmente com `python3 -m http.server 8000 --directory site`.

## 5. Testes e verificações

test_portfolio.py valida que contagens parciais não superam totais e que os dias comparados são distintos.

## 6. Resultados sintéticos e limitações

Duas segundas-feiras fictícias exibem contagens até 12h e totais diários, permitindo comparar bases equivalentes. Os cenários são simplificados; não permitem inferir eficácia, escala ou ganhos em ambiente de produção.

## 7. Decisões possíveis

Exibir horário de corte e última atualização antes de interpretar variações.

## Evidências públicas

- [Código e validação](https://github.com/russoaugusto/portfolio-dados-operacionais/blob/main/sql/horario-de-corte.sql)
- [Painel interativo](https://russoaugusto.github.io/portfolio-dados-operacionais/#bi)
