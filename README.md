# Portfólio de Dados Operacionais | SQL, BI e Segurança de Dados

**Augusto Russo — Especialista de Planejamento, VGX (Belo Horizonte/MG).**

Atuação profissional em planejamento de operações de cobrança, com foco de estudo em análise e engenharia de dados, SQL, automação, Business Intelligence e segurança da informação.

**[Explorar o painel interativo](https://russoaugusto.github.io/portfolio-dados-operacionais/)** · **[Abrir a calculadora de fila](https://russoaugusto.github.io/portfolio-dados-operacionais/fila/)** · **[Competências e evidências](docs/competencias.md)** · **[Modelo de apresentação do perfil](docs/PERFIL_GITHUB.md)**

> **Transparência:** este é um portfólio técnico pessoal. As bases, os exemplos e os resultados publicados são fictícios. Não representam dados, código, resultados mensurados ou entregas internas da VGX, da Claro ou de clientes; não há endosso das empresas.

## Tecnologias e práticas demonstradas

- **Python 3 / SQLite / SQL:** transformação, consultas reproduzíveis, CTEs, funções de janela, verificações de integridade e consistência.
- **BI e planejamento:** leitura de indicadores, comparação em horários equivalentes, capacidade e saldo operacional.
- **JavaScript / HTML / CSS:** painel responsivo publicado pelo GitHub Pages.
- **GitHub Actions / Git:** CI para testes, checagens estáticas, auditoria de fontes e implantação do site.
- **Segurança de dados:** menor privilégio, proteção contra exposição de segredos e revisão fictícia de permissões.

## Calculadora de fila para planilhas

Use o exemplo fictício ou abra um arquivo `.xlsx` ou `.csv` com uma linha por dia. No Excel, escolha a aba. Indique a linha do cabeçalho, associe as colunas de data, entradas e conclusões e informe a fila inicial para validar o histórico e calcular a fila de fechamento.

Com o histórico conferido, informe a demanda esperada, a capacidade diária e a data-limite. A calculadora projeta a fila, mostra quando ela zeraria dentro do prazo e estima o volume diário de conclusões necessário. A simulação permite considerar apenas dias úteis (segunda a sexta).

O arquivo e os cálculos ficam no dispositivo. A leitura de Excel usa SheetJS CE 0.20.3, distribuído localmente com sua licença Apache 2.0. [Experimentar a calculadora](https://russoaugusto.github.io/portfolio-dados-operacionais/fila/)

## Cases atualmente disponíveis

| Estudo | Pergunta de negócio | Código, metodologia e testes |
| --- | --- | --- |
| **Capacidade e fila** | Por que pode haver fila mesmo com capacidade total suficiente? | [Case documentado](docs/cases/capacidade.md) |
| **Granularidade no SQL** | Por que um `JOIN` pode multiplicar a contagem? | [Case documentado](docs/cases/granularidade.md) |
| **Comparação por horário de corte** | Uma queda parcial de volume é comparável com dias encerrados? | [Case documentado](docs/cases/horario-de-corte.md) |
| **Checklist de validação** | O que conferir antes de confiar em um indicador? | [Ver no painel](https://russoaugusto.github.io/portfolio-dados-operacionais/#validacoes) |

## Estudos preparados, ainda não publicados no painel

Os códigos e testes de estudos futuros já estão versionados; a **exibição no site** obedece a estas datas, e não deve ser antecipada em posts:

| Disponibilização | Case demonstrativo | Documentação |
| --- | --- | --- |
| 01/12/2026 | Segurança de acessos e menor privilégio | [Matriz de permissões](docs/cases/acessos-fora-do-perfil.md) |
| 01/01/2027 | Reconstrução de fila no horário de corte | [Snapshot temporal](docs/cases/fila-na-data-de-corte.md) |
| 01/02/2027 | Taxa agregada e mix de demanda | [Composição de indicadores](docs/cases/taxa-no-prazo.md) |
| 01/03/2027 | Capacidade por turno | [Análise por faixa horária](docs/cases/capacidade-por-turno.md) |

## Executar e validar

Pré-requisitos: **Python 3.10+**, um navegador e **Node.js** para os testes e as verificações do frontend. Os scripts Python usam apenas a biblioteca padrão.

```bash
python3 -m unittest discover -v
python3 scripts/security_checks.py
python3 -m compileall -q build_data.py novos_cases.py test_portfolio.py scripts
python3 build_data.py
node --check site/app.js
node --check site/fila/app.mjs
node --test tests/fila*.test.mjs
python3 -m http.server 8000 --directory site
```

Abra `http://localhost:8000`. A saída `site/data.json` é gerada localmente a partir de consultas e exemplos sintéticos.

### Qualidade e segurança

- O workflow [Validar estudos do portfólio](.github/workflows/validar-cases.yml) testa os scripts e checks estáticos em pull requests.
- O workflow [Atualizar painel do portfólio](.github/workflows/pages.yml) valida o build antes de publicar no GitHub Pages.
- O scanner local procura padrões típicos de credenciais, construções Python inseguras e imports não aprovados. **Não substitui auditoria especializada, SAST completo ou inspeção humana.**
- O verificador de dependências cobre o manifesto `requirements.txt` dos scripts Python. A biblioteca de leitura de Excel é distribuída com a versão fixada no frontend.

## Evolução e vínculo com o currículo

A [matriz de competências](docs/competencias.md) associa cada habilidade a trechos de código, testes e demonstrações públicas. Cada novo estudo deve seguir o [modelo de case](docs/TEMPLATE_CASE.md), com pergunta, arquitetura, método, evidência, validações, limites e decisões possíveis.

No currículo e no LinkedIn, diferencie **experiência profissional efetiva** de **projetos pessoais simulados**. É apropriado citar o portfólio como evidência de estudo e capacidade técnica, nunca como prova de ganhos em operações reais.

## Série mensal

O GitHub Actions recalcula o painel na atualização da branch `main` e no primeiro dia do mês. A série demonstrativa é definida em [novos_cases.py](novos_cases.py) e [sql/novos](sql/novos/). Novas contribuições devem ser revisadas e validadas antes de entrar na branch principal.

**Código-fonte:** https://github.com/russoaugusto/portfolio-dados-operacionais · **Demonstração:** https://russoaugusto.github.io/portfolio-dados-operacionais/
