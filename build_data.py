"""Executa os cases SQL em uma base sintética e gera os dados do painel."""

import json
import sqlite3
from contextlib import closing
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SQL = ROOT / "sql"
DATA_PATH = ROOT / "site" / "data.json"
QUERIES = {
    "capacity": "capacidade.sql",
    "grain": "granularidade.sql",
    "cutoff": "horario-de-corte.sql",
}


def validate_capacity(rows):
    previous_closing = 0
    for row in rows:
        workload = row["opening_queue"] + row["arrivals"]
        completed = min(workload, row["capacity"])
        if (
            row["opening_queue"] != previous_closing
            or row["completed"] != completed
            or row["closing_queue"] != workload - completed
            or row["unused_capacity"] != row["capacity"] - completed
        ):
            raise ValueError(f"Fila ou capacidade inconsistente em {row['day']}.")
        previous_closing = row["closing_queue"]


def build_data():
    data = {"synthetic": True}
    with closing(sqlite3.connect(":memory:")) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        connection.row_factory = sqlite3.Row
        connection.executescript((SQL / "fixtures.sql").read_text(encoding="utf-8"))
        for case, filename in QUERIES.items():
            query = (SQL / filename).read_text(encoding="utf-8")
            data[case] = [dict(row) for row in connection.execute(query)]
            if not data[case]:
                raise ValueError(f"A consulta {filename} não retornou dados.")
        validate_capacity(data["capacity"])
    return data


def main():
    data = build_data()
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    DATA_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    print(f"Dados sintéticos gerados em {DATA_PATH.relative_to(ROOT)}.")


if __name__ == "__main__":
    main()
