CREATE TABLE `clientes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`codigo` integer NOT NULL,
	`razon_social` text NOT NULL,
	`nombre_fantasia` text NOT NULL,
	`cuit` text NOT NULL,
	`telefono` text NOT NULL,
	`email` text NOT NULL,
	`numero_circuito` integer NOT NULL,
	`llamar_sn` text NOT NULL,
	`forma_contacto` text NOT NULL,
	FOREIGN KEY (`numero_circuito`) REFERENCES `recorrido`(`codigo`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recorrido_codigo_unique` ON `recorrido` (`codigo`);