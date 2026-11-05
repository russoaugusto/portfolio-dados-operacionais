-- Dados sintéticos para demonstração, sem vínculo com uma operação real.
CREATE TABLE daily_plan (
    day_number INTEGER PRIMARY KEY,
    day TEXT NOT NULL UNIQUE,
    arrivals INTEGER NOT NULL CHECK (arrivals >= 0),
    capacity INTEGER NOT NULL CHECK (capacity >= 0)
);

INSERT INTO daily_plan VALUES
    (1, 'Seg', 180, 100),
    (2, 'Ter', 70, 110),
    (3, 'Qua', 50, 110),
    (4, 'Qui', 70, 100),
    (5, 'Sex', 130, 100);

CREATE TABLE work_order (
    order_id TEXT PRIMARY KEY,
    status TEXT NOT NULL
);

CREATE TABLE order_event (
    event_id INTEGER PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES work_order (order_id)
);

INSERT INTO work_order VALUES
    ('OS-01', 'Concluída'),
    ('OS-02', 'Em atendimento'),
    ('OS-03', 'Aguardando'),
    ('OS-04', 'Concluída');

INSERT INTO order_event (event_id, order_id) VALUES
    (1, 'OS-01'), (2, 'OS-01'), (3, 'OS-01'),
    (4, 'OS-02'), (5, 'OS-02'), (6, 'OS-04');

CREATE TABLE intake (
    intake_id INTEGER PRIMARY KEY,
    received_at TEXT NOT NULL
);

-- Duas segundas-feiras fictícias no mesmo fuso, com corte inclusivo às 12h.
INSERT INTO intake (received_at) VALUES
    ('2026-10-19 08:12:00'), ('2026-10-19 10:43:00'), ('2026-10-19 12:00:00'),
    ('2026-10-19 12:01:00'), ('2026-10-19 14:05:00'), ('2026-10-19 15:20:00'),
    ('2026-10-19 17:22:00'),
    ('2026-10-26 08:51:00'), ('2026-10-26 09:35:00'), ('2026-10-26 10:44:00'),
    ('2026-10-26 11:58:00'), ('2026-10-26 16:13:00');
