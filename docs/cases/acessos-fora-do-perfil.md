# Matriz de permissões e menor privilégio

**Status:** Previsto para 01/12/2026  
**Tipo:** Estudo demonstrativo com dados 100% sintéticos; não representa métricas ou projetos corporativos reais.

## 1. Problema / pergunta

Quais concessões não estão previstas na matriz de acesso de uma equipe fictícia?

## 2. Arquitetura e fluxo

CTEs SQLite com matriz e concessões fictícias → sql/novos/acessos-fora-do-perfil.sql → novos_cases.py → site/data.json após liberação.

## 3. Metodologia

Cruzar permissões concedidas e esperadas por perfil com LEFT JOIN e sinalizar apenas ausências na matriz.

## 4. Código e reprodução

Consulta: [`sql/novos/acessos-fora-do-perfil.sql`](../../sql/novos/acessos-fora-do-perfil.sql). Para executar os exemplos, use `python3 novos_cases.py` (estudos da série) e `python3 build_data.py` na raiz do repositório; o painel pode ser servido localmente com `python3 -m http.server 8000 --directory site`.

## 5. Testes e verificações

novos_cases.validate_cases verifica seis concessões e dois itens fictícios para revisão.

## 6. Resultados sintéticos e limitações

Duas das seis concessões fictícias recebem status Revisar. Isso não é evidência de incidente real. Os cenários são simplificados; não permitem inferir eficácia, escala ou ganhos em ambiente de produção.

## 7. Decisões possíveis

Encaminhar itens divergentes ao responsável pela concessão antes de qualquer alteração.

## Evidências públicas

- [Código e validação](https://github.com/russoaugusto/portfolio-dados-operacionais/blob/main/sql/novos/acessos-fora-do-perfil.sql)
- [Painel interativo](https://russoaugusto.github.io/portfolio-dados-operacionais/#novos-cases)
- **Atenção:** a seção da série no painel exibirá este estudo somente a partir da data de liberação indicada.
