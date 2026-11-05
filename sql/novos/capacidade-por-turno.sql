-- Demanda e escala fictícias. Cada faixa tem 120 minutos por pessoa.
WITH
    entradas (ordem, faixa, simples, complexos) AS (
        VALUES (1, '08h–10h', 18, 6),
               (2, '10h–12h', 24, 11),
               (3, '12h–14h', 12, 4),
               (4, '14h–16h', 15, 7)
    ),
    escala (ordem, pessoas, minutos_produtivos) AS (
        VALUES (1, 3, 90), (2, 3, 90), (3, 2, 90), (4, 3, 90)
    ),
    carga AS (
        SELECT
            entradas.ordem,
            entradas.faixa,
            entradas.simples * 6 + entradas.complexos * 18 AS carga_min,
            escala.pessoas * escala.minutos_produtivos AS disponivel_min
        FROM entradas
        JOIN escala USING (ordem)
    )
SELECT
    faixa,
    carga_min,
    disponivel_min,
    disponivel_min - carga_min AS saldo_min
FROM carga
ORDER BY ordem;
