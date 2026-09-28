-- CreateTable
CREATE TABLE `actividades` (
    `id` VARCHAR(36) NOT NULL,
    `tablero_id` VARCHAR(36) NOT NULL,
    `autor_id` VARCHAR(36) NULL,
    `tipo` ENUM('TABLERO_CREADO', 'TAREA_CREADA', 'TAREA_MOVIDA', 'TAREA_ELIMINADA', 'PRIORIDAD_CAMBIADA', 'MIEMBRO_INVITADO', 'MIEMBRO_UNIDO', 'MIEMBRO_REMOVIDO') NOT NULL,
    `tarea_id` VARCHAR(36) NULL,
    `usuario_id` VARCHAR(36) NULL,
    `detalle` VARCHAR(500) NULL,
    `de` VARCHAR(100) NULL,
    `a` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `actividades_tablero_id_idx`(`tablero_id`),
    INDEX `actividades_tablero_id_created_at_idx`(`tablero_id`, `created_at`),
    INDEX `actividades_tarea_id_idx`(`tarea_id`),
    INDEX `actividades_autor_id_idx`(`autor_id`),
    INDEX `actividades_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `membresias` (
    `id` VARCHAR(36) NOT NULL,
    `tablero_id` VARCHAR(36) NOT NULL,
    `usuario_id` VARCHAR(36) NOT NULL,
    `rol` ENUM('ADMINISTRADOR', 'MIEMBRO', 'EDITOR', 'LECTURA') NOT NULL DEFAULT 'MIEMBRO',
    `ingreso_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `salida_at` DATETIME(3) NULL,

    INDEX `membresias_tablero_id_idx`(`tablero_id`),
    INDEX `membresias_tablero_id_salida_at_idx`(`tablero_id`, `salida_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `actividades` ADD CONSTRAINT `actividades_tablero_id_fkey` FOREIGN KEY (`tablero_id`) REFERENCES `tableros`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividades` ADD CONSTRAINT `actividades_autor_id_fkey` FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividades` ADD CONSTRAINT `actividades_tarea_id_fkey` FOREIGN KEY (`tarea_id`) REFERENCES `tareas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividades` ADD CONSTRAINT `actividades_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `membresias` ADD CONSTRAINT `membresias_tablero_id_fkey` FOREIGN KEY (`tablero_id`) REFERENCES `tableros`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `membresias` ADD CONSTRAINT `membresias_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;