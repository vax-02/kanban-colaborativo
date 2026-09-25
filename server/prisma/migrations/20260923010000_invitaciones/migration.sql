-- CreateTable
CREATE TABLE `invitaciones` (
    `id` VARCHAR(36) NOT NULL,
    `tablero_id` VARCHAR(36) NOT NULL,
    `usuario_id` VARCHAR(36) NOT NULL,
    `creado_por_id` VARCHAR(36) NOT NULL,
    `rol` ENUM('ADMINISTRADOR', 'MIEMBRO', 'EDITOR', 'LECTURA') NOT NULL DEFAULT 'MIEMBRO',
    `estado` ENUM('PENDIENTE', 'ACEPTADA', 'RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
    `mensaje` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `respondida_at` DATETIME(3) NULL,

    INDEX `invitaciones_usuario_id_estado_idx`(`usuario_id`, `estado`),
    INDEX `invitaciones_tablero_id_idx`(`tablero_id`),
    UNIQUE INDEX `invitaciones_tablero_id_usuario_id_key`(`tablero_id`, `usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `invitaciones` ADD CONSTRAINT `invitaciones_tablero_id_fkey` FOREIGN KEY (`tablero_id`) REFERENCES `tableros`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitaciones` ADD CONSTRAINT `invitaciones_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitaciones` ADD CONSTRAINT `invitaciones_creado_por_id_fkey` FOREIGN KEY (`creado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;