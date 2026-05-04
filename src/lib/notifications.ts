
export async function sendEmail({
  to,
  subject,
  text,
  apiKey,
  domain,
}: {
  to: string;
  subject: string;
  text: string;
  apiKey: string;
  domain: string;
}) {
  const auth = btoa(`api:${apiKey}`);
  const formData = new URLSearchParams();
  formData.append('from', `NotiNow <mailgun@${domain}>`);
  formData.append('to', to);
  formData.append('subject', subject);
  formData.append('text', text);

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
