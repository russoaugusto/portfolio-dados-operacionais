-- Agregue os eventos por ordem antes de juntá-los à tabela de ordens.
-- Uma ordem sem eventos ainda contribui com uma linha em um LEFT JOIN direto.
WITH events_by_order AS (
    SELECT order_id, COUNT(*) AS events
    FROM order_event
    GROUP BY order_id
)
SELECT
    work_order.order_id,
    work_order.status,
    COALESCE(events_by_order.events, 0) AS events,
    MAX(COALESCE(events_by_order.events, 0), 1) AS joined_rows
FROM work_order
LEFT JOIN events_by_order USING (order_id)
ORDER BY work_order.order_id;
