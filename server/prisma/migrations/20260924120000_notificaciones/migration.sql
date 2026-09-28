-- CreateTable
CREATE TABLE `notificaciones` (
    `id` VARCHAR(36) NOT NULL,
    `usuario_id` VARCHAR(36) NOT NULL,
    `tipo` ENUM('INVITACION', 'INVITACION_ACEPTADA', 'INVITACION_RECHAZADA') NOT NULL,
    `titulo` VARCHAR(255) NOT NULL,
    `cuerpo` VARCHAR(500) NULL,
    `tablero_id` VARCHAR(36) NULL,
    `invitacion_id` VARCHAR(36) NULL,
    `leida` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notificaciones_usuario_id_leida_idx`(`usuario_id`, `leida`),
    INDEX `notificaciones_usuario_id_idx`(`usuario_id`),
    INDEX `notificaciones_tablero_id_idx`(`tablero_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notificaciones` ADD CONSTRAINT `notificaciones_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificaciones` ADD CONSTRAINT `notificaciones_tablero_id_fkey` FOREIGN KEY (`tablero_id`) REFERENCES `tableros`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificaciones` ADD CONSTRAINT `notificaciones_invitacion_id_fkey` FOREIGN KEY (`invitacion_id`) REFERENCES `invitaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;