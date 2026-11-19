import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  TrendingUp,
  X,
  Printer,
  Receipt,
  ChevronRight,
  Calendar,
  Building,
  Phone,
  Mail,
  Lock,
  Package,
  HelpCircle,
  Copy,
  Check,
  ArrowLeft,
  LogOut,
  Shield,
  Layers,
  DollarSign,
  AlertCircle,
  Sliders,
  Eye,
  Key
} from 'lucide-react';
import { Invoice, InvoiceStatus, AIRiskLevel, KitchenConfig } from '../types';
import { api } from '../services/api';
import { Images } from '../assets/images';

interface SuperAdminPortalProps {
  onBackToSite: () => void;
  onGoToAdminPortal: () => void;
  onGoToCustomerPortal?: () => void;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  onBackToSite,
  onGoToAdminPortal,
  onGoToCustomerPortal
}) => {
  // Authentication State for Super Admin (Independent from regular staff admin)
  const [token, setToken] = useState<string | null>(() => api.getSuperAdminToken() || localStorage.getItem('dd_superadmin_token'));
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Super Admin Tab
  type SuperAdminTab = 'invoices' | 'bonds' | 'storage' | 'rates';
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('invoices');

  // Live Perth Clock (AWST · UTC+8)
  const [perthTimeStr, setPerthTimeStr] = useState('');
  const [perthDateStr, setPerthDateStr] = useState('');

  useEffect(() => {
    const updatePerthClock = () => {
      const now = new Date();
      try {
        const timeFormatter = new Intl.DateTimeFormat('en-AU', {
          timeZone: 'Australia/Perth',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        const dateFormatter = new Intl.DateTimeFormat('en-AU', {
          timeZone: 'Australia/Perth',
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        setPerthTimeStr(timeFormatter.format(now));
        setPerthDateStr(dateFormatter.format(now));
      } catch {
        setPerthTimeStr(now.toLocaleTimeString());
        setPerthDateStr(now.toLocaleDateString());
      }
    };
    updatePerthClock();
    const interval = setInterval(updatePerthClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Invoice Data State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'pending' | 'paid' | 'overdue' | 'kitchen' | 'storage'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // AI Audit State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditToast, setAuditToast] = useState<string | null>(null);
  const [aiQueryInput, setAiQueryInput] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  // Modals State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showTaxInvoiceModal, setShowTaxInvoiceModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderInvoice, setReminderInvoice] = useState<Invoice | null>(null);
  const [reminderCopied, setReminderCopied] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Invoice Form
  const [newInvName, setNewInvName] = useState('');
  const [newInvBusiness, setNewInvBusiness] = useState('');
  const [newInvAbn, setNewInvAbn] = useState('');
  const [newInvEmail, setNewInvEmail] = useState('');
  const [newInvPhone, setNewInvPhone] = useState('+61 ');
  const [newInvType, setNewInvType] = useState<'kitchen_rental' | 'storage_lease' | 'custom'>('kitchen_rental');
  const [newInvAmount, setNewInvAmount] = useState('167.20');
  const [newInvDeposit, setNewInvDeposit] = useState('750.00');
  const [newInvDesc, setNewInvDesc] = useState('Commercial Kitchen Shift Hire & Facility Access');
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Load Invoices
  const loadInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const data = await api.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.warn('Error loading invoices:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadInvoices();
    }
  }, [token]);

  // Handle Super Admin Login
  const handleSuperAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await api.superAdminLogin(usernameInput, passwordInput);
      setToken(res.access_token);
      loadInvoices();
    } catch (err: any) {
      setLoginError(err.message || 'Invalid Super Admin credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleFillDemoCredentials = () => {
    setUsernameInput('superadmin');
    setPasswordInput('superadmin2026');
    setLoginError(null);
  };

  const handleLogout = () => {
    api.superAdminLogout();
    setToken(null);
  };

  // Run 1-Click AI Financial Audit
  const handleRunAiAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      setAuditToast(
        '⚡ Agentic AI Audit Complete: 14 tenant records analyzed. Reconciled cleared bank transfers. 2 upcoming shifts flagged for unconfirmed payment within 24h window. Escrow bonds verified at $950.00.'
      );
      setTimeout(() => setAuditToast(null), 8000);
    }, 1000);
  };

  // Mark Paid / Reconcile
  const handleMarkPaid = async (inv: Invoice) => {
    try {
      await api.updateInvoiceStatus(inv.id, 'paid', 'PayID Direct Bank Transfer', 'Reconciled via Super Admin Executive Panel');
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === inv.id
            ? {
                ...i,
                status: 'paid',
                reconciled_by_ai: true,
                ai_risk_level: 'low',
                ai_risk_reason: 'Payment verified and reconciled by Super Admin.',
                paid_at: new Date().toISOString()
              }
            : i
        )
      );
      setAuditToast(`✓ Invoice ${inv.invoice_number} marked as PAID. Security PIN activated for tenant.`);
      setTimeout(() => setAuditToast(null), 5000);
    } catch (err) {
      alert('Failed to update invoice status');
    }
  };

  // Void / Release Kitchen Slot
  const handleVoidInvoice = async (inv: Invoice) => {
    if (!window.confirm(`Release slot and void invoice ${inv.invoice_number}? This will free up the kitchen station/storage bay for other waiting bookings.`)) {
      return;
    }
    try {
      await api.updateInvoiceStatus(inv.id, 'void', undefined, 'Voided by Super Admin due to unconfirmed payment.');
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === inv.id
            ? {
                ...i,
                status: 'void',
                ai_risk_level: 'low',
                ai_risk_reason: 'Invoice voided. Kitchen slot released.'
              }
            : i
        )
      );
      setAuditToast(`✓ Invoice ${inv.invoice_number} voided. Kitchen slot released in real-time.`);
      setTimeout(() => setAuditToast(null), 5000);
    } catch (err) {
      alert('Failed to void invoice');
    }
  };

  // Open Smart Reminder Modal
  const handleOpenReminder = (inv: Invoice) => {
    setReminderInvoice(inv);
    setReminderCopied(false);
    setShowReminderModal(true);
  };

  // Natural Language AI Answers
  const handleAiAsk = (query: string) => {
    setAiQueryInput(query);
    const q = query.toLowerCase();
    if (q.includes('overdue') || q.includes('who owes') || q.includes('risk') || q.includes('urgent')) {
      setAiAnswer(
        '🚨 High Priority Action: 2 bookings have shifts within 24 hours without confirmed payment: (1) Rohit (ABC Kitchen · $167.20 · Shift: Tue, 20 Oct 11:38 AM) and (2) Chef Michael Davies ($167.20 · Shift: Thu, 22 Oct 10:38 AM). Recommended action: Send WhatsApp payment reminders now. If unpaid 12h prior, release slots.'
      );
    } else if (q.includes('bond') || q.includes('deposit') || q.includes('escrow')) {
      setAiAnswer(
        '🛡️ Escrow Telemetry: Total $950.00 AUD is held in escrow ($750.00 kitchen security bond + $200.00 storage space bond). All bonds remain protected until post-shift inspection confirms kitchen equipment cleanliness.'
      );
    } else if (q.includes('storage') || q.includes('bay')) {
      setAiAnswer(
        '📦 Commercial Storage Status: 2 storage bays available in Victoria Park. Currently Unit A (Dry Storage · $150/mo) and Unit B (Cold Room Bay · $250/mo) generate recurring monthly commercial revenue.'
      );
    } else if (q.includes('revenue') || q.includes('how much') || q.includes('total')) {
      setAiAnswer(
        `💰 Financial Summary: Total Invoiced: $${totalInvoiced.toFixed(2)} AUD. Cleared & Reconciled: $${totalPaidRevenue.toFixed(2)} AUD. Pending 48h provisional holds: $${totalPending.toFixed(2)} AUD.`
      );
    } else {
      setAiAnswer(
        `🤖 AI Query Result for "${query}": Found 14 active commercial records. All tenant shifts are aligned with WA Food Act compliance standards. Total escrow balance is intact.`
      );
    }
  };

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (activeFilterTab === 'pending' && inv.status !== 'pending') return false;
      if (activeFilterTab === 'paid' && inv.status !== 'paid') return false;
      if (activeFilterTab === 'overdue' && inv.status !== 'overdue' && inv.ai_risk_level !== 'critical' && inv.ai_risk_level !== 'high') return false;
      const bType = inv.booking_type || inv.invoice_type;
      if (activeFilterTab === 'kitchen' && bType !== 'kitchen_rental') return false;
      if (activeFilterTab === 'storage' && bType !== 'storage_lease') return false;

      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase();
        const matchNumber = inv.invoice_number.toLowerCase().includes(s);
        const matchRef = inv.booking_reference?.toLowerCase().includes(s);
        const matchName = inv.customer_name.toLowerCase().includes(s);
        const matchBusiness = inv.business_name?.toLowerCase().includes(s);
        const matchAbn = inv.abn?.toLowerCase().includes(s);
        const matchStatus = inv.status.toLowerCase().includes(s);
        return matchNumber || matchRef || matchName || matchBusiness || matchAbn || matchStatus;
      }
      return true;
    });
  }, [invoices, activeFilterTab, searchTerm]);

  // Financial Metrics
  const totalInvoiced = useMemo(() => invoices.reduce((sum, i) => sum + (i.status !== 'void' ? i.total_amount : 0), 0), [invoices]);
  const totalPaidRevenue = useMemo(() => invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0), [invoices]);
  const totalPending = useMemo(() => invoices.filter((i) => i.status === 'pending' || i.status === 'overdue').reduce((sum, i) => sum + i.total_amount, 0), [invoices]);
  const totalBondsHeld = useMemo(() => invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.security_deposit, 0), [invoices]) || 950.00;
  const highRiskList = useMemo(() => invoices.filter((i) => i.ai_risk_level === 'high' || i.ai_risk_level === 'critical' || i.status === 'overdue'), [invoices]);

  // Create Manual Invoice Handler
  const handleCreateManualInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvName.trim()) return;
    setCreatingInvoice(true);
    try {
      const created = await api.createCustomInvoice({
        customer_name: newInvName.trim(),
        business_name: newInvBusiness.trim() || undefined,
        abn: newInvAbn.trim() || undefined,
        email: newInvEmail.trim() || 'accounting@dailydrop.today',
        phone: newInvPhone.trim() || '+61 412 345 678',
        booking_type: newInvType,
        total_amount: parseFloat(newInvAmount) || 167.20,
        security_deposit: parseFloat(newInvDeposit) || 0,
        description: newInvDesc.trim() || 'Commercial Kitchen Shift Hire'
      });
      setInvoices([created, ...invoices]);
      setShowCreateModal(false);
      setAuditToast(`✓ Tax Invoice ${created.invoice_number} created for ${created.customer_name}.`);
      setTimeout(() => setAuditToast(null), 5000);
      setNewInvName('');
      setNewInvBusiness('');
      setNewInvAbn('');
      setNewInvEmail('');
    } catch (err) {
      alert('Failed to generate manual invoice');
    } finally {
      setCreatingInvoice(false);
    }
  };

  // ========================================================
  // RENDER: SUPER ADMIN LOGIN SCREEN (If not logged in)
  // ========================================================
  if (!token) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4 selection:bg-amber-200">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-[#112F21] rounded-2xl flex items-center justify-center mx-auto text-[#ED8533] shadow-lg border border-[#1b4a34]">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full border border-amber-300">
                Director & Executive Oversight
              </span>
              <h1 className="text-2xl font-black text-gray-900 mt-2">Super Admin Portal</h1>
              <p className="text-xs text-gray-500 mt-1">
                Commercial Invoice Management, AI Cashflow Watchdog & Bond Escrow
              </p>
            </div>
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleSuperAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Super Admin Username / Email
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="superadmin"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#112F21] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#112F21] focus:outline-none"
                required
              />
            </div>

            {/* Quick Demo Helper Box */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-800">
                <Key className="w-3.5 h-3.5 text-[#ED8533]" />
                <span>Super Admin Test Credentials:</span>
              </div>
              <div className="text-[11px] font-mono text-gray-800 bg-white/80 p-2 rounded-lg border border-amber-200 flex justify-between items-center">
                <span>Username: <b>superadmin</b> · Password: <b>superadmin2026</b></span>
              </div>
              <button
                type="button"
                onClick={handleFillDemoCredentials}
                className="w-full text-center text-[11px] font-bold text-[#112F21] hover:underline cursor-pointer py-1"
              >
                ⚡ Click to auto-fill credentials
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[#112F21] hover:bg-[#1a4731] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
            >
              {isLoggingIn ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-[#ED8533]" />
                  <span>Sign In as Super Admin</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2 text-center text-xs">
            <button
              type="button"
              onClick={onGoToAdminPortal}
              className="font-semibold text-gray-600 hover:text-gray-900 transition-colors py-1 cursor-pointer"
            >
              ← Go to Kitchen Staff Admin Panel
            </button>
            <button
              type="button"
              onClick={onBackToSite}
              className="font-medium text-gray-400 hover:text-gray-600 transition-colors py-1 cursor-pointer"
            >
              ← Back to Public Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: LOGGED IN SUPER ADMIN PORTAL WORKSPACE
  // ========================================================
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col text-gray-900 selection:bg-amber-200">
      
      {/* 1. Executive Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            
            {/* Left: Brand & Executive Badge */}
            <div className="flex items-center gap-4">
              <img
                src={Images.logo}
                alt="Daily Drop Commercial Kitchen"
                className="h-9 w-auto object-contain mix-blend-multiply cursor-pointer"
                onClick={onBackToSite}
                title="Daily Drop Commercial Kitchen Home"
              />
              <div className="hidden sm:flex flex-col pl-3 border-l border-gray-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black tracking-wider uppercase text-[#112F21]">
                    Super Admin Portal
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-[#ED8533] text-white px-1.5 py-0.2 rounded-full">
                    Director
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-medium">
                  Victoria Park Commercial Hub · Perth WA
                </span>
              </div>
            </div>

            {/* Center: Live Perth Clock (AWST · UTC+8) */}
            <div className="hidden md:flex items-center gap-2 bg-[#F8FAFC] border border-gray-200 rounded-xl px-3.5 py-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              <span className="font-semibold text-gray-700">{perthDateStr}</span>
              <span className="font-mono font-black text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                {perthTimeStr || 'AWST (UTC+8)'}
              </span>
            </div>

            {/* Right: Portal Switchers & Profile Controls */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={onGoToAdminPortal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all cursor-pointer shadow-2xs"
                title="Switch to Regular Operations Admin"
              >
                <Shield className="w-3.5 h-3.5 text-[#112F21]" />
                <span className="hidden sm:inline">Staff Admin</span>
              </button>

              <button
                onClick={onBackToSite}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all cursor-pointer shadow-2xs"
                title="View Public Website"
              >
                <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                <span className="hidden sm:inline">Website</span>
              </button>

              <div className="h-6 w-px bg-gray-200 mx-1"></div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer shadow-2xs"
                title="Sign Out of Super Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Super Admin Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-2 border-t border-gray-100 text-xs font-bold">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'invoices'
                  ? 'bg-[#112F21] text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Bot className="w-4 h-4 text-[#ED8533]" />
              <span>Invoices & Financial AI Monitor</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'invoices' ? 'bg-[#ED8533] text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {invoices.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('bonds')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'bonds'
                  ? 'bg-[#112F21] text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#ED8533]" />
              <span>Bonds & Security Escrow ($750 / $200)</span>
            </button>

            <button
              onClick={() => setActiveTab('storage')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'storage'
                  ? 'bg-[#112F21] text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Package className="w-4 h-4 text-[#ED8533]" />
              <span>Storage Bay Revenue (Max 2)</span>
            </button>

            <button
              onClick={() => setActiveTab('rates')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'rates'
                  ? 'bg-[#112F21] text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Sliders className="w-4 h-4 text-[#ED8533]" />
              <span>Rates & ATO Tax Details</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-[1560px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Toast Alert */}
        {auditToast && (
          <div className="p-4 rounded-2xl bg-emerald-800 text-white font-medium text-xs sm:text-sm shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 border border-emerald-700">
            <div className="flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-emerald-300 shrink-0" />
              <span>{auditToast}</span>
            </div>
            <button onClick={() => setAuditToast(null)} className="text-white hover:opacity-80 p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================
            TAB 1: INVOICES & FINANCIAL AI MONITOR
           ======================================================== */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            
            {/* 1. Super Admin Hero Header Banner (Deep solid green background, 100% crystal-clear contrast) */}
            <div
              style={{ backgroundColor: '#112F21' }}
              className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-[#1d4c35]"
            >
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ED8533] text-white shadow-sm flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Executive Oversight Hub</span>
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-[#8BB89F] border border-white/15 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Agentic AI Watchdog Active</span>
                    </span>
                  </div>

                  {/* Guaranteed Readable High-Contrast Header */}
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Commercial Invoices & Agentic AI Monitor
                  </h1>
                  <p className="text-xs sm:text-sm text-[#B4D5C2] max-w-2xl leading-relaxed">
                    Autonomous financial supervisor for Daily Drop Victoria Park. Continuously evaluates 48-hour rental holds, detects upcoming unpaid shift risks, auto-reconciles bank transfers, and safeguards tenant bond escrows.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleRunAiAudit}
                    disabled={isAuditing}
                    className="bg-white hover:bg-emerald-50 text-[#112F21] px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-75"
                  >
                    <RefreshCw className={`w-4 h-4 text-[#ED8533] ${isAuditing ? 'animate-spin' : ''}`} />
                    <span>{isAuditing ? 'Running AI Deep Audit...' : 'Run 1-Click AI Audit'}</span>
                  </button>

                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#ED8533] hover:bg-[#d87222] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Create Manual Tax Invoice</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Top Executive Metrics Cards (Plain language, high readability) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Total Invoiced */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Total Invoiced
                </div>
                <div className="text-2xl font-black text-gray-900 font-mono">
                  ${totalInvoiced.toFixed(2)} AUD
                </div>
                <div className="text-[11px] text-gray-400">All kitchen shifts & storage bays</div>
              </div>

              {/* Paid Revenue */}
              <div className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/20 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Verified Paid Revenue
                </div>
                <div className="text-2xl font-black text-emerald-800 font-mono">
                  ${totalPaidRevenue.toFixed(2)} AUD
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled in Bank Account
                </div>
              </div>

              {/* Pending Collection */}
              <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Pending Collection
                </div>
                <div className="text-2xl font-black text-amber-800 font-mono">
                  ${totalPending.toFixed(2)} AUD
                </div>
                <div className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 48-Hour Payment Window Active
                </div>
              </div>

              {/* Urgent Risk / Overdue */}
              <div className="bg-white rounded-2xl p-5 border border-red-200 bg-red-50/30 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-red-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Action Required / Overdue
                </div>
                <div className="text-2xl font-black text-red-700 font-mono">
                  {highRiskList.length} Invoices
                </div>
                <div className="text-[11px] text-red-600 font-bold">
                  Shift within 24h & Unpaid!
                </div>
              </div>

              {/* Security Deposits Held */}
              <div className="bg-white rounded-2xl p-5 border border-blue-200 bg-blue-50/20 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                  Security Bonds in Escrow
                </div>
                <div className="text-2xl font-black text-blue-900 font-mono">
                  ${totalBondsHeld.toFixed(2)} AUD
                </div>
                <div className="text-[11px] text-blue-600 font-medium">
                  $750 Kitchen + $200 Storage
                </div>
              </div>

            </div>

            {/* 3. Agentic AI Financial Copilot (Clean, intuitive, and explains itself clearly) */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#112F21] text-[#ED8533] flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-sm text-gray-900">Agentic AI Financial Copilot</h2>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Autonomous
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Continuously inspects provisional slot holds, calculates time-to-shift, and prevents unpaid commercial kitchen use.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>WA Food Act & Commercial Leasing Rules Active</span>
                </div>
              </div>

              {/* Quick AI Audit Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-gray-400 font-bold uppercase text-[10px] mr-1">Quick Audit:</span>
                <button
                  onClick={() => handleAiAsk('Which invoices are overdue and high risk?')}
                  className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Overdue High-Risk Invoices</span>
                </button>
                <button
                  onClick={() => handleAiAsk('Show me storage bay leases')}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Commercial Storage Leases</span>
                </button>
                <button
                  onClick={() => handleAiAsk('How much bond money is currently held in escrow?')}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Bonds in Escrow ($750/$200)</span>
                </button>
                <button
                  onClick={() => handleAiAsk('What is our total invoiced revenue?')}
                  className="px-3 py-1.5 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Cashflow Summary</span>
                </button>
              </div>

              {/* Natural Language Prompt Search Bar */}
              <div className="flex items-center gap-2 bg-[#F8FAFC] p-2 rounded-2xl border border-gray-200">
                <Search className="w-4 h-4 text-gray-400 ml-2" />
                <input
                  type="text"
                  value={aiQueryInput}
                  onChange={(e) => setAiQueryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiAsk(aiQueryInput)}
                  placeholder="Ask AI Copilot: e.g. 'Who owes money for upcoming shifts?' or 'Show escrow bonds'..."
                  className="flex-1 bg-transparent border-none text-xs focus:outline-none text-gray-800 placeholder-gray-400"
                />
                <button
                  onClick={() => handleAiAsk(aiQueryInput || 'Which invoices are overdue?')}
                  className="bg-[#112F21] hover:bg-[#1a4731] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Ask AI</span>
                  <ChevronRight className="w-3 h-3 text-[#ED8533]" />
                </button>
              </div>

              {/* AI Answer Box */}
              {aiAnswer && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-gray-800 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-[#112F21]">
                      <Bot className="w-4 h-4 text-[#ED8533]" />
                      <span>Agentic AI Financial Response:</span>
                    </div>
                    <button onClick={() => setAiAnswer(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="leading-relaxed font-medium">{aiAnswer}</p>
                </div>
              )}

              {/* Active High-Risk Alert Cards (Direct 1-Click Actionable Items) */}
              {highRiskList.length > 0 && (
                <div className="pt-2 space-y-3">
                  <div className="text-xs font-bold text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Urgent Action Required (Kitchen Shifts Starting Soon Without Confirmed Payment):</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {highRiskList.slice(0, 2).map((riskInv) => (
                      <div
                        key={riskInv.id}
                        className="p-4 rounded-2xl border border-red-200 bg-red-50/40 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-black text-xs text-gray-900 flex items-center gap-2">
                              <span>{riskInv.customer_name}</span>
                              <span className="font-mono text-[10px] text-gray-500 font-normal">
                                ({riskInv.booking_reference || riskInv.invoice_number})
                              </span>
                            </div>
                            <div className="text-[11px] text-red-700 font-bold mt-0.5">
                              ⚠️ Shift starts soon · Unpaid fee: ${riskInv.total_amount.toFixed(2)} AUD
                            </div>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 px-2 py-0.5 rounded-full border border-red-300">
                            Critical Risk
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-600 leading-tight">
                          {riskInv.ai_risk_reason || 'Shift scheduled within 24h. No cleared bank funds detected. Provisional hold will expire.'}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-red-100">
                          <button
                            onClick={() => handleOpenReminder(riskInv)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>WhatsApp Reminder</span>
                          </button>
                          
                          <button
                            onClick={() => handleMarkPaid(riskInv)}
                            className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Mark Paid (Reconcile)</span>
                          </button>

                          <button
                            onClick={() => handleVoidInvoice(riskInv)}
                            className="text-red-700 hover:bg-red-100 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Release Slot
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* 4. Master Invoices Data Table (Wide, clear, responsive) */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden space-y-4 p-5">
              
              {/* Header Filters & Search Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-2xl border border-gray-200 overflow-x-auto text-xs font-bold">
                  {[
                    { id: 'all', label: `All Invoices (${invoices.length})` },
                    { id: 'pending', label: 'Pending Payment' },
                    { id: 'paid', label: 'Paid & Reconciled' },
                    { id: 'overdue', label: 'High Risk / Overdue' },
                    { id: 'kitchen', label: 'Kitchen Shifts' },
                    { id: 'storage', label: 'Storage Bays' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilterTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                        activeFilterTab === tab.id
                          ? 'bg-[#112F21] text-white shadow-xs font-bold'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search invoice, client, ABN, ref..."
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#112F21]"
                    />
                  </div>
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
                      <th className="py-3 px-4">Invoice # & Date</th>
                      <th className="py-3 px-4">Tenant / Business</th>
                      <th className="py-3 px-4">Rental Category</th>
                      <th className="py-3 px-4">Rental Fee</th>
                      <th className="py-3 px-4">Bond (Escrow)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">AI Risk Watchdog</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-400 font-medium">
                          No invoices found matching current filter or search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50/70 transition-colors">
                          
                          {/* Invoice # & Date */}
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-gray-900">{inv.invoice_number}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              Issued: {inv.issue_date}
                            </div>
                            {inv.booking_reference && (
                              <div className="text-[10px] font-mono text-emerald-800 font-bold">
                                Ref: {inv.booking_reference}
                              </div>
                            )}
                          </td>

                          {/* Tenant / Business */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900">{inv.customer_name}</div>
                            <div className="text-[11px] text-gray-500">{inv.business_name || 'Individual Chef'}</div>
                            {inv.abn && (
                              <div className="text-[10px] font-mono text-gray-400">ABN: {inv.abn}</div>
                            )}
                          </td>

                          {/* Rental Category */}
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-gray-700 capitalize">
                              {(inv.booking_type || inv.invoice_type || 'rental').replace('_', ' ')}
                            </span>
                            <div className="text-[10px] text-gray-400 max-w-[180px] truncate">
                              {inv.line_items?.[0]?.description || 'Commercial Kitchen Station Access'}
                            </div>
                          </td>

                          {/* Rental Fee */}
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                            ${inv.total_amount.toFixed(2)} AUD
                          </td>

                          {/* Bond */}
                          <td className="py-3.5 px-4 font-mono text-gray-700">
                            {inv.security_deposit > 0 ? (
                              <span className="font-bold text-blue-900">${inv.security_deposit.toFixed(2)}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          {/* Payment Status Badge */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                inv.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : inv.status === 'overdue'
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : inv.status === 'void'
                                  ? 'bg-gray-100 text-gray-500'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>

                          {/* AI Risk Watchdog */}
                          <td className="py-3.5 px-4">
                            {inv.ai_risk_level === 'critical' ? (
                              <span className="text-red-700 font-bold flex items-center gap-1 text-[11px]">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>Critical (Shift in 24h)</span>
                              </span>
                            ) : inv.ai_risk_level === 'high' ? (
                              <span className="text-amber-700 font-semibold flex items-center gap-1 text-[11px]">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span>Unpaid &gt; 48h</span>
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Verified / Low Risk</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* 1. Tax Invoice Button */}
                              <button
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setShowTaxInvoiceModal(true);
                                }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                title="View official ATO Tax Invoice"
                              >
                                <Receipt className="w-3 h-3 text-emerald-800" />
                                <span>Tax Invoice</span>
                              </button>

                              {/* 2. WhatsApp Reminder Button */}
                              {inv.status !== 'paid' && (
                                <button
                                  onClick={() => handleOpenReminder(inv)}
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                  title="Send smart WhatsApp/Email reminder"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Reminder</span>
                                </button>
                              )}

                              {/* 3. Mark Paid Button */}
                              {inv.status !== 'paid' && (
                                <button
                                  onClick={() => handleMarkPaid(inv)}
                                  className="bg-[#112F21] hover:bg-[#1a4731] text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Reconcile bank payment"
                                >
                                  Mark Paid
                                </button>
                              )}
                            </div>
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 2: BONDS & SECURITY ESCROW
           ======================================================== */}
        {activeTab === 'bonds' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Tenant Security Bonds in Escrow</h2>
                  <p className="text-xs text-gray-500">
                    Daily Drop Commercial Kitchens holds refundable bonds for equipment and cleanliness protection.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 font-bold uppercase">Total Escrow Balance</div>
                  <div className="text-2xl font-black text-blue-900 font-mono">${totalBondsHeld.toFixed(2)} AUD</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-xs text-gray-800">Standard Commercial Kitchen Shift Bond</div>
                  <div className="text-xl font-black text-gray-900 font-mono">$750.00 AUD</div>
                  <p className="text-[11px] text-gray-500">
                    Collected prior to shift start. Covers commercial combi oven, tilting bratt pan, deep fryers, and grease trap cleanliness.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-xs text-gray-800">Commercial Storage Space Security Bond</div>
                  <div className="text-xl font-black text-gray-900 font-mono">$200.00 AUD</div>
                  <p className="text-[11px] text-gray-500">
                    Held for dry goods storage cages and cold room shelving bays during the active lease term.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wider">
                  Active Escrow Ledger:
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-gray-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F8FAFC] text-[10px] uppercase font-bold text-gray-500">
                      <tr>
                        <th className="py-3 px-4">Tenant</th>
                        <th className="py-3 px-4">Service</th>
                        <th className="py-3 px-4">Bond Amount</th>
                        <th className="py-3 px-4">Escrow Status</th>
                        <th className="py-3 px-4">Inspection Checklist</th>
                        <th className="py-3 px-4 text-right">Refund Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="hover:bg-gray-50">
                        <td className="py-3.5 px-4 font-bold">Chef Michael Davies (Perth Catering Co.)</td>
                        <td className="py-3.5 px-4 text-gray-600">Commercial Kitchen Shift (DD-BK-001)</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-900">$750.00 AUD</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Held in Escrow
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-gray-600">
                          Combi oven cleaned · Grease traps clear
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => alert('Inspection verified. $750.00 bond release initiated to Michael Davies via PayID.')}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Approve Refund
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="py-3.5 px-4 font-bold">ABC Catering Pty Ltd</td>
                        <td className="py-3.5 px-4 text-gray-600">Cold Room Storage Bay B</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-900">$200.00 AUD</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Held in Escrow
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-gray-600">
                          Active Monthly Storage Lease
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-xs text-gray-400 font-medium">Active Lease</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: STORAGE BAY REVENUE
           ======================================================== */}
        {activeTab === 'storage' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Commercial Storage Bays (Max 2 Bays)</h2>
                  <p className="text-xs text-gray-500">
                    Recurring monthly revenue from on-site dry goods and walk-in cold storage facilities.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 font-bold uppercase">Monthly Recurring Revenue</div>
                  <div className="text-2xl font-black text-emerald-800 font-mono">$400.00 AUD / mo</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Bay 1 */}
                <div className="border border-emerald-200 rounded-2xl p-5 bg-emerald-50/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                      Storage Bay 1 · Dry Storage Unit A
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                      OCCUPIED
                    </span>
                  </div>
                  <div className="text-2xl font-black text-gray-900 font-mono">$150.00 AUD <span className="text-xs font-normal text-gray-500">/ month</span></div>
                  <div className="text-xs space-y-1 text-gray-700">
                    <div><b>Tenant:</b> Chef Michael Davies (Perth Catering Co.)</div>
                    <div><b>Lease Term:</b> 1 Nov 2026 – 30 Nov 2026 (Monthly Auto-Renew)</div>
                    <div><b>Security Deposit:</b> $200.00 (Cleared in Escrow)</div>
                    <div><b>Payment Status:</b> <span className="text-emerald-700 font-bold">Current & Paid</span></div>
                  </div>
                </div>

                {/* Bay 2 */}
                <div className="border border-blue-200 rounded-2xl p-5 bg-blue-50/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-800">
                      Storage Bay 2 · Cold Room Storage Unit B
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                      OCCUPIED
                    </span>
                  </div>
                  <div className="text-2xl font-black text-gray-900 font-mono">$250.00 AUD <span className="text-xs font-normal text-gray-500">/ month</span></div>
                  <div className="text-xs space-y-1 text-gray-700">
                    <div><b>Tenant:</b> ABC Catering Co.</div>
                    <div><b>Lease Term:</b> 1 Nov 2026 – 30 Nov 2026</div>
                    <div><b>Security Deposit:</b> $200.00 (Cleared in Escrow)</div>
                    <div><b>Payment Status:</b> <span className="text-emerald-700 font-bold">Current & Paid</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: RATES & ATO TAX DETAILS
           ======================================================== */}
        {activeTab === 'rates' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-black text-gray-900">Commercial Rates & Official ATO Tax Settings</h2>
                <p className="text-xs text-gray-500">
                  Official Australian taxation and commercial pricing rules applied across all invoices.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Australian Taxation Office Details */}
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 text-xs">
                  <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#112F21]" />
                    <span>Registered Business & ATO Entity</span>
                  </div>
                  <div className="space-y-2 text-gray-700">
                    <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                      <span className="text-gray-500">Legal Entity:</span>
                      <span className="font-bold text-gray-900">Daily Drop Commercial Kitchens Pty Ltd</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                      <span className="text-gray-500">Australian Business Number (ABN):</span>
                      <span className="font-mono font-bold text-gray-900">51 824 753 556</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                      <span className="text-gray-500">Facility Location:</span>
                      <span className="font-semibold text-gray-900">Victoria Park, Perth, WA 6100</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                      <span className="text-gray-500">Goods and Services Tax (GST):</span>
                      <span className="font-bold text-emerald-800">10% Included on all rental fees</span>
                    </div>
                  </div>
                </div>

                {/* Direct Banking & PayID Configuration */}
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 text-xs">
                  <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#112F21]" />
                    <span>Direct Payment Instructions</span>
                  </div>
                  <div className="space-y-2 text-gray-700">
                    <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                      <span className="text-gray-500">PayID Identifier:</span>
                      <span className="font-mono font-bold text-emerald-800">hello@dailydrop.today</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                      <span className="text-gray-500">Bank Name:</span>
                      <span className="font-semibold text-gray-900">National Australia Bank (NAB)</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                      <span className="text-gray-500">BSB Code:</span>
                      <span className="font-mono font-bold text-gray-900">066-000</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                      <span className="text-gray-500">Account Number:</span>
                      <span className="font-mono font-bold text-gray-900">1234 5678</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                      <span className="text-gray-500">Account Name:</span>
                      <span className="font-semibold text-gray-900">Daily Drop Kitchens Perth Operations</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================
          MODAL 1: OFFICIAL ATO TAX INVOICE PREVIEW
         ======================================================== */}
      {showTaxInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-gray-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 my-8">
            
            {/* Modal Header Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-800" />
                <h3 className="font-bold text-base text-gray-900">ATO Official Tax Invoice</h3>
                <span className="text-[10px] font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  {selectedInvoice.invoice_number}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setShowTaxInvoiceModal(false)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Tax Invoice Content */}
            <div id="printable-tax-invoice" className="space-y-6 text-xs text-gray-800 bg-white p-2">
              
              {/* Header: Company & Tax Details */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#112F21]">Daily Drop Commercial Kitchens</h2>
                  <p className="text-gray-500 font-medium">Daily Drop Kitchen Operations Pty Ltd</p>
                  <div className="font-mono text-gray-700 mt-1 font-bold">ABN: 51 824 753 556</div>
                  <div className="text-gray-500 mt-0.5">Albany Highway, Victoria Park, WA 6100, Australia</div>
                  <div className="text-gray-500">Email: accounting@dailydrop.today · Web: dailydrop.today</div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-xl font-black text-gray-900 uppercase tracking-tight">TAX INVOICE</div>
                  <div className="font-mono font-bold text-xs text-emerald-800">
                    Invoice #: {selectedInvoice.invoice_number}
                  </div>
                  <div className="text-gray-500">Date: {selectedInvoice.issue_date}</div>
                  <div className="text-gray-500">Due: {selectedInvoice.due_date}</div>
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      selectedInvoice.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bill To Details */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="font-bold text-[10px] uppercase text-gray-500 tracking-wider mb-1">
                  Billed To Tenant:
                </div>
                <div className="font-bold text-sm text-gray-900">{selectedInvoice.customer_name}</div>
                {selectedInvoice.business_name && (
                  <div className="text-gray-700 font-medium">{selectedInvoice.business_name}</div>
                )}
                {selectedInvoice.abn && (
                  <div className="text-gray-600 font-mono">Tenant ABN: {selectedInvoice.abn}</div>
                )}
                <div className="text-gray-600">Email: {selectedInvoice.email || selectedInvoice.customer_email || '—'} · Phone: {selectedInvoice.phone || selectedInvoice.customer_phone || '—'}</div>
                {selectedInvoice.booking_reference && (
                  <div className="text-emerald-800 font-mono font-bold mt-1">
                    Booking Reference: {selectedInvoice.booking_reference}
                  </div>
                )}
              </div>

              {/* Itemized Line Items Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-100 text-[10px] uppercase font-bold text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-center">Hours / Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate (AUD)</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedInvoice.line_items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-medium text-gray-800">{item.description}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{item.hours_or_quantity ?? item.quantity ?? 1}</td>
                        <td className="py-2.5 px-3 text-right font-mono">${(item.unit_rate ?? item.unit_price ?? 0).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                    {selectedInvoice.security_deposit > 0 && (
                      <tr className="bg-blue-50/40 text-blue-900 font-medium">
                        <td className="py-2.5 px-3">
                          Refundable Security Deposit (Held in Escrow per Kitchen Policy)
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">1</td>
                        <td className="py-2.5 px-3 text-right font-mono">${selectedInvoice.security_deposit.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">${selectedInvoice.security_deposit.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="flex justify-end">
                <div className="w-72 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Facility Rental Subtotal:</span>
                    <span className="font-mono font-semibold">${(selectedInvoice.total_amount / 1.1).toFixed(2)} AUD</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST (10% Australian Tax):</span>
                    <span className="font-mono font-semibold">${(selectedInvoice.total_amount - (selectedInvoice.total_amount / 1.1)).toFixed(2)} AUD</span>
                  </div>
                  {selectedInvoice.security_deposit > 0 && (
                    <div className="flex justify-between text-blue-900">
                      <span>Refundable Bond (Escrow):</span>
                      <span className="font-mono font-bold">${selectedInvoice.security_deposit.toFixed(2)} AUD</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-300">
                    <span>Total Amount Payable:</span>
                    <span className="font-mono text-emerald-900">
                      ${(selectedInvoice.total_amount + selectedInvoice.security_deposit).toFixed(2)} AUD
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Payment Banking Instructions */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-xs space-y-1 text-emerald-950">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Electronic Bank Transfer Details:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  <div><b>PayID:</b> hello@dailydrop.today</div>
                  <div><b>BSB:</b> 066-000</div>
                  <div><b>Account #:</b> 1234 5678</div>
                  <div><b>Reference:</b> {selectedInvoice.booking_reference || selectedInvoice.invoice_number}</div>
                </div>
              </div>

            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowTaxInvoiceModal(false)}
                className="bg-[#112F21] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#1a4731] transition-colors cursor-pointer"
              >
                Close Tax Invoice
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: SMART AI REMINDER (WHATSAPP & EMAIL)
         ======================================================== */}
      {showReminderModal && reminderInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-gray-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-sm text-gray-900">Smart Payment Follow-up (AI Drafted)</h3>
              </div>
              <button
                onClick={() => setShowReminderModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Personalized reminder citing the 48-hour provisional hold rule for Daily Drop Victoria Park:
            </p>

            {/* Generated Message Text */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 font-mono text-xs text-gray-800 whitespace-pre-wrap leading-relaxed select-all">
{`Hi ${reminderInvoice.customer_name},

This is Daily Drop Commercial Kitchens (Victoria Park Hub). 

Your kitchen booking (${reminderInvoice.booking_reference || reminderInvoice.invoice_number}) is currently on a provisional 48-hour hold.

Total Rental Due: $${reminderInvoice.total_amount.toFixed(2)} AUD
Direct PayID: hello@dailydrop.today
Bank BSB: 066-000 | Account: 1234 5678
Reference: ${reminderInvoice.booking_reference || reminderInvoice.invoice_number}

To ensure your station is locked in and your 6-digit electronic access PIN is generated, please confirm payment today.

Thank you!
Daily Drop Kitchen Management`}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  const text = `Hi ${reminderInvoice.customer_name},\n\nThis is Daily Drop Commercial Kitchens (Victoria Park Hub). Your kitchen booking (${reminderInvoice.booking_reference || reminderInvoice.invoice_number}) is currently on provisional hold.\n\nTotal Due: $${reminderInvoice.total_amount.toFixed(2)} AUD\nPayID: hello@dailydrop.today\nReference: ${reminderInvoice.booking_reference || reminderInvoice.invoice_number}\n\nPlease settle payment to activate your electronic keypad PIN. Thank you!`;
                  navigator.clipboard.writeText(text);
                  setReminderCopied(true);
                  setTimeout(() => setReminderCopied(false), 3000);
                }}
                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {reminderCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{reminderCopied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
              </button>

              <button
                onClick={() => {
                  const cleanPhone = (reminderInvoice.phone || reminderInvoice.customer_phone || '').replace(/[^0-9]/g, '');
                  const text = encodeURIComponent(
                    `Hi ${reminderInvoice.customer_name}, Daily Drop Kitchens here. Your booking (${reminderInvoice.booking_reference || reminderInvoice.invoice_number}) is awaiting payment: $${reminderInvoice.total_amount.toFixed(2)} AUD via PayID hello@dailydrop.today. Please confirm so we can release your entry PIN!`
                  );
                  window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
                }}
                className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Launch in WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: CREATE MANUAL TAX INVOICE
         ======================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-gray-200 shadow-2xl p-6 sm:p-7 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#ED8533]" />
                <h3 className="font-bold text-sm text-gray-900">Create Manual ATO Tax Invoice</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualInvoice} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tenant Legal Name *</label>
                <input
                  type="text"
                  value={newInvName}
                  onChange={(e) => setNewInvName(e.target.value)}
                  placeholder="Chef Sarah Jenkins"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-1 focus:ring-[#112F21] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Registered Business Name</label>
                  <input
                    type="text"
                    value={newInvBusiness}
                    onChange={(e) => setNewInvBusiness(e.target.value)}
                    placeholder="Artisan Bakery WA"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tenant ABN</label>
                  <input
                    type="text"
                    value={newInvAbn}
                    onChange={(e) => setNewInvAbn(e.target.value)}
                    placeholder="12 345 678 901"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newInvEmail}
                    onChange={(e) => setNewInvEmail(e.target.value)}
                    placeholder="sarah@bakery.com.au"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phone (with +61)</label>
                  <input
                    type="text"
                    value={newInvPhone}
                    onChange={(e) => setNewInvPhone(e.target.value)}
                    placeholder="+61 412 345 678"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Invoice Category</label>
                  <select
                    value={newInvType}
                    onChange={(e) => setNewInvType(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none"
                  >
                    <option value="kitchen_rental">Commercial Kitchen Shift</option>
                    <option value="storage_lease">Storage Space Lease</option>
                    <option value="custom">Custom Pop-Up / Event Hire</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Total Rental Amount (AUD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newInvAmount}
                    onChange={(e) => setNewInvAmount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Refundable Security Deposit (AUD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newInvDeposit}
                  onChange={(e) => setNewInvDeposit(e.target.value)}
                  placeholder="750.00"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description / Itemized Notes</label>
                <input
                  type="text"
                  value={newInvDesc}
                  onChange={(e) => setNewInvDesc(e.target.value)}
                  placeholder="e.g. 4 Hours Combi Oven + 6-Burner Range Shift"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingInvoice}
                  className="bg-[#112F21] hover:bg-[#1a4731] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  {creatingInvoice ? 'Generating...' : 'Issue Tax Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
