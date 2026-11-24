/**
 * Google Sheet Webhook Sync Service
 * Connects to Google Apps Script deployed endpoint
 */

const postToGoogleSheet = async (payload) => {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) return null;

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return data;
    }
  } catch (err) {
    console.warn('[Google Sheets Sync] Webhook dispatch notice:', err.message);
  }
  return null;
};

module.exports = {
  postToGoogleSheet,
};
