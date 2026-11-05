"""Coleção mensal de estudos reproduzíveis com dados fictícios."""

from contextlib import closing
from datetime import date
from pathlib import Path
import sqlite3


ROOT = Path(__file__).resolve().parent

CASES = (
    {
        "slug": "acessos-fora-do-perfil",
        "title": "Quais permissões excedem o perfil de acesso?",
        "topic": "Segurança cibernética",
        "date": "2026-12-01",
        "question": (
            "Como usar uma matriz de acesso para separar permissões previstas "
            "de concessões que merecem revisão?"
        ),
        "interpretation": (
            "Duas das seis concessões ficam fora da matriz fictícia. A análise "
            "orienta a revisão com o responsável pelo acesso antes de alterar permissões."
        ),
        "columns": [
            {"key": "pessoa", "label": "Identificador fictício"},
            {"key": "perfil", "label": "Perfil"},
            {"key": "permissao", "label": "Permissão concedida"},
            {"key": "resultado", "label": "Resultado"},
        ],
    },
    {
        "slug": "fila-na-data-de-corte",
        "title": "Qual era a fila no fechamento do dia?",
        "topic": "SQL",
        "date": "2027-01-01",
        "question": (
            "Como reconstruir o estado de cada chamado às 18h quando a base "
            "registra várias mudanças de estado?"
        ),
        "interpretation": (
            "Dois chamados estavam na fila às 18h. O C02 só foi resolvido depois "
            "do corte. No C03, o ID do evento distingue uma reabertura ocorrida "
            "no mesmo horário da resolução."
        ),
        "columns": [
            {"key": "chamado", "label": "Chamado"},
            {"key": "ultimo_evento", "label": "Último evento até o corte"},
            {"key": "estado", "label": "Estado às 18h"},
            {"key": "em_fila", "label": "Em fila"},
        ],
    },
    {
        "slug": "taxa-no-prazo",
        "title": "Por que o total caiu quando os dois grupos melhoraram?",
        "topic": "BI",
        "date": "2027-02-01",
        "question": (
            "O que muda na interpretação da taxa no prazo quando a composição "
            "da demanda muda de uma semana para outra?"
        ),
        "interpretation": (
            "A taxa geral caiu de 87% para 71%, embora os dois grupos tenham "
            "melhorado. Os chamados complexos passaram de 10% para 80% do volume. "
            "Exibir volume e taxa por grupo ajuda a explicar a queda."
        ),
        "columns": [
            {"key": "semana", "label": "Período"},
            {"key": "tipo", "label": "Tipo"},
            {"key": "no_prazo", "label": "No prazo"},
            {"key": "chamados", "label": "Chamados"},
            {"key": "taxa_pct", "label": "Taxa no prazo (%)"},
        ],
    },
    {
        "slug": "capacidade-por-turno",
        "title": "Em que horário falta capacidade?",
        "topic": "Planejamento operacional",
        "date": "2027-03-01",
        "question": (
            "O saldo de capacidade do dia esconde algum horário em que a carga "
            "prevista supera os minutos produtivos da equipe?"
        ),
        "interpretation": (
            "O dia tem saldo de 72 minutos, mas a faixa de 10h a 12h tem déficit "
            "de 72 minutos. Esse é o primeiro horário a avaliar ao redistribuir "
            "a escala ou ajustar a previsão de fila."
        ),
        "columns": [
            {"key": "faixa", "label": "Faixa"},
            {"key": "carga_min", "label": "Carga prevista (min)"},
            {"key": "disponivel_min", "label": "Tempo produtivo (min)"},
            {"key": "saldo_min", "label": "Saldo (min)"},
        ],
    },
)


def released_cases(as_of: date) -> list[dict]:
    """Executa as consultas dos cases liberados até a data, do mais novo ao mais antigo."""
    published = []
    with closing(sqlite3.connect(":memory:")) as connection:
        connection.row_factory = sqlite3.Row
        for case in reversed(CASES):
            if date.fromisoformat(case["date"]) > as_of:
                continue

            sql = f"sql/novos/{case['slug']}.sql"
            query = (ROOT / sql).read_text(encoding="utf-8")
            rows = [dict(row) for row in connection.execute(query)]
            keys = {column["key"] for column in case["columns"]}
            if not rows or any(row.keys() != keys for row in rows):
                raise ValueError(f"Resultado incompatível com as colunas de {sql}")

            published.append({**case, "sql": sql, "rows": rows})
    return published


def validate_cases() -> None:
    """Confere os cálculos da série inicial e as datas de liberação."""
    all_cases = released_cases(date.max)
    by_slug = {case["slug"]: case["rows"] for case in all_cases}
    dates = [date.fromisoformat(case["date"]) for case in CASES]
    if len(by_slug) != len(all_cases) or dates != sorted(set(dates)):
        raise ValueError("Identificadores repetidos ou datas fora de ordem")
    if any(day.day != 1 for day in dates):
        raise ValueError("As datas de liberação devem cair no primeiro dia do mês")

    accesses = by_slug["acessos-fora-do-perfil"]
    review = [row["pessoa"] for row in accesses if row["resultado"] == "Revisar"]
    if len(accesses) != 6 or review != ["U01", "U03"]:
        raise ValueError("Permissões para revisão divergentes")

    queue = by_slug["fila-na-data-de-corte"]
    queued = [row["chamado"] for row in queue if row["em_fila"] == "Sim"]
    if len(queue) != 4 or queued != ["C02", "C03"] or queue[2]["estado"] != "Reaberto":
        raise ValueError("Fila no horário de corte divergente")

    rates = by_slug["taxa-no-prazo"]
    if [row["taxa_pct"] for row in rates if row["tipo"] == "Total"] != [87, 71]:
        raise ValueError("Taxas totais divergentes")

    capacity = by_slug["capacidade-por-turno"]
    if [row["saldo_min"] for row in capacity] != [54, -72, 36, 54]:
        raise ValueError("Saldos de capacidade divergentes")

    limits = [
        (date(2026, 11, 30), 0),
        (date(2026, 12, 1), 1),
        (date(2027, 1, 1), 2),
        (date(2027, 2, 1), 3),
        (date(2027, 3, 1), 4),
    ]
    for cutoff, expected in limits:
        if len(released_cases(cutoff)) != expected:
            raise ValueError(f"Número de cases liberados incorreto em {cutoff}")


if __name__ == "__main__":
    validate_cases()
    print("Cases validados, incluindo os cortes de publicação.")
