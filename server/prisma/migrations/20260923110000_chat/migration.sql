-- CreateTable
CREATE TABLE `conversaciones` (
    `id` VARCHAR(36) NOT NULL,
    `creado_por_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversacion_participantes` (
    `conversacion_id` VARCHAR(36) NOT NULL,
    `usuario_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `conversacion_participantes_usuario_id_idx`(`usuario_id`),
    UNIQUE INDEX `conversacion_participantes_conversacion_id_usuario_id_key`(`conversacion_id`, `usuario_id`),
    PRIMARY KEY (`conversacion_id`, `usuario_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mensajes` (
    `id` VARCHAR(36) NOT NULL,
    `conversacion_id` VARCHAR(36) NOT NULL,
    `autor_id` VARCHAR(36) NOT NULL,
    `texto` TEXT NOT NULL,
    `leido_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `mensajes_conversacion_id_idx`(`conversacion_id`),
    INDEX `mensajes_autor_id_idx`(`autor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `conversacion_participantes` ADD CONSTRAINT `conversacion_participantes_conversacion_id_fkey` FOREIGN KEY (`conversacion_id`) REFERENCES `conversaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversacion_participantes` ADD CONSTRAINT `conversacion_participantes_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensajes` ADD CONSTRAINT `mensajes_conversacion_id_fkey` FOREIGN KEY (`conversacion_id`) REFERENCES `conversaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensajes` ADD CONSTRAINT `mensajes_autor_id_fkey` FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;