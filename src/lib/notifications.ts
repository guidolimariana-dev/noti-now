
export async function sendEmail({
  to,
  subject,
  text,
  template,
  variables,
  apiKey,
  domain,
}: {
  to: string;
  subject: string;
  text?: string;
  template?: string;
  variables?: Record<string, any>;
  apiKey: string;
  domain: string;
}) {
  const auth = btoa(`api:${apiKey}`);
  const formData = new URLSearchParams();
  formData.append('from', `NotiNow <mailgun@${domain}>`);
  formData.append('to', to);
  formData.append('subject', subject);
  
  if (template) {
    formData.append('template', template);
    if (variables) {
      formData.append('t:variables', JSON.stringify(variables));
    }
  }

  if (text) {
    formData.append('text', text);
  }

  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mailgun error: ${error}`);
  }

  return response.json();
}

export async function sendWhatsApp({
  to,
  message,
  accountSid,
  authToken,
  from,
}: {
  to: string;
  message: string;
  accountSid: string;
  authToken: string;
  from: string;
}) {
  const auth = btoa(`${accountSid}:${authToken}`);
  const formData = new URLSearchParams();
  formData.append('To', `whatsapp:${to}`);
  formData.append('From', `whatsapp:${from}`);
  formData.append('Body', message);

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio error: ${error}`);
  }

  return response.json();
}
