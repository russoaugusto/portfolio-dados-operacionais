-- Estudo fictício: deduplicação determinística por chave de evento.
-- Desempate por instante de ingestão e ID de carga; sem tabelas externas.
WITH
eventos(evento, ingestao, carga_id, valor) AS (
 VALUES ('E01','2027-03-02 09:00:00',1,10),
        ('E01','2027-03-02 09:10:00',2,10),
        ('E02','2027-03-02 09:05:00',3,20),
        ('E02','2027-03-02 09:05:00',4,25),
        ('E03','2027-03-02 09:20:00',5,30),
        ('E04','2027-03-02 09:30:00',6,40),
        ('E04','2027-03-02 09:40:00',7,40)
),
classificados AS (
 SELECT evento, ingestao, carga_id, valor,
        COUNT(*) OVER (PARTITION BY evento) AS versoes,
        ROW_NUMBER() OVER (
          PARTITION BY evento ORDER BY ingestao DESC, carga_id DESC
        ) AS posicao
 FROM eventos
)
SELECT evento, valor AS valor_canonico, versoes,
       versoes - 1 AS duplicatas_descartadas
FROM classificados
WHERE posicao = 1
ORDER BY evento;
