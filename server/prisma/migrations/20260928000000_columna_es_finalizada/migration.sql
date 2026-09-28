-- Marcar explícitamente qué columnas son de cierre en vez de deducirlo del nombre.
-- AlterTable
ALTER TABLE `columnas` ADD COLUMN `es_finalizada` BOOLEAN NOT NULL DEFAULT false;

-- Backfill: cubre las dos heurísticas que había en el código
-- ('TERMINADO' exacto en tasks.routes/Overview/CalendarPage e includes 'termin' en lib/filters).
UPDATE `columnas` SET `es_finalizada` = true
WHERE UPPER(`titulo`) = 'TERMINADO' OR LOWER(`titulo`) LIKE '%termin%';
