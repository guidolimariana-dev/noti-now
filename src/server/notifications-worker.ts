import { getDb } from '../db';
import * as schema from '../db/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import { sendEmail, sendWhatsApp } from '../lib/notifications';

export interface Env {
  DB: D1Database;
  MAILGUN_API_KEY: string;
  MAILGUN_DOMAIN: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_WHATSAPP_NUMBER: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    try {
      // Create a dummy ScheduledEvent
      const dummyEvent: ScheduledEvent = {
        cron: "manual",
        scheduledTime: Date.now(),
        type: "scheduled",
      };
      await this.scheduled(dummyEvent, env, ctx);
      return new Response("Proceso de notificaciones ejecutado manualmente con éxito.", { status: 200 });
    } catch (error) {
      return new Response(`Error al ejecutar el proceso: ${error}`, { status: 500 });
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log("Iniciando proceso scheduled...");
    const db = getDb(env.DB);
    const now = new Date();
    const nowTimestamp = now.getTime();
    console.log(`Hora actual: ${now.toISOString()} (${nowTimestamp}ms)`);

    // 1. Fetch pending notifications that are scheduled
    const totalCount = await db.select({ count: sql<number>`count(*)` }).from(schema.recordatorio);
    console.log(`Total de recordatorios en la base de datos del worker: ${totalCount[0].count}`);

    const allPending = await db
      .select()
      .from(schema.recordatorio)
      .where(eq(schema.recordatorio.estado, 'Programado'));

    console.log(`Encontrados ${allPending.length} recordatorios en estado 'Programado'.`);

    // Filter manually to handle seconds vs milliseconds safely
    const pendingRecordatorios = allPending.filter(r => {
      let scheduledTime = r.envio_mensaje.getTime();
      // Heuristic: if timestamp is very small (before year 2000), it's probably in seconds
      if (scheduledTime < 1000000000000) {
        scheduledTime *= 1000;
      }
      const isReady = scheduledTime <= nowTimestamp;
      console.log(`Recordatorio ID ${r.id}: programado para ${new Date(scheduledTime).toISOString()} (${scheduledTime}ms). ¿Listo para enviar? ${isReady}`);
      return isReady;
    });

    console.log(`Procesando ${pendingRecordatorios.length} recordatorios listos para enviar.`);

    for (const recordatorio of pendingRecordatorios) {
      try {
        console.log(`Procesando recordatorio ID ${recordatorio.id}...`);
        // 2. Mark as 'Enviando' to prevent double processing
        await db
          .update(schema.recordatorio)
          .set({ estado: 'Enviando' })
          .where(eq(schema.recordatorio.id, recordatorio.id));

        // 3. Get clients associated with the route (recorrido)
        console.log(`Buscando clientes para el recorrido ${recordatorio.id_recorrido}...`);
        const allClients = await db
          .select()
          .from(schema.clientes)
          .where(eq(schema.clientes.numero_circuito, recordatorio.id_recorrido));

        console.log(`Encontrados ${allClients.length} clientes en total para este recorrido.`);

        // Filter clients based on the same logic as the frontend
        const recipients = allClients.filter(c => c.llamar_sn === 'S');
        console.log(`Filtrados ${recipients.length} destinatarios con llamar_sn === 'S'.`);

        const results = await Promise.allSettled(
          recipients.flatMap((cliente) => {
            console.log(`Preparando notificaciones para cliente: ${cliente.razon_social} (${cliente.email}, ${cliente.telefono})`);
            // Logic for dynamic greeting based on CUIT
            const cuitPrefix = cliente.cuit ? cliente.cuit.substring(0, 2) : '';
            let title = '';
            let displayName = cliente.razon_social;

            if (cuitPrefix === '20') {
              title = 'Sr.';
            } else if (cuitPrefix === '27') {
              title = 'Sra.';
            } else if (cuitPrefix === '23' || cuitPrefix === '24') {
              title = 'Sr./Sra.';
            } else if (['30', '33', '34'].includes(cuitPrefix)) {
              title = 'Sres.';
              displayName = cliente.nombre_fantasia;
            }

            // Personalization logic using placeholders
            let personalizedMessage = recordatorio.mensaje;
            const titlePlaceholder = '(Sr./Sra./Sres.)';
            const namePlaceholder = '(---)';
            const dayPlaceholder = '(L/M/M/J/V/S)';

            const hasTitlePlaceholder = personalizedMessage.includes(titlePlaceholder);
            const hasNamePlaceholder = personalizedMessage.includes(namePlaceholder);
            const hasDayPlaceholder = personalizedMessage.includes(dayPlaceholder);

            if (hasTitlePlaceholder || hasNamePlaceholder || hasDayPlaceholder) {
              if (hasTitlePlaceholder) {
                personalizedMessage = personalizedMessage.replace(titlePlaceholder, title || '');
              }
              if (hasNamePlaceholder) {
                personalizedMessage = personalizedMessage.replace(namePlaceholder, displayName);
              }
              if (hasDayPlaceholder && recordatorio.entrega_tentativa) {
                const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const deliveryDate = new Date(recordatorio.entrega_tentativa);
                const dayName = days[deliveryDate.getDay()];
                personalizedMessage = personalizedMessage.replace(dayPlaceholder, dayName);
              }
              // Clean up double spaces that might result from empty title replacement
              personalizedMessage = personalizedMessage.replace(/\s\s+/g, ' ').trim();
            } else {
              // Fallback: prepend full greeting if no placeholders are found
              const fullGreeting = title ? `${title} ${displayName}` : displayName;
              personalizedMessage = `${fullGreeting}: ${personalizedMessage}`;
            }

            const notifications = [];

            // Attempt to send via Email if address is present
            if (cliente.email && cliente.email.trim() !== '') {
              const fullGreeting = title ? `${title} ${displayName}` : displayName;
              notifications.push(sendEmail({
                to: cliente.email,
                subject: 'Recordatorio NotiNow',
                template: 'notinowtemplate',
                variables: {
                  cliente: fullGreeting.trim(),
                  mensaje: personalizedMessage,
                },
                text: personalizedMessage,
                apiKey: env.MAILGUN_API_KEY,
                domain: env.MAILGUN_DOMAIN,
              }).then(res => {
                console.log(`Email enviado con éxito a ${cliente.email}`);
                return res;
              }).catch(err => {
                console.error(`Error enviando email a ${cliente.email}:`, err);
                throw err;
              }));
            }

            // Attempt to send via WhatsApp if phone is present
            if (cliente.telefono && cliente.telefono.trim() !== '') {
              notifications.push(sendWhatsApp({
                to: cliente.telefono,
                message: personalizedMessage,
                accountSid: env.TWILIO_ACCOUNT_SID,
                authToken: env.TWILIO_AUTH_TOKEN,
                from: env.TWILIO_WHATSAPP_NUMBER,
              }).then(res => {
                console.log(`WhatsApp enviado con éxito a ${cliente.telefono}`);
                return res;
              }).catch(err => {
                console.error(`Error enviando WhatsApp a ${cliente.telefono}:`, err);
                throw err;
              }));
            }

            return notifications;
          })
        );

        // Check if any notification failed
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
          console.warn(`Hubo ${failures.length} fallos en el recordatorio ID ${recordatorio.id}.`);
        }

        // 4. Update status to 'Enviado'
        await db
          .update(schema.recordatorio)
          .set({ estado: 'Enviado' })
          .where(eq(schema.recordatorio.id, recordatorio.id));
          
        console.log(`Recordatorio ${recordatorio.id} marcado como 'Enviado'.`);
      } catch (error) {
        console.error(`Error procesando recordatorio ${recordatorio.id}:`, error);
        // Reset to 'Error' if failed
        await db
          .update(schema.recordatorio)
          .set({ estado: 'Error' })
          .where(eq(schema.recordatorio.id, recordatorio.id));
      }
    }
    console.log("Proceso scheduled finalizado.");
  },
};
