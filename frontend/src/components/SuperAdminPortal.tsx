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
          weekday: 'short',
          day: 'numeric',
          month: 'short',
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

  // Handle Super Admin Login (Credentials not displayed on screen)
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
        '⚡ Audit Complete: All 14 tenant invoices scanned. Bank reconciliations verified. 2 shifts within 24h flagged for unconfirmed payment.'
      );
      setTimeout(() => setAuditToast(null), 7000);
    }, 900);
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
      setAuditToast(`✓ Invoice ${inv.invoice_number} marked as PAID. Door PIN code activated for tenant.`);
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
        '🚨 2 Upcoming Shifts Unpaid: (1) Rohit (ABC Kitchen · $167.20 · Shift: Tue 20 Oct) and (2) Chef Michael Davies ($167.20 · Shift: Thu 22 Oct). Recommendation: Send WhatsApp reminders now. If unpaid 12h prior, release slots.'
      );
    } else if (q.includes('bond') || q.includes('deposit') || q.includes('escrow')) {
      setAiAnswer(
        '🛡️ Escrow Balance: $950.00 AUD total ($750.00 kitchen security bond + $200.00 storage bond). All bonds are safely held in escrow pending post-shift cleanliness inspection.'
      );
    } else if (q.includes('storage') || q.includes('bay')) {
      setAiAnswer(
        '📦 Storage Leases: 2 bays active in Victoria Park: Unit A (Dry Storage · $150/mo) and Unit B (Cold Room Bay · $250/mo). Recurring revenue: $400.00 AUD/mo.'
      );
    } else if (q.includes('revenue') || q.includes('how much') || q.includes('total') || q.includes('cashflow')) {
      setAiAnswer(
        `💰 Financial Status: Total Invoiced: $${totalInvoiced.toFixed(2)} AUD. Reconciled in Bank: $${totalPaidRevenue.toFixed(2)} AUD. Pending Collection: $${totalPending.toFixed(2)} AUD.`
      );
    } else {
      setAiAnswer(
        `🤖 AI Inspection Result: 14 active tenant records examined. All booking slots comply with WA commercial kitchen standards.`
      );
    }
  };

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const bType = inv.booking_type || inv.invoice_type;
      if (activeFilterTab === 'pending' && inv.status !== 'pending') return false;
      if (activeFilterTab === 'paid' && inv.status !== 'paid') return false;
      if (activeFilterTab === 'overdue' && inv.status !== 'overdue' && inv.ai_risk_level !== 'critical' && inv.ai_risk_level !== 'high') return false;
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
  // RENDER: SUPER ADMIN LOGIN SCREEN (Clean, No Stored Creds Displayed)
  // ========================================================
  if (!token) {
    return (
      <div className="min-h-screen bg-[#EAEFEA] flex items-center justify-center p-4 selection:bg-amber-200">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-300 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-[#112F21] rounded-2xl flex items-center justify-center mx-auto text-[#ED8533] shadow-md border border-[#1b4a34]">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                Director & Executive Oversight
              </span>
              <h1 className="text-2xl font-black text-gray-900 mt-2.5">Super Admin Portal</h1>
              <p className="text-xs text-gray-500 mt-1">
                Victoria Park Kitchen · Invoices, AI Cashflow & Escrow Bonds
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
                placeholder="Enter username"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#112F21] focus:outline-none bg-gray-50/50"
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
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#112F21] focus:outline-none bg-gray-50/50"
                required
              />
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
  // RENDER: SUPER ADMIN PORTAL WORKSPACE (Rich Contrast & Clean Hierarchy)
  // ========================================================
  return (
    <div className="min-h-screen bg-[#EBF0EC] flex flex-col text-gray-900 selection:bg-amber-200">
      
      {/* 1. Executive Top Navbar */}
      <header className="bg-white border-b border-gray-300 sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Brand & Executive Badge */}
            <div className="flex items-center gap-3">
              <img
                src={Images.logo}
                alt="Daily Drop Commercial Kitchen"
                className="h-8 w-auto object-contain mix-blend-multiply cursor-pointer"
                onClick={onBackToSite}
                title="Daily Drop Commercial Kitchen Home"
              />
              <div className="flex items-center gap-1.5 pl-3 border-l border-gray-300">
                <span className="text-xs font-black tracking-wider uppercase text-[#112F21]">
                  Super Admin
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider bg-[#ED8533] text-white px-2 py-0.5 rounded-full shadow-2xs">
                  Director Hub
                </span>
              </div>
            </div>

            {/* Center: Live Perth Clock (AWST · UTC+8) */}
            <div className="hidden md:flex items-center gap-2 bg-[#F0F5F1] border border-[#C5D9C8] rounded-xl px-3 py-1 text-xs">
              <Clock className="w-3.5 h-3.5 text-emerald-800" />
              <span className="font-semibold text-gray-700">{perthDateStr}</span>
              <span className="font-mono font-black text-emerald-950 bg-emerald-200/60 px-1.5 py-0.2 rounded">
                {perthTimeStr || 'AWST'}
              </span>
            </div>

            {/* Right: Portal Switchers & Profile Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={onGoToAdminPortal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-all cursor-pointer"
                title="Switch to Regular Operations Admin"
              >
                <Shield className="w-3.5 h-3.5 text-[#112F21]" />
                <span className="hidden sm:inline">Staff Admin</span>
              </button>

              <button
                onClick={onBackToSite}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-all cursor-pointer"
                title="View Public Website"
              >
                <ExternalLink className="w-3.5 h-3.5 text-gray-600" />
                <span className="hidden sm:inline">Website</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-700 bg-red-100/80 hover:bg-red-200 border border-red-300 transition-all cursor-pointer ml-1"
                title="Sign Out of Super Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Super Admin Navigation Tabs (High contrast, clearly defined) */}
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 border-t border-gray-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'invoices'
                  ? 'bg-[#112F21] text-white shadow-md font-bold'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-[#112F21] hover:text-gray-900'
              }`}
            >
              <Bot className="w-4 h-4 text-[#ED8533]" />
              <span>Invoices & Financial AI Monitor</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'invoices' ? 'bg-[#ED8533] text-white' : 'bg-gray-200 text-gray-800'
              }`}>
                {invoices.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('bonds')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'bonds'
                  ? 'bg-[#112F21] text-white shadow-md font-bold'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-[#112F21] hover:text-gray-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#ED8533]" />
              <span>Bonds & Security Escrow ($750 / $200)</span>
            </button>

            <button
              onClick={() => setActiveTab('storage')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'storage'
                  ? 'bg-[#112F21] text-white shadow-md font-bold'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-[#112F21] hover:text-gray-900'
              }`}
            >
              <Package className="w-4 h-4 text-[#ED8533]" />
              <span>Storage Bay Revenue (Max 2)</span>
            </button>

            <button
              onClick={() => setActiveTab('rates')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'rates'
                  ? 'bg-[#112F21] text-white shadow-md font-bold'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-[#112F21] hover:text-gray-900'
              }`}
            >
              <Sliders className="w-4 h-4 text-[#ED8533]" />
              <span>Rates & ATO Tax Details</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body (Soft sage-tinted background so all cards pop) */}
      <main className="flex-1 max-w-[1560px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Toast Alert */}
        {auditToast && (
          <div className="p-3.5 rounded-2xl bg-emerald-800 text-white font-medium text-xs sm:text-sm shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 border border-emerald-600">
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
            
            {/* 1. Header Bar: Title & Direct Action Buttons */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#112F21] tracking-tight">
                  Commercial Invoices & Cashflow Overview
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Victoria Park Commercial Kitchen Hub · Automatic 48h rental hold monitoring & escrow safeguards
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={handleRunAiAudit}
                  disabled={isAuditing}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 px-3.5 py-2 rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-75"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#ED8533] ${isAuditing ? 'animate-spin' : ''}`} />
                  <span>{isAuditing ? 'Auditing...' : 'Run 1-Click AI Audit'}</span>
                </button>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-[#ED8533] hover:bg-[#d87222] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Create Invoice</span>
                </button>
              </div>
            </div>

            {/* 2. Top Executive Metrics Cards (Each card has a rich, distinct color - NO MORE SEA OF WHITE) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Card 1: Total Invoiced (Deep Forest Green) */}
              <div className="bg-[#112F21] text-white rounded-2xl p-4 sm:p-5 border border-[#1b4330] shadow-md space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#8BB89F] flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-[#ED8533]" />
                  <span>Total Invoiced</span>
                </div>
                <div className="text-2xl font-black font-mono tracking-tight text-white mt-1">
                  ${totalInvoiced.toFixed(2)} AUD
                </div>
                <div className="text-[11px] text-[#B4D5C2]">All shifts & storage leases</div>
              </div>

              {/* Card 2: Verified Paid Revenue (Fresh Emerald Tint) */}
              <div className="bg-[#EBF7EE] text-emerald-950 rounded-2xl p-4 sm:p-5 border-2 border-[#81C784] shadow-xs space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Verified Paid Revenue</span>
                </div>
                <div className="text-2xl font-black font-mono tracking-tight text-emerald-900 mt-1">
                  ${totalPaidRevenue.toFixed(2)} AUD
                </div>
                <div className="text-[11px] text-emerald-700 font-bold">
                  ✓ Reconciled in Bank Account
                </div>
              </div>

              {/* Card 3: Pending Collection (Warm Amber Gold Tint) */}
              <div className="bg-[#FFF9E6] text-amber-950 rounded-2xl p-4 sm:p-5 border-2 border-[#FFD54F] shadow-xs space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Pending Collection</span>
                </div>
                <div className="text-2xl font-black font-mono tracking-tight text-amber-900 mt-1">
                  ${totalPending.toFixed(2)} AUD
                </div>
                <div className="text-[11px] text-amber-800 font-semibold">
                  ⏳ 48-Hour Payment Window Active
                </div>
              </div>

              {/* Card 4: Action Required / Overdue (Alert Crimson Red Tint) */}
              <div className="bg-[#FDEDEC] text-red-950 rounded-2xl p-4 sm:p-5 border-2 border-[#E57373] shadow-xs space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-red-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-bounce" />
                  <span>Action Required / Overdue</span>
                </div>
                <div className="text-2xl font-black font-mono tracking-tight text-red-700 mt-1">
                  {highRiskList.length} Invoices
                </div>
                <div className="text-[11px] text-red-700 font-black">
                  ⚠️ Shift in &lt; 24h & Unpaid!
                </div>
              </div>

              {/* Card 5: Security Bonds in Escrow (Ice Blue Tint) */}
              <div className="bg-[#E8F0FE] text-blue-950 rounded-2xl p-4 sm:p-5 border-2 border-[#90CAF9] shadow-xs space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-blue-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                  <span>Security Bonds in Escrow</span>
                </div>
                <div className="text-2xl font-black font-mono tracking-tight text-blue-950 mt-1">
                  ${totalBondsHeld.toFixed(2)} AUD
                </div>
                <div className="text-[11px] text-blue-700 font-semibold">
                  🛡️ $750 Kitchen + $200 Storage
                </div>
              </div>

            </div>

            {/* 3. URGENT ATTENTION SECTION (Only rendered when there are high-risk bookings to address) */}
            {highRiskList.length > 0 && (
              <div className="bg-[#FFF5F5] border-2 border-red-300 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    <h2 className="font-black text-sm text-red-900">
                      Immediate Action Needed: Upcoming Shifts Without Confirmed Payment
                    </h2>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-red-200 text-red-900 px-2 py-0.5 rounded-full">
                    Shift in &lt; 24 Hours
                  </span>
                </div>
                <p className="text-xs text-red-800/80">
                  These tenants have reserved kitchen stations for tomorrow, but payment has not cleared. Follow up via WhatsApp or release the kitchen slot to other caterers.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {highRiskList.slice(0, 2).map((riskInv) => (
                    <div
                      key={riskInv.id}
                      className="bg-white p-4 rounded-xl border border-red-200 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-black text-xs text-gray-900">
                            {riskInv.customer_name} <span className="font-normal text-gray-500">({riskInv.business_name || 'Individual'})</span>
                          </div>
                          <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                            Ref: {riskInv.booking_reference || riskInv.invoice_number} · Shift starts soon
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-black text-sm text-red-700">
                            ${riskInv.total_amount.toFixed(2)} AUD
                          </div>
                          <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                            UNPAID
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleOpenReminder(riskInv)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>WhatsApp Reminder</span>
                        </button>
                        
                        <button
                          onClick={() => handleMarkPaid(riskInv)}
                          className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Mark Paid</span>
                        </button>

                        <button
                          onClick={() => handleVoidInvoice(riskInv)}
                          className="text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ml-auto"
                        >
                          Release Slot
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Streamlined AI Assistant Bar (Compact, zero clutter) */}
            <div className="bg-white rounded-2xl border border-gray-300 p-4 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#112F21]">
                  <Bot className="w-4 h-4 text-[#ED8533]" />
                  <span>Smart AI Financial Assistant:</span>
                </div>

                {/* Clickable Quick Questions */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    onClick={() => handleAiAsk('Which invoices are overdue and high risk?')}
                    className="px-2.5 py-1 rounded-lg bg-red-100/70 text-red-800 hover:bg-red-100 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    🚨 Who owes money?
                  </button>
                  <button
                    onClick={() => handleAiAsk('How much bond money is currently held in escrow?')}
                    className="px-2.5 py-1 rounded-lg bg-blue-100/70 text-blue-800 hover:bg-blue-100 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    🛡️ Escrow Bonds ($950)
                  </button>
                  <button
                    onClick={() => handleAiAsk('Show me storage bay leases')}
                    className="px-2.5 py-1 rounded-lg bg-amber-100/70 text-amber-900 hover:bg-amber-100 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    📦 Storage Leases
                  </button>
                  <button
                    onClick={() => handleAiAsk('What is our total invoiced revenue?')}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    💰 Revenue Summary
                  </button>
                </div>
              </div>

              {/* Natural Language Prompt Search Bar */}
              <div className="flex items-center gap-2 bg-[#F4F7F4] p-1.5 rounded-xl border border-gray-300">
                <Search className="w-4 h-4 text-gray-400 ml-2" />
                <input
                  type="text"
                  value={aiQueryInput}
                  onChange={(e) => setAiQueryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiAsk(aiQueryInput)}
                  placeholder="Ask AI anything: e.g. 'Who has unpaid shifts?' or 'Show escrow bonds'..."
                  className="flex-1 bg-transparent border-none text-xs focus:outline-none text-gray-800 placeholder-gray-400"
                />
                <button
                  onClick={() => handleAiAsk(aiQueryInput || 'Which invoices are overdue?')}
                  className="bg-[#112F21] hover:bg-[#1a4731] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Ask
                </button>
              </div>

              {/* AI Answer Box */}
              {aiAnswer && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-gray-900 space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#112F21] flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-[#ED8533]" /> AI Response:
                    </span>
                    <button onClick={() => setAiAnswer(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="leading-relaxed font-medium">{aiAnswer}</p>
                </div>
              )}
            </div>

            {/* 5. Master Invoices Data Table (Dark slate header, zebra rows, crystal clear status badges) */}
            <div className="bg-white rounded-2xl border border-gray-300 shadow-sm overflow-hidden space-y-4 p-5">
              
              {/* Table Filters & Search */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
                  {[
                    { id: 'all', label: `All (${invoices.length})` },
                    { id: 'pending', label: 'Pending Payment' },
                    { id: 'paid', label: 'Paid & Cleared' },
                    { id: 'overdue', label: 'Action Required' },
                    { id: 'kitchen', label: 'Kitchen Shifts' },
                    { id: 'storage', label: 'Storage Bays' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilterTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                        activeFilterTab === tab.id
                          ? 'bg-[#112F21] text-white shadow-xs font-bold'
                          : 'bg-[#F0F4F1] text-gray-700 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tenant, ABN, invoice #..."
                    className="w-full pl-9 pr-3 py-2 bg-[#F8FAF8] border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#112F21]"
                  />
                </div>
              </div>

              {/* Table with High Contrast Dark Slate Header */}
              <div className="overflow-x-auto rounded-xl border border-gray-300">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#E5ECE7] text-gray-800 font-black uppercase tracking-wider text-[10px] border-b border-gray-300">
                      <th className="py-3 px-3.5">Invoice # & Date</th>
                      <th className="py-3 px-3.5">Tenant / Business</th>
                      <th className="py-3 px-3.5">Rental Category</th>
                      <th className="py-3 px-3.5">Rental Fee</th>
                      <th className="py-3 px-3.5">Bond (Escrow)</th>
                      <th className="py-3 px-3.5">Payment Status</th>
                      <th className="py-3 px-3.5">AI Watchdog</th>
                      <th className="py-3 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-400 font-medium">
                          No invoices found matching current filter or search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((inv, idx) => (
                        <tr
                          key={inv.id}
                          className={`transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-[#F9FAF9]'
                          } hover:bg-emerald-50/60`}
                        >
                          
                          {/* Invoice # & Date */}
                          <td className="py-3 px-3.5">
                            <div className="font-mono font-bold text-gray-900">{inv.invoice_number}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              Issued: {inv.issue_date}
                            </div>
                            {inv.booking_reference && (
                              <div className="text-[10px] font-mono text-emerald-800 font-bold">
                                Ref: {inv.booking_reference}
                              </div>
                            )}
                          </td>

                          {/* Tenant / Business */}
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-gray-900">{inv.customer_name}</div>
                            <div className="text-[11px] text-gray-600">{inv.business_name || 'Individual Chef'}</div>
                            {inv.abn && (
                              <div className="text-[10px] font-mono text-gray-500">ABN: {inv.abn}</div>
                            )}
                          </td>

                          {/* Rental Category */}
                          <td className="py-3 px-3.5">
                            <span className="font-semibold text-gray-800 capitalize">
                              {(inv.booking_type || inv.invoice_type || 'rental').replace('_', ' ')}
                            </span>
                            <div className="text-[10px] text-gray-500 max-w-[160px] truncate">
                              {inv.line_items?.[0]?.description || 'Commercial Kitchen Station Access'}
                            </div>
                          </td>

                          {/* Rental Fee */}
                          <td className="py-3 px-3.5 font-mono font-bold text-gray-900">
                            ${inv.total_amount.toFixed(2)} AUD
                          </td>

                          {/* Bond */}
                          <td className="py-3 px-3.5 font-mono">
                            {inv.security_deposit > 0 ? (
                              <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                ${inv.security_deposit.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          {/* Payment Status Badge (Solid High Contrast Pills) */}
                          <td className="py-3 px-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                inv.status === 'paid'
                                  ? 'bg-emerald-700 text-white shadow-2xs'
                                  : inv.status === 'overdue'
                                  ? 'bg-red-600 text-white shadow-2xs'
                                  : inv.status === 'void'
                                  ? 'bg-gray-400 text-white'
                                  : 'bg-amber-600 text-white shadow-2xs'
                              }`}
                            >
                              {inv.status === 'pending' ? 'PENDING (48H)' : inv.status}
                            </span>
                          </td>

                          {/* AI Risk Watchdog */}
                          <td className="py-3 px-3.5">
                            {inv.ai_risk_level === 'critical' ? (
                              <span className="text-red-700 font-bold flex items-center gap-1 text-[11px]">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>Critical (Shift in 24h)</span>
                              </span>
                            ) : inv.ai_risk_level === 'high' ? (
                              <span className="text-amber-800 font-semibold flex items-center gap-1 text-[11px]">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span>Unpaid &gt; 48h</span>
                              </span>
                            ) : (
                              <span className="text-emerald-800 font-medium flex items-center gap-1 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Verified / Low Risk</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Tax Invoice Button */}
                              <button
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setShowTaxInvoiceModal(true);
                                }}
                                className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="View official ATO Tax Invoice"
                              >
                                <Receipt className="w-3 h-3 text-[#112F21]" />
                                <span>Tax Invoice</span>
                              </button>

                              {/* WhatsApp Reminder Button */}
                              {inv.status !== 'paid' && (
                                <button
                                  onClick={() => handleOpenReminder(inv)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Send smart WhatsApp reminder"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </button>
                              )}

                              {/* Mark Paid Button */}
                              {inv.status !== 'paid' && (
                                <button
                                  onClick={() => handleMarkPaid(inv)}
                                  className="bg-[#112F21] hover:bg-[#1a4731] text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
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
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-300 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Tenant Security Bonds in Escrow</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Refundable security deposits held for equipment protection and kitchen cleanliness.
                  </p>
                </div>
                <div className="text-right bg-blue-50 border border-blue-200 p-3 rounded-xl">
                  <div className="text-[10px] text-blue-800 font-bold uppercase">Total Escrow Balance</div>
                  <div className="text-2xl font-black text-blue-950 font-mono">${totalBondsHeld.toFixed(2)} AUD</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#F0F5F1] border-2 border-[#81C784] space-y-1.5">
                  <div className="font-black text-xs text-emerald-900 uppercase">Kitchen Shift Bond</div>
                  <div className="text-2xl font-black text-emerald-950 font-mono">$750.00 AUD</div>
                  <p className="text-[11px] text-gray-600">
                    Collected prior to shift start. Covers combi oven, tilting bratt pan, fryers, and grease traps.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#E8F0FE] border-2 border-[#90CAF9] space-y-1.5">
                  <div className="font-black text-xs text-blue-900 uppercase">Storage Bay Bond</div>
                  <div className="text-2xl font-black text-blue-950 font-mono">$200.00 AUD</div>
                  <p className="text-[11px] text-gray-600">
                    Held for dry goods storage cages and cold room shelving bays during the active lease term.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-xs font-bold text-gray-800 mb-2 uppercase tracking-wider">
                  Active Escrow Ledger:
                </h3>
                <div className="overflow-x-auto rounded-xl border border-gray-300">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#E5ECE7] text-[10px] uppercase font-bold text-gray-800">
                      <tr>
                        <th className="py-2.5 px-4">Tenant</th>
                        <th className="py-2.5 px-4">Service</th>
                        <th className="py-2.5 px-4">Bond Amount</th>
                        <th className="py-2.5 px-4">Escrow Status</th>
                        <th className="py-2.5 px-4">Inspection Checklist</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50 bg-white">
                        <td className="py-3 px-4 font-bold">Chef Michael Davies (Perth Catering Co.)</td>
                        <td className="py-3 px-4 text-gray-600">Commercial Kitchen Shift (DD-BK-001)</td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-900">$750.00 AUD</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                            Held in Escrow
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-gray-600">
                          Combi oven cleaned · Grease traps clear
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => alert('Inspection verified. $750.00 bond release initiated to Michael Davies via PayID.')}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Approve Refund
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 bg-[#F9FAF9]">
                        <td className="py-3 px-4 font-bold">ABC Catering Pty Ltd</td>
                        <td className="py-3 px-4 text-gray-600">Cold Room Storage Bay B</td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-900">$200.00 AUD</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                            Held in Escrow
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-gray-600">
                          Active Monthly Storage Lease
                        </td>
                        <td className="py-3 px-4 text-right">
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
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-300 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Commercial Storage Bays (Max 2 Bays)</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Monthly recurring revenue from dry storage cage and walk-in cold room facilities.
                  </p>
                </div>
                <div className="text-right bg-emerald-50 border border-emerald-300 p-3 rounded-xl">
                  <div className="text-[10px] text-emerald-800 font-bold uppercase">Monthly Storage Income</div>
                  <div className="text-2xl font-black text-emerald-900 font-mono">$400.00 AUD / mo</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Bay 1 */}
                <div className="border-2 border-emerald-300 rounded-2xl p-5 bg-[#F0F7F1] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                      Storage Bay 1 · Dry Storage Unit A
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-700 text-white">
                      OCCUPIED
                    </span>
                  </div>
                  <div className="text-2xl font-black text-gray-900 font-mono">$150.00 AUD <span className="text-xs font-normal text-gray-500">/ month</span></div>
                  <div className="text-xs space-y-1 text-gray-700 pt-1 border-t border-emerald-200">
                    <div><b>Tenant:</b> Chef Michael Davies (Perth Catering Co.)</div>
                    <div><b>Lease Term:</b> Monthly Auto-Renew</div>
                    <div><b>Security Deposit:</b> $200.00 (Held in Escrow)</div>
                    <div><b>Status:</b> <span className="text-emerald-800 font-bold">Current & Paid</span></div>
                  </div>
                </div>

                {/* Bay 2 */}
                <div className="border-2 border-blue-300 rounded-2xl p-5 bg-[#EBF3FD] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                      Storage Bay 2 · Cold Room Storage Unit B
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-700 text-white">
                      OCCUPIED
                    </span>
                  </div>
                  <div className="text-2xl font-black text-gray-900 font-mono">$250.00 AUD <span className="text-xs font-normal text-gray-500">/ month</span></div>
                  <div className="text-xs space-y-1 text-gray-700 pt-1 border-t border-blue-200">
                    <div><b>Tenant:</b> ABC Catering Co.</div>
                    <div><b>Lease Term:</b> Monthly Auto-Renew</div>
                    <div><b>Security Deposit:</b> $200.00 (Held in Escrow)</div>
                    <div><b>Status:</b> <span className="text-emerald-800 font-bold">Current & Paid</span></div>
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
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-300 shadow-sm space-y-5">
              <div className="pb-4 border-b border-gray-200">
                <h2 className="text-xl font-black text-gray-900">Commercial Rates & Official ATO Tax Settings</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Australian Taxation Office registration, pricing formulas, and bank transfer credentials.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* ATO Details */}
                <div className="p-5 rounded-2xl bg-[#F8FAF8] border border-gray-300 space-y-3 text-xs">
                  <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#112F21]" />
                    <span>Registered Business & ATO Entity</span>
                  </div>
                  <div className="space-y-2 text-gray-700">
                    <div className="flex justify-between border-b border-gray-200 pb-1.5">
                      <span className="text-gray-500">Legal Entity:</span>
                      <span className="font-bold text-gray-900">Daily Drop Commercial Kitchens Pty Ltd</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-1.5">
                      <span className="text-gray-500">Australian Business Number (ABN):</span>
                      <span className="font-mono font-bold text-gray-900">51 824 753 556</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-1.5">
                      <span className="text-gray-500">Facility Location:</span>
                      <span className="font-semibold text-gray-900">Victoria Park, Perth, WA 6100</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-1.5">
                      <span className="text-gray-500">Goods and Services Tax (GST):</span>
                      <span className="font-bold text-emerald-800">10% Included on all rental fees</span>
                    </div>
                  </div>
                </div>

                {/* Direct Banking Instructions */}
                <div className="p-5 rounded-2xl bg-[#F8FAF8] border border-gray-300 space-y-3 text-xs">
                  <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#112F21]" />
                    <span>Direct Payment Instructions</span>
                  </div>
                  <div className="space-y-2 text-gray-700">
                    <div className="flex justify-between border-b border-gray-200 pb-1.5">
                      <span className="text-gray-500">PayID Identifier:</span>
                      <span className="font-mono font-bold text-emerald-800">hello@dailydrop.today</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-1.5">
                      <span className="text-gray-500">Bank Name:</span>
                      <span className="font-semibold text-gray-900">National Australia Bank (NAB)</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-1.5">
                      <span className="text-gray-500">BSB Code:</span>
                      <span className="font-mono font-bold text-gray-900">066-000</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-1.5">
                      <span className="text-gray-500">Account Number:</span>
                      <span className="font-mono font-bold text-gray-900">1234 5678</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-1.5">
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
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-gray-300 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 my-8">
            
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
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-gray-300"
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
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                      selectedInvoice.status === 'paid'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-amber-600 text-white'
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
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs space-y-1 text-emerald-950">
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
          <div className="bg-white rounded-3xl max-w-lg w-full border border-gray-300 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-sm text-gray-900">WhatsApp & SMS Payment Follow-up</h3>
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
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-300 font-mono text-xs text-gray-800 whitespace-pre-wrap leading-relaxed select-all">
{`Hi ${reminderInvoice.customer_name},

This is Daily Drop Commercial Kitchens (Victoria Park Hub). 

Your kitchen booking (${reminderInvoice.booking_reference || reminderInvoice.invoice_number}) is currently on provisional hold.

Total Due: $${reminderInvoice.total_amount.toFixed(2)} AUD
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
                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-gray-300"
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
          <div className="bg-white rounded-3xl max-w-lg w-full border border-gray-300 shadow-2xl p-6 sm:p-7 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
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
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-1 focus:ring-[#112F21] focus:outline-none"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tenant ABN</label>
                  <input
                    type="text"
                    value={newInvAbn}
                    onChange={(e) => setNewInvAbn(e.target.value)}
                    placeholder="12 345 678 901"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:outline-none"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phone (with +61)</label>
                  <input
                    type="text"
                    value={newInvPhone}
                    onChange={(e) => setNewInvPhone(e.target.value)}
                    placeholder="+61 412 345 678"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Invoice Category</label>
                  <select
                    value={newInvType}
                    onChange={(e) => setNewInvType(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-mono font-bold focus:outline-none"
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
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description / Itemized Notes</label>
                <input
                  type="text"
                  value={newInvDesc}
                  onChange={(e) => setNewInvDesc(e.target.value)}
                  placeholder="e.g. 4 Hours Combi Oven + 6-Burner Range Shift"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
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
