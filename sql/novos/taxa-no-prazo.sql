-- Volumes fictícios por semana e tipo de atendimento.
-- A taxa total usa o total de chamados como denominador.
WITH
    atendimentos (semana, tipo, no_prazo, chamados) AS (
        VALUES ('Semana 1', 'Simples', 81, 90),
               ('Semana 1', 'Complexo', 6, 10),
               ('Semana 2', 'Simples', 19, 20),
               ('Semana 2', 'Complexo', 52, 80)
    ),
    totais AS (
        SELECT semana, tipo, no_prazo, chamados, 0 AS geral
        FROM atendimentos
        UNION ALL
        SELECT semana, 'Total', SUM(no_prazo), SUM(chamados), 1
        FROM atendimentos
        GROUP BY semana
    )
SELECT
    semana,
    tipo,
    no_prazo,
    chamados,
    ROUND(100.0 * no_prazo / chamados, 1) AS taxa_pct
FROM totais
ORDER BY semana, geral, tipo;
