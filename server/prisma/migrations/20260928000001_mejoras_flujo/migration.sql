-- Mejoras de flujo: archivar tableros, notificaciones de tareas y comentarios.

-- AlterTable: archivar tableros (soft delete)
ALTER TABLE `tableros` ADD COLUMN `archivado` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: ampliar el enum de notificaciones a los eventos de tareas
ALTER TABLE `notificaciones`
  MODIFY COLUMN `tipo` ENUM(
    'INVITACION',
    'INVITACION_ACEPTADA',
    'INVITACION_RECHAZADA',
    'TAREA_ASIGNADA',
    'TAREA_MOVIDA',
    'TAREA_MENCION',
    'TAREA_POR_VENCER'
  ) NOT NULL;

-- Crear índice y columna tarea_id para las notificaciones de tareas (deep-link)
ALTER TABLE `notificaciones`
  ADD COLUMN `tarea_id` VARCHAR(36) NULL,
  ADD INDEX `notificaciones_usuario_id_tarea_id_idx` (`usuario_id`, `tarea_id`);

-- AddForeignKey
ALTER TABLE `notificaciones` ADD CONSTRAINT `notificaciones_tarea_id_fkey`
  FOREIGN KEY (`tarea_id`) REFERENCES `tareas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: comentarios de tarjetas
CREATE TABLE `comentarios` (
    `id` VARCHAR(36) NOT NULL,
    `tarea_id` VARCHAR(36) NOT NULL,
    `autor_id` VARCHAR(36) NOT NULL,
    `texto` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `comentarios_tarea_id_idx`(`tarea_id`),
    INDEX `comentarios_autor_id_idx`(`autor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `comentarios` ADD CONSTRAINT `comentarios_tarea_id_fkey`
  FOREIGN KEY (`tarea_id`) REFERENCES `tareas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comentarios` ADD CONSTRAINT `comentarios_autor_id_fkey`
  FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;