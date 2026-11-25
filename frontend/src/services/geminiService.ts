/**
 * The finance assistant runs on the server (super admin only). The browser
 * never holds a Gemini API key any more.
 */
import { api } from './api';
import type { Invoice } from '../types';

export interface GeminiResponse {
  answer: string;
  isLiveGemini: boolean;
  modelUsed?: string;
  errorNote?: string;
}

export const geminiService = {
  async queryInvoiceCopilot(userQuery: string, _invoices?: Invoice[]): Promise<GeminiResponse> {
    return api.askFinanceAssistant(userQuery);
  },
};
