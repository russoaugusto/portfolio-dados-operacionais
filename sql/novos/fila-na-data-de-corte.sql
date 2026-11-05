-- Histórico fictício de chamados. O ID do evento resolve empates de horário.
WITH
    corte (instante) AS (VALUES ('2027-01-08 18:00:00')),
    eventos (id, chamado, momento, estado) AS (
        VALUES (1, 'C01', '2027-01-08 09:00:00', 'Aberto'),
               (2, 'C01', '2027-01-08 12:00:00', 'Resolvido'),
               (3, 'C02', '2027-01-08 10:00:00', 'Aberto'),
               (4, 'C02', '2027-01-08 19:00:00', 'Resolvido'),
               (5, 'C03', '2027-01-08 11:00:00', 'Resolvido'),
               (6, 'C03', '2027-01-08 11:00:00', 'Reaberto'),
               (7, 'C04', '2027-01-08 08:00:00', 'Aberto'),
               (8, 'C04', '2027-01-08 18:00:00', 'Resolvido'),
               (9, 'C05', '2027-01-08 20:00:00', 'Aberto')
    ),
    elegiveis AS (
        SELECT
            chamado, momento, estado,
            ROW_NUMBER() OVER (
                PARTITION BY chamado ORDER BY momento DESC, id DESC
            ) AS posicao
        FROM eventos
        CROSS JOIN corte
        WHERE momento <= corte.instante
    )
SELECT
    chamado,
    momento AS ultimo_evento,
    estado,
    CASE WHEN estado = 'Resolvido' THEN 'Não' ELSE 'Sim' END AS em_fila
FROM elegiveis
WHERE posicao = 1
ORDER BY chamado;
