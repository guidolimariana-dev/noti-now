import { getDb } from '../db';
import * as schema from '../db/schema';
import { eq, and, lte } from 'drizzle-orm';
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
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const db = getDb(env.DB);
    const now = new Date();

    // 1. Fetch pending notifications that are scheduled and ready to be sent
    const pendingRecordatorios = await db
      .select()
      .from(schema.recordatorio)
      .where(
        and(
          eq(schema.recordatorio.estado, 'Programado'),
          lte(schema.recordatorio.envio_mensaje, now)
        )
      );

    for (const recordatorio of pendingRecordatorios) {
      try {
        // 2. Mark as 'Enviando' to prevent double processing
        await db
          .update(schema.recordatorio)
          .set({ estado: 'Enviando' })
          .where(eq(schema.recordatorio.id, recordatorio.id));

        // 3. Get clients associated with the route (recorrido)
        const allClients = await db
          .select()
          .from(schema.clientes)
          .where(eq(schema.clientes.numero_circuito, recordatorio.id_recorrido));

        // Filter clients based on the same logic as the frontend
        const recipients = allClients.filter(c => 
          c.llamar_sn === 'S' && 
          c.forma_contacto && 
          c.forma_contacto.trim() !== '' &&
          (c.forma_contacto.toLowerCase().includes('whatsapp') ? (c.telefono && c.telefono.trim() !== '') : true) &&
          (c.forma_contacto.toLowerCase().includes('mail') || c.forma_contacto.toLowerCase().includes('email') ? (c.email && c.email.trim() !== '') : true)
        );

        const results = await Promise.allSettled(
          recipients.map(async (cliente) => {
            const forma = cliente.forma_contacto.toLowerCase();
            
            if ((forma.includes('mail') || forma.includes('email')) && cliente.email) {
              return sendEmail({
                to: cliente.email,
                subject: 'Recordatorio NotiNow',
                text: recordatorio.mensaje,
                apiKey: env.MAILGUN_API_KEY,
                domain: env.MAILGUN_DOMAIN,
              });
            } else if (forma.includes('whatsapp') && cliente.telefono) {
              // Ensure phone number has international format for Twilio if needed, 
              // or assume it's already stored correctly.
              return sendWhatsApp({
                to: cliente.telefono,
                message: recordatorio.mensaje,
                accountSid: env.TWILIO_ACCOUNT_SID,
                authToken: env.TWILIO_AUTH_TOKEN,
                from: env.TWILIO_WHATSAPP_NUMBER,
              });
            }
          })
        );

        // 4. Update status to 'Enviado'
        await db
          .update(schema.recordatorio)
          .set({ estado: 'Enviado' })
          .where(eq(schema.recordatorio.id, recordatorio.id));
          
        console.log(`Recordatorio ${recordatorio.id} sent to ${recipients.length} clients.`);
      } catch (error) {
        console.error(`Error processing recordatorio ${recordatorio.id}:`, error);
        // Reset to 'Programado' if failed, so it can be retried (optional)
        await db
          .update(schema.recordatorio)
          .set({ estado: 'Error' })
          .where(eq(schema.recordatorio.id, recordatorio.id));
      }
    }
  },
};
