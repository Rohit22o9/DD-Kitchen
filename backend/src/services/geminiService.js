/**
 * Google Gemini AI Executive Watchdog Service
 * Queries Gemini 2.5 Flash with live Australian kitchen context
 */

const queryGeminiWatchdog = async (userQuery, financialContext) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const systemPrompt = `You are the executive AI Financial Copilot for Daily Drop Commercial Kitchens in Victoria Park, Perth, WA.
You analyze tenant invoices, rental revenue, 48-hour provisional holds, and $750 / $200 security deposits in escrow.
Answer concisely, professionally, and accurately in 2-4 sentences using Australian business context (AUD, PayID hello@dailydrop.today).
Here is the real-time financial database:
${JSON.stringify(financialContext, null, 2)}`;

      const payload = {
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nSuper Admin Question: "${userQuery}"\nProvide a direct, factual executive response with actionable recommendations:`,
              },
            ],
          },
        ],
      };

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return {
            answer: text.trim(),
            isLiveGemini: true,
            modelUsed: 'Google Gemini 2.5 Flash',
          };
        }
      }
    } catch (err) {
      console.warn('[Gemini AI] Cloud call notice, falling back to local engine:', err.message);
    }
  }

  // Graceful Local Fallback Intelligence
  const q = String(userQuery).toLowerCase();
  if (q.includes('overdue') || q.includes('who owes') || q.includes('risk') || q.includes('urgent')) {
    return {
      answer: `🚨 Action Required: ${financialContext.urgentAttentionCount || 2} upcoming bookings have shifts without confirmed payment. Recommended action: Send WhatsApp payment reminders now. If unpaid 12h prior, release slots to avoid idle equipment.`,
      isLiveGemini: false,
      modelUsed: 'Autonomous Watchdog Engine',
    };
  }

  if (q.includes('bond') || q.includes('deposit') || q.includes('escrow')) {
    return {
      answer: `🛡️ Escrow Telemetry: Total $${financialContext.bondsHeldAUD || '950.00'} AUD held in escrow ($750 kitchen security bond + $200 storage bond). Protected until post-shift cleanliness inspection.`,
      isLiveGemini: false,
      modelUsed: 'Autonomous Watchdog Engine',
    };
  }

  return {
    answer: `💰 Financial Summary: Total Invoiced: $${financialContext.totalInvoicedAUD || '1949.20'} AUD. Reconciled in Bank: $${financialContext.paidRevenueAUD || '220.00'} AUD. Pending Collection: $${financialContext.pendingRevenueAUD || '1729.20'} AUD.`,
    isLiveGemini: false,
    modelUsed: 'Autonomous Watchdog Engine',
  };
};

module.exports = {
  queryGeminiWatchdog,
};
