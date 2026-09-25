-- CreateTable
CREATE TABLE `tableros` (
    `id` VARCHAR(36) NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `color` VARCHAR(7) NOT NULL DEFAULT '#6366f1',
    `plantilla` ENUM('PROYECTO', 'SPRINT', 'TAREAS', 'VACIO') NOT NULL DEFAULT 'PROYECTO',
    `es_privado` BOOLEAN NOT NULL DEFAULT false,
    `creado_por_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `tableros_creado_por_id_idx`(`creado_por_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tablero_miembros` (
    `tablero_id` VARCHAR(36) NOT NULL,
    `usuario_id` VARCHAR(36) NOT NULL,
    `rol` ENUM('ADMINISTRADOR', 'MIEMBRO', 'EDITOR', 'LECTURA') NOT NULL DEFAULT 'MIEMBRO',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tablero_miembros_usuario_id_idx`(`usuario_id`),
    UNIQUE INDEX `tablero_miembros_tablero_id_usuario_id_key`(`tablero_id`, `usuario_id`),
    PRIMARY KEY (`tablero_id`, `usuario_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `columnas` (
    `id` VARCHAR(36) NOT NULL,
    `tablero_id` VARCHAR(36) NOT NULL,
    `titulo` VARCHAR(100) NOT NULL,
    `color` VARCHAR(7) NOT NULL DEFAULT '#94a3b8',
    `posicion` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `columnas_tablero_id_idx`(`tablero_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tareas` (
    `id` VARCHAR(36) NOT NULL,
    `columna_id` VARCHAR(36) NOT NULL,
    `creado_por_id` VARCHAR(36) NULL,
    `titulo` VARCHAR(255) NOT NULL,
    `descripcion` TEXT NULL,
    `prioridad` ENUM('ALTA', 'MEDIA', 'BAJA') NOT NULL DEFAULT 'MEDIA',
    `fecha_vencimiento` DATETIME(3) NULL,
    `posicion` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `tareas_columna_id_idx`(`columna_id`),
    INDEX `tareas_creado_por_id_idx`(`creado_por_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `etiquetas` (
    `id` VARCHAR(36) NOT NULL,
    `tablero_id` VARCHAR(36) NOT NULL,
    `texto` VARCHAR(50) NOT NULL,
    `color` VARCHAR(7) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `etiquetas_tablero_id_idx`(`tablero_id`),
    UNIQUE INDEX `etiquetas_tablero_id_texto_key`(`tablero_id`, `texto`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tarea_etiquetas` (
    `tarea_id` VARCHAR(36) NOT NULL,
    `etiqueta_id` VARCHAR(36) NOT NULL,

    INDEX `tarea_etiquetas_etiqueta_id_idx`(`etiqueta_id`),
    UNIQUE INDEX `tarea_etiquetas_tarea_id_etiqueta_id_key`(`tarea_id`, `etiqueta_id`),
    PRIMARY KEY (`tarea_id`, `etiqueta_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tarea_asignaciones` (
    `tarea_id` VARCHAR(36) NOT NULL,
    `usuario_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tarea_asignaciones_usuario_id_idx`(`usuario_id`),
    UNIQUE INDEX `tarea_asignaciones_tarea_id_usuario_id_key`(`tarea_id`, `usuario_id`),
    PRIMARY KEY (`tarea_id`, `usuario_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `checklist_items` (
    `id` VARCHAR(36) NOT NULL,
    `tarea_id` VARCHAR(36) NOT NULL,
    `texto` VARCHAR(200) NOT NULL,
    `hecho` BOOLEAN NOT NULL DEFAULT false,
    `posicion` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `checklist_items_tarea_id_idx`(`tarea_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorito_tableros` (
    `tablero_id` VARCHAR(36) NOT NULL,
    `usuario_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `favorito_tableros_usuario_id_idx`(`usuario_id`),
    UNIQUE INDEX `favorito_tableros_tablero_id_usuario_id_key`(`tablero_id`, `usuario_id`),
    PRIMARY KEY (`tablero_id`, `usuario_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tableros` ADD CONSTRAINT `tableros_creado_por_id_fkey` FOREIGN KEY (`creado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tablero_miembros` ADD CONSTRAINT `tablero_miembros_tablero_id_fkey` FOREIGN KEY (`tablero_id`) REFERENCES `tableros`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tablero_miembros` ADD CONSTRAINT `tablero_miembros_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `columnas` ADD CONSTRAINT `columnas_tablero_id_fkey` FOREIGN KEY (`tablero_id`) REFERENCES `tableros`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tareas` ADD CONSTRAINT `tareas_columna_id_fkey` FOREIGN KEY (`columna_id`) REFERENCES `columnas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tareas` ADD CONSTRAINT `tareas_creado_por_id_fkey` FOREIGN KEY (`creado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `etiquetas` ADD CONSTRAINT `etiquetas_tablero_id_fkey` FOREIGN KEY (`tablero_id`) REFERENCES `tableros`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarea_etiquetas` ADD CONSTRAINT `tarea_etiquetas_tarea_id_fkey` FOREIGN KEY (`tarea_id`) REFERENCES `tareas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarea_etiquetas` ADD CONSTRAINT `tarea_etiquetas_etiqueta_id_fkey` FOREIGN KEY (`etiqueta_id`) REFERENCES `etiquetas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarea_asignaciones` ADD CONSTRAINT `tarea_asignaciones_tarea_id_fkey` FOREIGN KEY (`tarea_id`) REFERENCES `tareas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarea_asignaciones` ADD CONSTRAINT `tarea_asignaciones_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `checklist_items` ADD CONSTRAINT `checklist_items_tarea_id_fkey` FOREIGN KEY (`tarea_id`) REFERENCES `tareas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorito_tableros` ADD CONSTRAINT `favorito_tableros_tablero_id_fkey` FOREIGN KEY (`tablero_id`) REFERENCES `tableros`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorito_tableros` ADD CONSTRAINT `favorito_tableros_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;