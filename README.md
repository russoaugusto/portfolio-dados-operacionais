# Portfólio de dados operacionais

Cases demonstrativos de SQL, BI, planejamento operacional e segurança cibernética. O [painel interativo](https://russoaugusto.github.io/portfolio-dados-operacionais/) reúne as análises. Todos os exemplos foram criados para este portfólio com dados fictícios.

| Case | Pergunta | O que a análise mostra |
| --- | --- | --- |
| Capacidade e fila | Em quais dias a equipe precisa de mais capacidade? | Separa demanda, capacidade, volume concluído e saldo em fila ao longo da semana. |
| Granularidade no SQL | Por que a contagem muda depois de um `JOIN`? | Mostra como várias atualizações de um mesmo chamado multiplicam as linhas da junção. |
| Comparação por horário de corte | Como comparar um dia em andamento com outro dia? | Compara volumes acumulados no mesmo horário e mostra o total diário para dar contexto. |

## Reproduzir

Execute a partir da raiz do repositório com Python 3.10 ou superior. O script usa SQLite da biblioteca padrão e as consultas da pasta [sql](sql/).

```sh
python build_data.py
python -m http.server 8000 --directory site
```

Abra `http://localhost:8000` para explorar os casos no navegador. O JSON em `site/data.json` é gerado a partir das consultas.

## Série mensal

O GitHub Actions recalcula os resultados e publica o painel quando a branch `main` muda e no primeiro dia de cada mês, às 9h23 no horário de São Paulo. Cada publicação inclui os estudos com data de estreia já alcançada.

A primeira série tem quatro estudos programados entre dezembro de 2026 e março de 2027. Os textos, datas e consultas estão em [novos_cases.py](novos_cases.py) e [sql/novos](sql/novos/). Para estender a série, adicione novos estudos com suas datas. Execute `python novos_cases.py` para validar todos os exemplos, inclusive os futuros.
