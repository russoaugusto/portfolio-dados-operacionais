# Matriz de competências com evidências

Este quadro relaciona habilidades demonstradas em repositórios públicos e **não** deve ser interpretado como validação de certificação, formação, senioridade, tempo de experiência ou impacto mensurado no emprego.

| Competência | Evidência verificável | Demonstração ou teste | Natureza |
| --- | --- | --- | --- |
| SQL e CTE recursiva | [Consulta de capacidade](../sql/capacidade.sql) | [Case](cases/capacidade.md), `validate_capacity` em `build_data.py` | Simulação |
| Granularidade e JOIN | [Consulta SQL](../sql/granularidade.sql) | [Case](cases/granularidade.md) e teste de cardinalidade | Simulação |
| BI e comparação temporal | [Consulta SQL](../sql/horario-de-corte.sql) | [Case](cases/horario-de-corte.md) e comparações por corte | Simulação |
| Segurança de acessos | [Matriz de permissões](../sql/novos/acessos-fora-do-perfil.sql) | [Case programado](cases/acessos-fora-do-perfil.md), `novos_cases.validate_cases` | Simulação (lançamento 01/12/2026) |
| Python e validação | [Gerador de dados](../build_data.py) e [testes](../test_portfolio.py) | GitHub Actions e execução local | Código reproduzível |
| Integração web | [Código do painel](../site/app.js) | [Demonstração](https://russoaugusto.github.io/portfolio-dados-operacionais/) | Projeto demonstrativo |
| DevSecOps / CI | [Workflow de validação](../.github/workflows/validar-cases.yml) | Testes, verificações estáticas e checagem de segredos | Automação deste repositório |

## Experiência profissional versus projetos

**Experiência declarada:** Especialista de Planejamento na VGX, com atuação no setor de cobrança e na carteira Claro. Esta descrição identifica área e contexto de trabalho, **sem atribuir resultados**.

**Projetos demonstrativos:** todo código, dados e indicadores deste repositório foram desenvolvidos exclusivamente para estudo e apresentação pública. Nunca reutilize dados de clientes, relatórios internos, consultas proprietárias ou segredos da operação.

## Texto de currículo sugerido (adequado a projetos pessoais)

“Desenvolvimento de portfólio público com estudos simulados de SQL, análise de capacidade, Business Intelligence, qualidade e segurança de dados, utilizando Python, SQLite, JavaScript, GitHub Actions e validação automatizada.”

Para candidaturas, descreva a experiência profissional real separadamente e inclua somente ferramentas que saiba explicar ou demonstrar.
