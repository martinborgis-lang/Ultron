-- Migration pour ajouter les nouveaux stages RDV multiples à toutes les organisations
-- Ce script ajoute 5 nouveaux stages entre "RDV Pris" et "Négociation"

-- 1. Insérer les nouveaux stages RDV pour toutes les organisations
INSERT INTO pipeline_stages (organization_id, name, slug, position, color, is_won, is_lost, created_at, updated_at)
SELECT
  o.id as organization_id,
  stage_data.name,
  stage_data.slug,
  stage_data.position::numeric,
  stage_data.color,
  stage_data.is_won::boolean,
  stage_data.is_lost::boolean,
  NOW() as created_at,
  NOW() as updated_at
FROM organizations o
CROSS JOIN (
  VALUES
    ('RDV 2 Programmé', 'rdv_2_programme', '2.1', '#8B5CF6', 'false', 'false'),
    ('RDV 2 Effectué', 'rdv_2_effectue', '2.2', '#7C3AED', 'false', 'false'),
    ('RDV 3 Programmé', 'rdv_3_programme', '2.3', '#6D28D9', 'false', 'false'),
    ('RDV 3 Effectué', 'rdv_3_effectue', '2.4', '#5B21B6', 'false', 'false'),
    ('Proposition Envoyée', 'proposition_envoyee', '2.5', '#F59E0B', 'false', 'false')
) AS stage_data(name, slug, position, color, is_won, is_lost)
WHERE NOT EXISTS (
  SELECT 1
  FROM pipeline_stages ps
  WHERE ps.organization_id = o.id
  AND ps.slug = stage_data.slug
);

-- 2. Mettre à jour les positions des stages existants pour maintenir l'ordre
UPDATE pipeline_stages
SET
  position = CASE
    WHEN slug = 'negociation' THEN 3.0
    WHEN slug = 'gagne' THEN 4.0
    WHEN slug = 'perdu' THEN 5.0
    ELSE position
  END,
  updated_at = NOW()
WHERE slug IN ('negociation', 'gagne', 'perdu');

-- 3. Vérification - Afficher le nombre de stages ajoutés par organisation
SELECT
  o.name as organization_name,
  COUNT(*) as total_stages,
  COUNT(CASE WHEN ps.slug LIKE 'rdv_%' OR ps.slug = 'proposition_envoyee' THEN 1 END) as rdv_stages
FROM organizations o
LEFT JOIN pipeline_stages ps ON ps.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY o.name;

-- 4. Afficher la nouvelle structure des stages triés par position
SELECT
  o.name as organization_name,
  ps.position,
  ps.slug,
  ps.name as stage_name,
  ps.color
FROM organizations o
JOIN pipeline_stages ps ON ps.organization_id = o.id
ORDER BY o.name, ps.position;