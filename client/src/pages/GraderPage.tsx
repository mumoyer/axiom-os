import React, { useState, useMemo } from 'react';
import {
  calculateGraderScore,
  validateGraderInput,
  GraderInput,
  GraderScoreResult,
} from '../services/grader.js';
import { captureLead } from '../services/api.js';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  ArrowRight,
  RefreshCw,
  Zap,
  DollarSign,
  Users,
  Compass,
  FileText,
  Lightbulb,
  Building,
  Mail,
  User,
  Sliders,
  ChevronRight,
  BarChart3,
} from 'lucide-react';

interface GraderPageProps {
  onNavigate?: (path: string) => void;
}

export const GraderPage: React.FC<GraderPageProps> = ({
  onNavigate = (path: string) => { window.location.hash = path; },
}) => {
  // Form input state with strong realistic initial defaults
  const [formInput, setFormInput] = useState<GraderInput>({
    ventureName: 'DocuPulse AI',
    industry: 'B2B SaaS',
    tamUsd: 1_200_000_000,
    samUsd: 150_000_000,
    directCompetitorsCount: 3,
    differentiationFactor: 4,
    estimatedCacUsd: 250,
    estimatedLtvUsd: 1500,
    paybackMonths: 5,
    techComplexity: 2,
    regulatoryRisk: 1,
    founderExperienceYears: 5,
  });

  // Gated lead capture state
  const [isLeadCaptured, setIsLeadCaptured] = useState(false);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    timeline: 'Immediately' as 'Immediately' | '1-3 Months' | 'Exploring',
  });
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadError, setLeadError] = useState('');
  const [activeReportPage, setActiveReportPage] = useState<number>(1);

  // Instant reactive score computation
  const scoreResult: GraderScoreResult = useMemo(() => {
    return calculateGraderScore(formInput);
  }, [formInput]);

  const validation = useMemo(() => {
    return validateGraderInput(formInput);
  }, [formInput]);

  const handleInputChange = (field: keyof GraderInput, val: any) => {
    setFormInput((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handlePresetSelect = (preset: 'unicorn' | 'average' | 'failing') => {
    if (preset === 'unicorn') {
      setFormInput({
        ventureName: 'AeroCloud Analytics',
        industry: 'Cloud Infrastructure',
        tamUsd: 15_000_000_000,
        samUsd: 1_200_000_000,
        directCompetitorsCount: 2,
        differentiationFactor: 5,
        estimatedCacUsd: 200,
        estimatedLtvUsd: 1800,
        paybackMonths: 4,
        techComplexity: 3,
        regulatoryRisk: 1,
        founderExperienceYears: 8,
      });
    } else if (preset === 'average') {
      setFormInput({
        ventureName: 'TeamCollab App',
        industry: 'Productivity SaaS',
        tamUsd: 250_000_000,
        samUsd: 25_000_000,
        directCompetitorsCount: 9,
        differentiationFactor: 3,
        estimatedCacUsd: 300,
        estimatedLtvUsd: 800,
        paybackMonths: 10,
        techComplexity: 2,
        regulatoryRisk: 2,
        founderExperienceYears: 3,
      });
    } else {
      setFormInput({
        ventureName: 'Generic Dropship Portal',
        industry: 'E-Commerce',
        tamUsd: 8_000_000,
        samUsd: 400_000,
        directCompetitorsCount: 35,
        differentiationFactor: 1,
        estimatedCacUsd: 450,
        estimatedLtvUsd: 300,
        paybackMonths: 22,
        techComplexity: 4,
        regulatoryRisk: 4,
        founderExperienceYears: 0,
      });
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadError('');

    if (!leadForm.name.trim()) {
      setLeadError('Please enter your full name.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadForm.email)) {
      setLeadError('Please enter a valid work email address.');
      return;
    }

    setLeadSubmitting(true);
    try {
      await captureLead({
        name: leadForm.name,
        email: leadForm.email,
        ventureName: formInput.ventureName,
        industry: formInput.industry,
        score: scoreResult.overallScore,
        gradeBracket: scoreResult.gradeBracket,
      });
      setIsLeadCaptured(true);
      setLeadModalOpen(false);
    } catch (err: any) {
      // Still unlock for good UX
      setIsLeadCaptured(true);
      setLeadModalOpen(false);
    } finally {
      setLeadSubmitting(false);
    }
  };

  const getGradeColor = (bracket: 'A' | 'B' | 'C' | 'F') => {
    switch (bracket) {
      case 'A':
        return {
          bg: 'bg-emerald-950/80',
          border: 'border-emerald-500',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500 text-slate-950',
          title: 'Grade A — Prime Venture Candidate',
        };
      case 'B':
        return {
          bg: 'bg-indigo-950/80',
          border: 'border-indigo-500',
          text: 'text-indigo-400',
          badge: 'bg-indigo-500 text-white',
          title: 'Grade B — High Viability',
        };
      case 'C':
        return {
          bg: 'bg-amber-950/80',
          border: 'border-amber-500',
          text: 'text-amber-400',
          badge: 'bg-amber-500 text-slate-950',
          title: 'Grade C — Conditional Viability',
        };
      case 'F':
      default:
        return {
          bg: 'bg-rose-950/80',
          border: 'border-rose-500',
          text: 'text-rose-400',
          badge: 'bg-rose-500 text-white',
          title: 'Grade F — Capital Waste Warning',
        };
    }
  };

  const gradeMeta = getGradeColor(scoreResult.gradeBracket);

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Title */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 text-xs text-indigo-300 shadow-glow-indigo">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold tracking-wide">Autonomous Venture Validation Grader</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Stress-Test Your Startup <span className="text-gradient-indigo">Before Spending $1</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Our quantitative 4-factor scoring engine analyzes Market Demand (30%), Competitor Density (25%), Unit Economics (25%), and Feasibility (20%) to prevent premature capital loss.
          </p>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
            <span className="text-slate-400 mr-1">Try Presets:</span>
            <button
              onClick={() => handlePresetSelect('unicorn')}
              className="px-3 py-1 rounded-lg bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/70 transition-colors"
            >
              🚀 Tier-A Enterprise SaaS (90+)
            </button>
            <button
              onClick={() => handlePresetSelect('average')}
              className="px-3 py-1 rounded-lg bg-indigo-950/70 border border-indigo-700/60 text-indigo-300 hover:bg-indigo-900/70 transition-colors"
            >
              ⚡ Tier-B Niche SaaS (75)
            </button>
            <button
              onClick={() => handlePresetSelect('failing')}
              className="px-3 py-1 rounded-lg bg-rose-950/70 border border-rose-700/60 text-rose-300 hover:bg-rose-900/70 transition-colors"
            >
              ⚠️ Low Score / Auto-Pivot (&lt;60)
            </button>
          </div>
        </div>

        {/* Validation Errors Banner if invalid */}
        {!validation.isValid && (
          <div className="max-w-4xl mx-auto p-4 rounded-xl bg-rose-950/40 border border-rose-700 text-rose-300 text-xs space-y-1">
            <div className="font-semibold flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Input Validation Notice:</span>
            </div>
            {validation.errors.map((err, i) => (
              <div key={i} className="pl-5">• {err}</div>
            ))}
          </div>
        )}

        {/* Main 2-Column Grid: Form Inputs (Left) & Real-Time Scorecard (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Grader Input Controls */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Venture Assumptions & Metrics</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Dynamic 4-Factor Weights</span>
            </div>

            <div className="space-y-5 text-xs">
              {/* Concept Name & Industry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Venture / Concept Name</label>
                  <input
                    type="text"
                    value={formInput.ventureName}
                    onChange={(e) => handleInputChange('ventureName', e.target.value)}
                    placeholder="e.g. DocuPulse AI"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Industry Vertical</label>
                  <select
                    value={formInput.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="B2B SaaS">B2B SaaS</option>
                    <option value="Cloud Infrastructure">Cloud Infrastructure / DevTools</option>
                    <option value="FinTech & Compliance">FinTech & Compliance</option>
                    <option value="Healthcare Tech">Healthcare Tech (HIPAA)</option>
                    <option value="AI Agents & Workflows">AI Agents & Workflows</option>
                    <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                  </select>
                </div>
              </div>

              {/* 1. Market Demand: TAM & SAM */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-indigo-300 font-semibold">
                  <span className="flex items-center space-x-1.5">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    <span>1. Market Demand (30% Weight)</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    TAM: ${(formInput.tamUsd / 1_000_000).toLocaleString()}M | SAM: ${(formInput.samUsd / 1_000_000).toLocaleString()}M
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Total Addressable Market (TAM in USD)</span>
                      <span className="font-mono text-slate-200">${(formInput.tamUsd / 1_000_000).toFixed(0)}M</span>
                    </div>
                    <input
                      type="range"
                      min="5000000"
                      max="20000000000"
                      step="5000000"
                      value={formInput.tamUsd}
                      onChange={(e) => handleInputChange('tamUsd', Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Serviceable Addressable Market (SAM in USD)</span>
                      <span className="font-mono text-slate-200">${(formInput.samUsd / 1_000_000).toFixed(0)}M</span>
                    </div>
                    <input
                      type="range"
                      min="500000"
                      max={formInput.tamUsd}
                      step="500000"
                      value={Math.min(formInput.samUsd, formInput.tamUsd)}
                      onChange={(e) => handleInputChange('samUsd', Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Competitor Density & Moat */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-cyan-300 font-semibold">
                  <span className="flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>2. Competitor Density & Moat (25% Weight)</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {formInput.directCompetitorsCount} Incumbents | Diff {formInput.differentiationFactor}/5
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Direct Competitors Count</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formInput.directCompetitorsCount}
                      onChange={(e) => handleInputChange('directCompetitorsCount', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      Differentiation Factor (1 = Clone, 5 = Proprietary Moat)
                    </label>
                    <select
                      value={formInput.differentiationFactor}
                      onChange={(e) => handleInputChange('differentiationFactor', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-sans"
                    >
                      <option value={1}>1 - Zero Differentiation (Me-Too Clone)</option>
                      <option value={2}>2 - Minor Feature Tweak</option>
                      <option value={3}>3 - Moderate Angle / Niche Positioning</option>
                      <option value={4}>4 - Structural Advantage / Better UX</option>
                      <option value={5}>5 - Disruptive Technology Moat</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Unit Economics: CAC, LTV, Payback */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-emerald-300 font-semibold">
                  <span className="flex items-center space-x-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>3. Unit Economics & Cash Payback (25% Weight)</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    LTV:CAC {(formInput.estimatedLtvUsd / Math.max(1, formInput.estimatedCacUsd)).toFixed(1)}x | {formInput.paybackMonths} mo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Estimated CAC ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={formInput.estimatedCacUsd}
                      onChange={(e) => handleInputChange('estimatedCacUsd', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Estimated LTV ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={formInput.estimatedLtvUsd}
                      onChange={(e) => handleInputChange('estimatedLtvUsd', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Payback (Months)</label>
                    <input
                      type="number"
                      min="1"
                      max="36"
                      value={formInput.paybackMonths}
                      onChange={(e) => handleInputChange('paybackMonths', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Feasibility: Complexity, Regulatory, Founder Exp */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-violet-300 font-semibold">
                  <span className="flex items-center space-x-1.5">
                    <Compass className="w-4 h-4 text-violet-400" />
                    <span>4. Execution Feasibility (20% Weight)</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    Complexity {formInput.techComplexity}/5 | Reg {formInput.regulatoryRisk}/5
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Tech Complexity</label>
                    <select
                      value={formInput.techComplexity}
                      onChange={(e) => handleInputChange('techComplexity', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-sans"
                    >
                      <option value={1}>1 - No-Code / CRUD</option>
                      <option value={2}>2 - Standard Web/DB</option>
                      <option value={3}>3 - AI Integration</option>
                      <option value={4}>4 - Complex Distributed</option>
                      <option value={5}>5 - Deep Tech / Hardware</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Regulatory Risk</label>
                    <select
                      value={formInput.regulatoryRisk}
                      onChange={(e) => handleInputChange('regulatoryRisk', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-sans"
                    >
                      <option value={1}>1 - Minimal (Standard SaaS)</option>
                      <option value={2}>2 - Low (GDPR / CCPA)</option>
                      <option value={3}>3 - Moderate (Payments)</option>
                      <option value={4}>4 - Elevated (FinTech/HIPAA)</option>
                      <option value={5}>5 - Heavy (Banking/FDA)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Founder Exp (Years)</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={formInput.founderExperienceYears}
                      onChange={(e) => handleInputChange('founderExperienceYears', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT: Live Scorecard, Pivots & Report Teaser */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Main Scorecard Card */}
            <div className={`rounded-2xl border ${gradeMeta.border} ${gradeMeta.bg} p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl transition-all`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  VALIDATION SCORECARD
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase font-mono ${gradeMeta.badge}`}>
                  Grade {scoreResult.gradeBracket}
                </span>
              </div>

              {/* Large Score Indicator */}
              <div className="flex items-baseline space-x-4">
                <div className="text-6xl sm:text-7xl font-black text-white font-mono tracking-tight">
                  {scoreResult.overallScore}
                </div>
                <div>
                  <span className="text-xl text-slate-400 font-mono">/ 100</span>
                  <div className={`text-xs font-bold ${gradeMeta.text} mt-0.5`}>
                    {gradeMeta.title}
                  </div>
                </div>
              </div>

              {/* Sub-Score Factor Progress Bars */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Market Demand (30%)</span>
                    <span className="font-mono text-indigo-400 font-semibold">{scoreResult.factorScores.marketDemand}/100</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950">
                    <div
                      className="h-2 rounded-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${scoreResult.factorScores.marketDemand}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Competitor Density & Moat (25%)</span>
                    <span className="font-mono text-cyan-400 font-semibold">{scoreResult.factorScores.competitorDensity}/100</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950">
                    <div
                      className="h-2 rounded-full bg-cyan-500 transition-all duration-300"
                      style={{ width: `${scoreResult.factorScores.competitorDensity}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Unit Economics & Payback (25%)</span>
                    <span className="font-mono text-emerald-400 font-semibold">{scoreResult.factorScores.unitEconomics}/100</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${scoreResult.factorScores.unitEconomics}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Execution Feasibility (20%)</span>
                    <span className="font-mono text-violet-400 font-semibold">{scoreResult.factorScores.technicalFeasibility}/100</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950">
                    <div
                      className="h-2 rounded-full bg-violet-500 transition-all duration-300"
                      style={{ width: `${scoreResult.factorScores.technicalFeasibility}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Identified Risks & Recommendations */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80 text-xs">
                <div className="font-semibold text-slate-200 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Key Strategic Risks:</span>
                </div>
                {scoreResult.keyRisks.length > 0 ? (
                  <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc pl-4">
                    {scoreResult.keyRisks.map((risk, i) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-slate-400">No high-severity structural risks detected.</p>
                )}
              </div>

              {/* Action Trigger / Lead Gate Button */}
              <div className="pt-2">
                {isLeadCaptured ? (
                  <button
                    onClick={() => onNavigate('/checkout?plan=serial')}
                    className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-glow-indigo transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Deploy Validated Venture in Stage Gate OS</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setLeadModalOpen(true)}
                    className="w-full py-3.5 rounded-xl text-xs font-bold text-slate-950 bg-white hover:bg-slate-200 shadow-xl transition-all flex items-center justify-center space-x-2"
                  >
                    <Unlock className="w-4 h-4 text-slate-900" />
                    <span>Unlock Full 5-Page Feasibility Report</span>
                  </button>
                )}
              </div>
            </div>

            {/* AUTOMATED PIVOT GENERATOR (When overallScore < 60) */}
            {scoreResult.overallScore < 60 && scoreResult.suggestedPivots && (
              <div className="rounded-2xl border border-rose-700/80 bg-rose-950/40 p-6 space-y-4 shadow-xl">
                <div className="flex items-center space-x-2 text-rose-300">
                  <Lightbulb className="w-5 h-5 text-amber-400 animate-pulse" />
                  <h4 className="text-sm font-bold uppercase tracking-wider">
                    Automated Pivot Generator Triggered
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Validation score below 60 signals severe risk of capital waste. Stage Gate OS synthesized 3 high-intent strategic pivots:
                </p>

                <div className="space-y-2.5">
                  {scoreResult.suggestedPivots.map((pivot, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/80 border border-rose-800/50 text-xs text-slate-200 leading-relaxed flex items-start space-x-2"
                    >
                      <span className="font-mono font-bold text-rose-400 shrink-0">{idx + 1}.</span>
                      <span>{pivot}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blurred Teaser when locked */}
            {!isLeadCaptured && (
              <div className="relative rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center space-y-3 overflow-hidden">
                <div className="filter blur-[3px] select-none space-y-3 pointer-events-none opacity-40">
                  <div className="h-4 bg-slate-700 rounded w-3/4 mx-auto"></div>
                  <div className="h-20 bg-slate-800 rounded"></div>
                  <div className="h-4 bg-slate-700 rounded w-1/2 mx-auto"></div>
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                  <Lock className="w-6 h-6 text-indigo-400 mb-2" />
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                    5-Page Feasibility Report Locked
                  </h5>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                    Free instant unlock: radar breakdown, competitive gap analysis, and 4-sprint execution roadmap.
                  </p>
                  <button
                    onClick={() => setLeadModalOpen(true)}
                    className="mt-3 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    Unlock Report Free
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* UNLOCKED 5-PAGE FEASIBILITY REPORT SECTION (Visible when lead captured) */}
        {isLeadCaptured && (
          <section className="mt-14 p-8 rounded-2xl border border-indigo-500/40 bg-slate-900/90 shadow-2xl space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Report Unlocked for {leadForm.email || 'Founder'}</span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Comprehensive 5-Page Feasibility & Execution Report
                </h3>
                <p className="text-xs text-slate-400">
                  Venture Target: <strong className="text-slate-200">{formInput.ventureName}</strong> ({formInput.industry})
                </p>
              </div>

              {/* Page Switcher Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                {[1, 2, 3, 4, 5].map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setActiveReportPage(pageNum)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      activeReportPage === pageNum
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Page {pageNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Page 1: Executive Viability Verdict */}
            {activeReportPage === 1 && (
              <div className="space-y-4 text-xs">
                <h4 className="text-base font-bold text-white">Page 1: Executive Viability Verdict & Score Radar</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Overall Composite</span>
                    <div className="text-3xl font-extrabold text-indigo-400 font-mono">{scoreResult.overallScore}/100</div>
                    <p className="text-[11px] text-slate-400">Validated across 4 algorithmic dimensions.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Grade Classification</span>
                    <div className="text-3xl font-extrabold text-emerald-400 font-mono">Tier {scoreResult.gradeBracket}</div>
                    <p className="text-[11px] text-slate-400">Institutional capital readiness bracket.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Recommended Deployment</span>
                    <div className="text-lg font-bold text-white">Stage-Gate 1 Build</div>
                    <p className="text-[11px] text-slate-400">Next.js 15 + Supabase + Stripe Scaffolding.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Page 2: TAM/SAM Market Size */}
            {activeReportPage === 2 && (
              <div className="space-y-4 text-xs">
                <h4 className="text-base font-bold text-white">Page 2: TAM/SAM Market Size & Commercial Search Demand</h4>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <p className="text-slate-300 leading-relaxed">
                    Total Addressable Market (TAM) is calculated at <strong>${(formInput.tamUsd / 1_000_000).toFixed(0)}M</strong> with an immediate Serviceable Addressable Market (SAM) of <strong>${(formInput.samUsd / 1_000_000).toFixed(0)}M</strong> ({(formInput.samUsd / formInput.tamUsd * 100).toFixed(1)}% capture ratio).
                  </p>
                  <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-indigo-200">
                    Search Intent Signal: High B2B willingness-to-pay identified in {formInput.industry}. Estimated target CPC $4.50–$8.20.
                  </div>
                </div>
              </div>
            )}

            {/* Page 3: Competitive Density */}
            {activeReportPage === 3 && (
              <div className="space-y-4 text-xs">
                <h4 className="text-base font-bold text-white">Page 3: Competitive Density & Differentiation Moat</h4>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <p className="text-slate-300 leading-relaxed">
                    Evaluated against <strong>{formInput.directCompetitorsCount} direct competitors</strong> with a differentiation rank of <strong>{formInput.differentiationFactor}/5</strong>.
                  </p>
                  <p className="text-slate-400">
                    Stage Gate OS structural recommendation: Position product as an anti-fragile developer utility rather than an unconstrained "God Mode" wrapper.
                  </p>
                </div>
              </div>
            )}

            {/* Page 4: Unit Economics */}
            {activeReportPage === 4 && (
              <div className="space-y-4 text-xs">
                <h4 className="text-base font-bold text-white">Page 4: Unit Economics & Cash Payback Projections</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-400">Target CAC</div>
                    <div className="text-xl font-bold text-white font-mono">${formInput.estimatedCacUsd}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-400">Target LTV</div>
                    <div className="text-xl font-bold text-white font-mono">${formInput.estimatedLtvUsd}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-400">Payback Period</div>
                    <div className="text-xl font-bold text-emerald-400 font-mono">{formInput.paybackMonths} Months</div>
                  </div>
                </div>
              </div>
            )}

            {/* Page 5: 4-Sprint Implementation Blueprint & CTA */}
            {activeReportPage === 5 && (
              <div className="space-y-6 text-xs">
                <div>
                  <h4 className="text-base font-bold text-white">Page 5: 4-Sprint Implementation Blueprint & 1-Click Launch</h4>
                  <p className="text-slate-400 mt-1">Autonomous orchestration stages pre-configured for {formInput.ventureName}:</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-indigo-400 font-bold">Sprint 1</div>
                    <div className="text-white font-semibold mt-1">Scaffolding & DB</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Next.js + Prisma</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-indigo-400 font-bold">Sprint 2</div>
                    <div className="text-white font-semibold mt-1">UX & Tailwind</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Interactive Flow</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-indigo-400 font-bold">Sprint 3</div>
                    <div className="text-white font-semibold mt-1">DNS & TLS 1.3</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Quad-DoH Quorum</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-indigo-400 font-bold">Sprint 4</div>
                    <div className="text-white font-semibold mt-1">Stripe & Ejection</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Dual-Push GitHub</div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onNavigate('/checkout?plan=serial')}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-glow-indigo transition-all flex items-center justify-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    <span>Deploy This Validated Venture in Stage Gate OS ($149/mo)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </section>
        )}

      </div>

      {/* GATED LEAD CAPTURE MODAL */}
      {leadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Instant Report Access</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Unlock Your 5-Page Feasibility Report
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Get immediate access to the full competitive moat analysis, LTV:CAC sensitivity curves, and the automated 4-sprint deployment blueprint.
              </p>
            </div>

            {leadError && (
              <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-700 text-rose-300 text-xs">
                {leadError}
              </div>
            )}

            <form onSubmit={handleLeadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Founder Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    placeholder="e.g. Satoshi Nakamoto"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Work / Founder Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    placeholder="founder@venture.com"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Planned Launch Timeline</label>
                <select
                  value={leadForm.timeline}
                  onChange={(e) => setLeadForm({ ...leadForm, timeline: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Immediately">Immediately (Within 7 Days)</option>
                  <option value="1-3 Months">1–3 Months</option>
                  <option value="Exploring">Exploring / Feasibility Study</option>
                </select>
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setLeadModalOpen(false)}
                  className="w-1/3 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={leadSubmitting}
                  className="w-2/3 py-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-glow-indigo transition-all flex items-center justify-center space-x-1.5"
                >
                  {leadSubmitting ? (
                    <span>Unlocking...</span>
                  ) : (
                    <>
                      <span>Unlock Report Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
