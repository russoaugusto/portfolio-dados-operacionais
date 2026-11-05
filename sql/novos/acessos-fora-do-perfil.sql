-- Revisão defensiva de permissões com uma matriz de acesso fictícia.
WITH
    pessoas (pessoa, perfil) AS (
        VALUES ('U01', 'Analista'), ('U02', 'Analista'), ('U03', 'Publicador')
    ),
    permitidas (perfil, permissao) AS (
        VALUES ('Analista', 'Ler painel'),
               ('Publicador', 'Ler painel'),
               ('Publicador', 'Publicar painel')
    ),
    concedidas (pessoa, permissao) AS (
        VALUES ('U01', 'Ler painel'),
               ('U01', 'Exportar base'),
               ('U02', 'Ler painel'),
               ('U03', 'Ler painel'),
               ('U03', 'Publicar painel'),
               ('U03', 'Administrar painel')
    )
SELECT
    pessoas.pessoa,
    pessoas.perfil,
    concedidas.permissao,
    CASE WHEN permitidas.permissao IS NULL THEN 'Revisar' ELSE 'Prevista' END AS resultado
FROM concedidas
JOIN pessoas ON pessoas.pessoa = concedidas.pessoa
LEFT JOIN permitidas
    ON permitidas.perfil = pessoas.perfil
    AND permitidas.permissao = concedidas.permissao
ORDER BY
    permitidas.permissao IS NOT NULL,
    pessoas.pessoa,
    concedidas.permissao;
