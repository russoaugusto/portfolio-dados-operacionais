-- A fila de fechamento de um dia vira a fila de abertura do próximo.
-- Capacidade ociosa em um dia não pode ser transferida para o futuro.
WITH RECURSIVE
    ordered_plan AS (
        SELECT ROW_NUMBER() OVER (ORDER BY day_number) AS step, day, arrivals, capacity
        FROM daily_plan
    ),
    queue (step, day, arrivals, capacity, opening_queue, closing_queue) AS (
        SELECT step, day, arrivals, capacity, 0, MAX(arrivals - capacity, 0)
        FROM ordered_plan
        WHERE step = 1

        UNION ALL

        SELECT
            plan.step,
            plan.day,
            plan.arrivals,
            plan.capacity,
            previous.closing_queue,
            MAX(previous.closing_queue + plan.arrivals - plan.capacity, 0)
        FROM queue AS previous
        JOIN ordered_plan AS plan ON plan.step = previous.step + 1
    )
SELECT
    day,
    arrivals,
    capacity,
    opening_queue,
    opening_queue + arrivals - closing_queue AS completed,
    closing_queue,
    capacity - (opening_queue + arrivals - closing_queue) AS unused_capacity
FROM queue
ORDER BY step;
