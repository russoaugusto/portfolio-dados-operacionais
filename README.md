# Portfólio de dados operacionais

Três cases demonstrativos de SQL, BI e planejamento operacional. O [painel interativo](https://russoaugusto.github.io/portfolio-dados-operacionais/) reúne as análises. Todos os exemplos foram criados para este portfólio com dados fictícios.

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

A cada alteração na branch `main`, o GitHub Actions recalcula os resultados e publica o painel atualizado no GitHub Pages.
