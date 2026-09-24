import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  CreditCard,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Cpu,
  Terminal,
  Building2,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  createCheckoutSession,
  getCheckoutConfig,
  CheckoutSessionResponse,
  CheckoutConfigResponse,
} from '../services/api.js';

interface CheckoutPageProps {
  onNavigate?: (path: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onNavigate = (path: string) => { window.location.hash = path; },
}) => {
  // Parse initial params from URL
  const [selectedPlan, setSelectedPlan] = useState<'FOUNDER' | 'SERIAL' | 'ENTERPRISE'>('SERIAL');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'shoppay' | 'card'>('shoppay');
  const [checkoutConfig, setCheckoutConfig] = useState<CheckoutConfigResponse | null>(null);

  // Legal compliance & clickwrap state
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [policyModal, setPolicyModal] = useState<'terms' | 'privacy' | null>(null);

  // Checkout process state
  const [processing, setProcessing] = useState(false);
  const [completedSession, setCompletedSession] = useState<CheckoutSessionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-parse search params if available in browser
  useEffect(() => {
    try {
      const hash = window.location.hash;
      const queryStr = hash.includes('?') ? hash.split('?')[1] : window.location.search.slice(1);
      const params = new URLSearchParams(queryStr);
      let planParam = params.get('plan')?.toUpperCase();

      // Check for /subscribe/<plan> path in hash or pathname
      if (!planParam) {
        const path = (hash || window.location.pathname).toLowerCase();
        if (path.includes('founder')) planParam = 'FOUNDER';
        else if (path.includes('serial')) planParam = 'SERIAL';
        else if (path.includes('enterprise')) planParam = 'ENTERPRISE';
      }

      if (planParam === 'FOUNDER' || planParam === 'SERIAL' || planParam === 'ENTERPRISE') {
        setSelectedPlan(planParam as any);
      }
      const billingParam = params.get('billing')?.toLowerCase();
      if (billingParam === 'annual' || billingParam === 'monthly') {
        setBillingInterval(billingParam as any);
      }
    } catch {
      // Graceful fallback
    }

    // Fetch live checkout config for Moyer Ventures LLC
    getCheckoutConfig()
      .then((cfg) => setCheckoutConfig(cfg))
      .catch(() => {});
  }, []);

  const plans = {
    FOUNDER: {
      id: 'FOUNDER' as const,
      name: 'Founder Plan',
      persona: 'Busy 9-to-5 Professionals',
      subtitle: 'Turnkey 15 min/day, no coding needed, personal GitHub & Stripe',
      monthlyPrice: 55,
      listMonthlyPrice: 69,
      annualPrice: 528,
      listAnnualPrice: 660,
      monthlyPerMo: 55,
      annualPerMo: 44,
      listAnnualPerMo: 55,
      credits: 1000,
      deployments: 3,
      iterations: 10,
      byok: false,
      icon: Cpu,
      color: 'text-emerald-400',
      border: 'border-emerald-500/50',
    },
    SERIAL: {
      id: 'SERIAL' as const,
      name: 'Serial Plan',
      persona: 'Serial Indie Hackers & Builders',
      subtitle: 'Headless CLI, BYOK 0% token markup, multi-venture cockpit',
      monthlyPrice: 119,
      listMonthlyPrice: 149,
      annualPrice: 1140,
      listAnnualPrice: 1430,
      monthlyPerMo: 119,
      annualPerMo: 95,
      listAnnualPerMo: 119,
      credits: 5000,
      deployments: 15,
      iterations: 50,
      byok: true,
      icon: Terminal,
      color: 'text-indigo-400',
      border: 'border-indigo-500',
    },
    ENTERPRISE: {
      id: 'ENTERPRISE' as const,
      name: 'Enterprise Studio Plan',
      persona: 'Corporate Innovation Studios',
      subtitle: 'Tranche capital gates ($5k→$25k→$100k), SAML SSO, SOC 2 ready controls',
      monthlyPrice: 799,
      listMonthlyPrice: 999,
      annualPrice: 7668,
      listAnnualPrice: 9590,
      monthlyPerMo: 799,
      annualPerMo: 639,
      listAnnualPerMo: 799,
      credits: 25000,
      deployments: 50,
      iterations: 250,
      byok: true,
      icon: Building2,
      color: 'text-cyan-400',
      border: 'border-cyan-500/50',
    },
  };

  const currentPlan = plans[selectedPlan];
  const price = billingInterval === 'monthly' ? currentPlan.monthlyPrice : currentPlan.annualPrice;
  const listPrice = billingInterval === 'monthly' ? currentPlan.listMonthlyPrice : currentPlan.listAnnualPrice;
  const savings = listPrice - price;
  const perMonthPrice = billingInterval === 'monthly' ? currentPlan.monthlyPerMo : currentPlan.annualPerMo;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setErrorMsg('You must review and agree to the Terms of Service, Privacy Policy, and continuous recurring billing terms before proceeding.');
      return;
    }
    setProcessing(true);
    setErrorMsg('');

    try {
      const provider = paymentMethod === 'shoppay' ? 'Shopify / Shop Pay' : 'Stripe';
      const session = await createCheckoutSession({
        plan: selectedPlan,
        email: customerEmail,
        billingInterval,
        paymentProvider: provider,
        agreedToTerms: true,
        consentTimestamp: new Date().toISOString(),
        disclosureVersion: '2026-09-PUBLIC-BETA-RATE-LOCK-v1',
        successUrl: `${window.location.origin}/#dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/#checkout?canceled=true`,
      });

      setCompletedSession(session);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to initialize checkout session. Please check your network connection and try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-xs text-emerald-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SSL Encrypted &amp; Secure Checkout</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Complete Your Stage Gate OS Subscription
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Protected by the Zero-Charge Failure Guarantee. Never debited for syntax errors or failed health checks.
          </p>
        </div>

        {/* SUCCESS CONFIRMATION STATE */}
        {completedSession ? (
          <div className="rounded-2xl border border-emerald-500/60 bg-slate-900/90 p-8 sm:p-10 space-y-6 shadow-2xl text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">
                Subscription Activated Successfully!
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Stripe Session ID: {completedSession.sessionId}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Provisioned Plan</span>
                <span className="font-semibold text-white">{currentPlan.name}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Escrow Wallet Initialized</span>
                <span className="font-mono text-emerald-400 font-bold">{currentPlan.credits} Credits Allocated</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Monthly Quota</span>
                <span className="text-slate-200">{currentPlan.deployments} Verified Deployments</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Perpetual Revenue Tax</span>
                <span className="font-mono text-emerald-400 font-bold">0.0% Guaranteed</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => onNavigate('/')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Return to Marketing Portal
              </button>
              <button
                onClick={() => onNavigate('/grader')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-glow-indigo transition-all flex items-center justify-center space-x-2"
              >
                <span>Validate & Launch First Venture</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* CHECKOUT FORM & PLAN SELECTION */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Plan Select & Order Summary */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Billing Toggle */}
              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">Billing Interval</span>
                  <div className="inline-flex items-center p-1 rounded-lg bg-slate-950 border border-slate-800">
                    <button
                      onClick={() => setBillingInterval('monthly')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold ${
                        billingInterval === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingInterval('annual')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 ${
                        billingInterval === 'annual' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      <span>Annual</span>
                      <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-500 text-slate-950">
                        -20%
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Plan Choice Cards */}
              <div className="space-y-3">
                {(['FOUNDER', 'SERIAL', 'ENTERPRISE'] as const).map((planKey) => {
                  const p = plans[planKey];
                  const isSelected = selectedPlan === planKey;
                  const itemPrice = billingInterval === 'monthly' ? p.monthlyPrice : p.annualPrice;

                  return (
                    <div
                      key={planKey}
                      onClick={() => setSelectedPlan(planKey)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? `bg-slate-900 border-2 ${p.border} shadow-glow-indigo`
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className={`p-2 rounded-lg bg-slate-950 border border-slate-800 ${p.color}`}>
                          <p.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center space-x-2">
                            <span>{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({p.persona})</span>
                            {planKey === 'SERIAL' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-900 text-indigo-200">
                                POPULAR
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-indigo-300 font-medium mt-0.5">
                            {p.subtitle}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {p.deployments} verified deployments / mo • {p.iterations} iterations
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center justify-end space-x-1.5 font-mono">
                          <span className="line-through text-slate-500 text-xs">
                            ${billingInterval === 'monthly' ? p.listMonthlyPrice : p.listAnnualPrice}
                          </span>
                          <span className="text-base font-extrabold text-white">
                            ${itemPrice}
                          </span>
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono font-medium">
                          20% Beta Discount
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {billingInterval === 'monthly' ? '/ month' : '/ year'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Anti-Fragile Guarantees Inclusions */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
                <div className="font-semibold text-slate-200 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Guaranteed Subscription Inclusions:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>0.0% Perpetual Revenue Tax</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>0.0% Ad Spend Markup</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Zero-Charge Failure Protection</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>100% Full Dual-Push Git Ejection</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Payment Form & Gateway Selection */}
            <div className="lg:col-span-6 space-y-5">
              
              {/* Payment Gateway Toggle: Shop Pay (Moyer Ventures LLC) vs Sandbox */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('shoppay')}
                  className={`py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'shoppay'
                      ? 'bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  <span>Shop Pay (1-Click)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Credit / Debit Card</span>
                </button>
              </div>

              {paymentMethod === 'shoppay' ? (
                /* Path B: Shopify Checkout & Shop Pay for Moyer Ventures LLC */
                <div className="rounded-2xl border border-purple-800/40 bg-gradient-to-b from-purple-950/30 via-slate-900/90 to-slate-900/95 p-6 sm:p-7 space-y-5 shadow-xl text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-purple-800/30">
                    <div className="flex items-center space-x-2">
                      <div className="px-2.5 py-1 rounded bg-[#5A31F4] text-white font-black text-xs tracking-tight font-sans shadow-sm">
                        shop<span className="text-purple-200">Pay</span>
                      </div>
                      <span className="font-semibold text-purple-200">1-Click Accelerated Checkout</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{checkoutConfig?.organization || 'Moyer Ventures LLC'}</span>
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Merchant Organization:</span>
                      <span className="font-bold text-white font-mono">
                        {checkoutConfig?.organization || 'Moyer Ventures LLC'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Payment Processor:</span>
                      <span className="font-semibold text-purple-300">Shopify Payments & Shop Pay</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Subscription Tier:</span>
                      <span className="font-semibold text-indigo-300">{currentPlan.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Total Billed Today:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">${price}.00 {billingInterval === 'annual' ? '/ yr' : '/ mo'}</span>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-700 text-rose-300 text-xs">
                      {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-1">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Subscriber / Founder Email</label>
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="founder@yourcompany.com"
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-purple-700/50 text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    {/* Automatic Renewal & FTC Negative Option Mandated Disclosures */}
                    <div className="p-3.5 rounded-xl bg-slate-950/90 border border-purple-800/40 text-[11px] text-slate-300 space-y-2">
                      <div className="flex items-center space-x-1.5 text-purple-300 font-semibold text-xs">
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Continuous Subscription &amp; Automatic Renewal Terms</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        By subscribing, your payment method will be charged <strong className="text-white">${price}.00 {billingInterval === 'annual' ? '/ year' : '/ month'}</strong> today (20% off regular list price ${listPrice}.00). <strong className="text-emerald-400">Public Beta Rate Lock:</strong> Your 20% discount is locked for the lifetime of your active subscription and will never increase to regular list price. Subscription automatically renews each {billingInterval === 'annual' ? 'year' : 'month'} at this locked rate unless and until you cancel.
                      </p>
                      <div className="text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                        <strong className="text-slate-200">Click-to-Cancel Guarantee:</strong> You can cancel anytime online in your <a href="#settings" className="text-purple-300 underline font-semibold hover:text-purple-200">Founder Settings</a> or by contacting <a href="mailto:jason@moyervllc.com" className="text-purple-300 underline">jason@moyervllc.com</a> with zero cancellation fees. Cancellation takes effect at the conclusion of your current billing cycle.
                      </div>
                      <label className="flex items-start space-x-2 pt-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          id="terms-consent-checkbox-shoppay"
                          data-testid="terms-consent-checkbox"
                          required
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-purple-700 bg-slate-950 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                        />
                        <span className="text-[11px] text-slate-300 leading-tight">
                          I agree to the{' '}
                          <button
                            type="button"
                            onClick={() => setPolicyModal('terms')}
                            className="text-purple-300 hover:text-purple-200 underline font-medium cursor-pointer"
                          >
                            Terms of Service
                          </button>
                          ,{' '}
                          <button
                            type="button"
                            onClick={() => setPolicyModal('privacy')}
                            className="text-purple-300 hover:text-purple-200 underline font-medium cursor-pointer"
                          >
                            Privacy Policy
                          </button>
                          , and authorize recurring automatic renewal charges under the continuous renewal terms above.
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={processing || !agreedToTerms}
                      data-testid="shoppay-subscription-btn"
                      className="w-full py-4 rounded-xl text-sm font-bold text-white bg-[#5A31F4] hover:bg-[#4d28d6] shadow-lg shadow-purple-950/50 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
                    >
                      {processing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Routing to Shop Pay (Moyer Ventures LLC)...</span>
                        </>
                      ) : (
                        <>
                          <span>Pay with</span>
                          <span className="font-black tracking-tight text-white bg-white/20 px-1.5 py-0.5 rounded">
                            shop<span className="text-purple-200">Pay</span>
                          </span>
                          <span>• ${price}.00</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-center text-slate-400">
                      Zero card typing required. Encrypted 1-click SMS verification via Shop Pay.
                    </p>
                  </form>
                </div>
              ) : (
                /* Credit / Debit Card Panel */
                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-7 space-y-5 shadow-xl">
                    <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                        Credit / Debit Card
                      </h3>
                      <span className="text-xs text-slate-400">256-Bit SSL Encrypted</span>
                    </div>

                    {errorMsg && (
                      <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-700 text-rose-300 text-xs">
                        {errorMsg}
                      </div>
                    )}

                    <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Subscriber / Founder Email</label>
                        <input
                          type="email"
                          required
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="founder@yourcompany.com"
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Card Number</label>
                        <input
                          type="text"
                          required
                          placeholder="•••• •••• •••• ••••"
                          maxLength={19}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Expires (MM/YY)</label>
                          <input
                            type="text"
                            required
                            placeholder="MM / YY"
                            maxLength={5}
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">CVC / CVV</label>
                          <input
                            type="text"
                            required
                            placeholder="CVC"
                            maxLength={4}
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Regular List Price:</span>
                          <span className="line-through text-slate-500 font-mono">
                            ${listPrice}.00 {billingInterval === 'annual' ? '/ yr' : '/ mo'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-emerald-400">
                          <span>Public Beta Savings (20% Off):</span>
                          <span className="font-mono font-semibold">
                            -${savings}.00 {billingInterval === 'annual' ? '/ yr' : '/ mo'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                          <span className="text-slate-300 font-semibold">Total Billed Today:</span>
                          <span className="text-lg font-bold text-white font-mono">
                            ${price}.00 {billingInterval === 'annual' ? '/ yr' : '/ mo'}
                          </span>
                        </div>
                      </div>

                      {/* Automatic Renewal & FTC Negative Option Mandated Disclosures with Beta Rate Lock */}
                      <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 space-y-2">
                        <div className="flex items-center space-x-1.5 text-indigo-400 font-semibold text-xs">
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Continuous Subscription &amp; Automatic Renewal Terms</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed text-[11px]">
                          By subscribing, your payment method will be charged <strong className="text-white">${price}.00 {billingInterval === 'annual' ? '/ year' : '/ month'}</strong> today (20% off regular list price ${listPrice}.00). <strong className="text-emerald-400">Public Beta Rate Lock:</strong> Your 20% discount is locked for the lifetime of your active subscription and will never increase to regular list price. Subscription automatically renews each {billingInterval === 'annual' ? 'year' : 'month'} at this locked rate unless and until you cancel.
                        </p>
                        <div className="text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                          <strong className="text-slate-200">Click-to-Cancel Guarantee:</strong> You can cancel anytime online in your <a href="#settings" className="text-indigo-400 underline font-semibold hover:text-indigo-300">Founder Settings</a> or by contacting <a href="mailto:jason@moyervllc.com" className="text-indigo-400 underline">jason@moyervllc.com</a> with zero cancellation fees. Cancellation takes effect at the conclusion of your current billing cycle.
                        </div>
                        <label className="flex items-start space-x-2 pt-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            id="terms-consent-checkbox-card"
                            data-testid="terms-consent-checkbox"
                            required
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                          />
                          <span className="text-[11px] text-slate-300 leading-tight">
                            I agree to the{' '}
                            <button
                              type="button"
                              onClick={() => setPolicyModal('terms')}
                              className="text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
                            >
                              Terms of Service
                            </button>
                            ,{' '}
                            <button
                              type="button"
                              onClick={() => setPolicyModal('privacy')}
                              className="text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
                            >
                              Privacy Policy
                            </button>
                            , and authorize recurring automatic renewal charges under the continuous renewal terms above.
                          </span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={processing || !agreedToTerms}
                        data-testid="authorize-subscription-btn"
                        className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-glow-indigo transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {processing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            <span>Processing Secure Payment...</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Authorize Subscription (${price}.00)</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-center text-slate-500">
                256-Bit Encrypted • Instant Provisioning • 100% 2PC Escrow Invariant Guarantee
              </p>
            </div>

          </div>
        )}

        {/* Informational Policy Modal triggered from Checkout */}
        {policyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 sm:p-8 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl space-y-5 text-slate-100">
              <button
                onClick={() => setPolicyModal(null)}
                aria-label="Close Policy Dialog"
                title="Close"
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2 text-indigo-400 font-mono text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>MOYER VENTURES LLC • LEGAL POLICIES</span>
              </div>

              <h3 className="text-xl font-bold text-white">
                {policyModal === 'terms' ? 'Terms of Service & Subscriber Agreement' : 'Privacy Policy & Data Protection Disclosures'}
              </h3>

              <div className="text-xs text-slate-300 leading-relaxed space-y-4 font-sans max-h-[55vh] overflow-y-auto pr-2">
                {policyModal === 'terms' ? (
                  <>
                    <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/50 text-[11px] text-indigo-200">
                      <strong>Governing Entity:</strong> Stage Gate OS is operated by <strong>Moyer Ventures LLC</strong> (Utah).
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase">1. 100% IP Assignment to You</h4>
                      <p className="mt-1 text-slate-300">
                        Company irrevocably assigns to you all right, title, and interest in and to all source code, database schemas, and ejected Git repositories generated for your venture. 0.0% perpetual revenue tax and 0 proprietary framework lock-in.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase">2. Recurring Billing &amp; Click-to-Cancel</h4>
                      <p className="mt-1 text-slate-300">
                        Subscriptions renew automatically each month or year until cancelled. Cancel anytime online in settings or via email to jason@moyervllc.com with zero cancellation fees.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase">3. Limitation of Liability</h4>
                      <p className="mt-1 text-slate-400 uppercase text-[10px]">
                        LIABILITY IS CAPPED AT TOTAL FEES PAID IN THE PRIOR 12 MONTHS. NO CONSEQUENTIAL OR PUNITIVE DAMAGES.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase">4. Binding Individual Arbitration</h4>
                      <p className="mt-1 text-slate-300">
                        Governed by the Federal Arbitration Act and Utah law; venue in Salt Lake City, Utah. Class-action waiver applies. 30-day email opt-out to jason@moyervllc.com.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase">5. DMCA Agent</h4>
                      <p className="mt-1 text-slate-300">
                        Designated Agent: Jason Moyer, Moyer Ventures LLC, jason@moyervllc.com.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/50 text-[11px] text-indigo-200">
                      <strong>Data Controller:</strong> Moyer Ventures LLC (Utah). Contact: jason@moyervllc.com.
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase">1. Data Minimization</h4>
                      <p className="mt-1 text-slate-300">
                        We collect contact and billing records to deliver services. We do not sell or monetize personal data or venture ideas.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase">2. Consumer Rights (GDPR &amp; CCPA)</h4>
                      <p className="mt-1 text-slate-300">
                        You have the right to access, delete, and correct your personal information. Email jason@moyervllc.com to exercise your rights.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPolicyModal(null)}
                  className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
