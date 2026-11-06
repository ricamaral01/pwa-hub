BEGIN;
INSERT INTO ged_identity_links (mapa_user_id, ged_user_id, active, approved_by)
VALUES ('ilson', 'de965462-0951-406d-a79f-ea5b083aa6ed', true, 'user-request-20261106');
COMMIT;

SELECT l.mapa_user_id, l.active AS link_active, u.name, u.role, u.active AS user_active
FROM ged_identity_links l JOIN users u ON u.id = l.ged_user_id
WHERE l.mapa_user_id IN ('user-ricardo', 'ilson', 'alex', 'marcelo')
ORDER BY l.mapa_user_id;
