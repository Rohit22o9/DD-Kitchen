/**
 * Google Sheet Webhook Sync Service
 * Connects to Google Apps Script deployed endpoint with timeout & shared secret
 */

const postToGoogleSheet = async (payload) => {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const bodyPayload = {
      ...payload,
      secret: process.env.GOOGLE_SHEET_WEBHOOK_SECRET || undefined,
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return data;
    }
  } catch (err) {
    console.warn('[Google Sheets Sync] Webhook dispatch notice:', err.name === 'AbortError' ? 'Timed out (5s)' : err.message);
  } finally {
    clearTimeout(timeout);
  }
  return null;
};

module.exports = {
  postToGoogleSheet,
};
