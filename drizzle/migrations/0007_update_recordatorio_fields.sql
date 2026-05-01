ALTER TABLE `recordatorio` RENAME COLUMN "fecha_envio" TO "envio_mensaje";--> statement-breakpoint
ALTER TABLE `recordatorio` RENAME COLUMN "fecha_limite" TO "fecha_recepcion_pedido";--> statement-breakpoint
ALTER TABLE `recordatorio` ADD `entrega_tentativa` integer NOT NULL DEFAULT 0;