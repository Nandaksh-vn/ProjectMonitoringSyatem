-- Intentionally a no-op.
-- The test profile builds its schema from the JPA entities
-- (spring.jpa.hibernate.ddl-auto=create-drop), so there is no DDL to run here.
-- This file exists because spring.sql.init treats a missing schema-locations
-- entry as a hard startup failure, and pointing at the main schema.sql would
-- execute MySQL-only syntax against H2. The SELECT keeps the script non-empty,
-- which the script runner requires.
SELECT 1;
