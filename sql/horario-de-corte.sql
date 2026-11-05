-- Compare o volume das duas segundas até o mesmo horário local.
-- O total diário só serve de referência retrospectiva.
WITH settings (cutoff) AS (VALUES ('12:00:00'))
SELECT
    DATE(intake.received_at) AS day,
    SUBSTR(settings.cutoff, 1, 5) AS cutoff,
    SUM(CASE WHEN TIME(intake.received_at) <= settings.cutoff THEN 1 ELSE 0 END)
        AS count_at_cutoff,
    COUNT(*) AS daily_total
FROM intake
CROSS JOIN settings
GROUP BY DATE(intake.received_at), settings.cutoff
ORDER BY day;
