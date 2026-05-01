PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_recordatorio` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`envio_mensaje` integer NOT NULL,
	`fecha_recepcion_pedido` integer NOT NULL,
	`entrega_tentativa` integer NOT NULL,
	`id_recorrido` integer NOT NULL,
	`estado` text NOT NULL,
	FOREIGN KEY (`id_recorrido`) REFERENCES `recorrido`(`codigo`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_recordatorio`("id", "envio_mensaje", "fecha_recepcion_pedido", "entrega_tentativa", "id_recorrido", "estado") 
SELECT r."id", r."envio_mensaje", r."fecha_recepcion_pedido", r."entrega_tentativa", rec."codigo", r."estado" 
FROM `recordatorio` r
JOIN `recorrido` rec ON r."id_recorrido" = rec."id";
--> statement-breakpoint
DROP TABLE `recordatorio`;--> statement-breakpoint
ALTER TABLE `__new_recordatorio` RENAME TO `recordatorio`;--> statement-breakpoint
PRAGMA foreign_keys=ON;