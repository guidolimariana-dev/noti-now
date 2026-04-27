CREATE TABLE `recordatorio` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fecha_envio` integer NOT NULL,
	`fecha_limite` integer NOT NULL,
	`id_recorrido` integer NOT NULL,
	`estado` text NOT NULL,
	FOREIGN KEY (`id_recorrido`) REFERENCES `recorrido`(`id`) ON UPDATE no action ON DELETE no action
);
