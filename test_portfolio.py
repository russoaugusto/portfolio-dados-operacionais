"""Verificações determinísticas do portfólio; apenas dados sintéticos."""
import unittest
from datetime import date
from pathlib import Path

from build_data import build_data, validate_capacity, ROOT
from novos_cases import CASES, validate_cases


class TestPortfolio(unittest.TestCase):
    def test_cases_sinteticos_reproduziveis(self):
        first = build_data(as_of=date(2026, 11, 7))
        second = build_data(as_of=date(2026, 11, 7))
        self.assertEqual(first, second)
        self.assertIs(first["synthetic"], True)
        self.assertEqual(len(first["capacity"]), 5)
        self.assertEqual(len(first["grain"]), 4)
        self.assertEqual(len(first["cutoff"]), 2)
        self.assertEqual(first["new_cases"], [])

    def test_capacidade_e_fila(self):
        rows = build_data(as_of=date(2026, 11, 7))["capacity"]
        validate_capacity(rows)
        self.assertTrue(all(row["closing_queue"] >= 0 for row in rows))
        self.assertEqual(rows[0]["opening_queue"], 0)
        self.assertEqual(sum(row["arrivals"] for row in rows), 500)

    def test_granularidade(self):
        rows = build_data(as_of=date(2026, 11, 7))["grain"]
        self.assertEqual({row["order_id"] for row in rows},
                         {"OS-01", "OS-02", "OS-03", "OS-04"})
        self.assertEqual(sum(row["events"] for row in rows), 6)
        self.assertGreater(sum(row["joined_rows"] for row in rows), len(rows))

    def test_mesmo_horario_de_corte(self):
        rows = build_data(as_of=date(2026, 11, 7))["cutoff"]
        self.assertEqual({r["cutoff"] for r in rows}, {"12:00"})
        self.assertTrue(all(0 <= r["count_at_cutoff"] <= r["daily_total"] for r in rows))

    def test_serie_mensal(self):
        validate_cases()
        final = build_data(as_of=date(2027, 3, 1))
        self.assertEqual(len(final["new_cases"]), len(CASES))
        self.assertTrue(all(case["rows"] for case in final["new_cases"]))

    def test_documentacao_para_todos_os_cases(self):
        paths = ["capacidade", "granularidade", "horario-de-corte"]
        paths += [case["slug"] for case in CASES]
        for slug in paths:
            with self.subTest(slug=slug):
                md = ROOT / "docs" / "cases" / (slug + ".md")
                self.assertTrue(md.is_file())
                content = md.read_text(encoding="utf-8")
                for section in [
                    "Problema / pergunta", "Arquitetura e fluxo", "Metodologia",
                    "Código e reprodução", "Testes e verificações",
                    "Resultados sintéticos e limitações", "Decisões possíveis",
                ]:
                    self.assertIn(section, content)
                self.assertIn("fictício", content.lower())


if __name__ == "__main__":
    unittest.main()
