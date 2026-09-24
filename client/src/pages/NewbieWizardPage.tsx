import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Layers,
  Terminal,
  DollarSign,
  Users,
  Target,
  Briefcase,
  Sliders,
  Check,
  AlertCircle,
  HelpCircle,
  Zap,
  Lock,
  RotateCcw,
} from 'lucide-react';

import { CONCEPT_PRESETS } from '../demo/scenarios.js';

export interface NewbieWizardPageProps {
  onNavigate?: (path: string) => void;
}

export interface WizardState {
  // Step 1
  name: string;
  slug: string;
  tagline: string;
  problem: string;
  solution: string;
  industry: string;
  // Step 2
  targetSegment: string;
  selectedPainPoints: string[];
  customPainPoint: string;
  valueVector: string;
  // Step 3
  pricingArchetype: 'subscription' | 'usage' | 'freemium' | 'enterprise';
  targetArpu: number;
  estimatedCac: number;
}

const INDUSTRIES = [
  'Healthcare',
  'LegalTech',
  'B2B SaaS & Automation',
  'Developer Tools',
  'E-Commerce & Retail',
  'FinTech & Compliance',
  'EdTech',
  'Real Estate & PropTech',
];

const COMMON_PAIN_POINTS = [
  'Manual repetitive data entry',
  'High compliance audit risk',
  'Slow turnaround times',
  'Fragmented legacy tooling',
  'High customer churn',
  'Expensive third-party consulting fees',
  'Lack of real-time operational visibility',
  'Human error in critical calculations',
];

export const NewbieWizardPage: React.FC<NewbieWizardPageProps> = ({
  onNavigate = (path: string) => { window.location.hash = path; },
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxVisitedStep, setMaxVisitedStep] = useState<number>(() => {
    const saved = localStorage.getItem('stagegate_wizard_max_step');
    return saved ? Math.max(1, parseInt(saved, 10)) : 1;
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Wizard state: clean live defaults (never pre-filled with demo data)
  const [formData, setFormData] = useState<WizardState>(() => {
    const saved = localStorage.getItem('stagegate_wizard_state') || localStorage.getItem('axiom_wizard_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name !== 'DocuFlow AI') {
          return parsed;
        }
      } catch {}
    }
    return {
      name: '',
      slug: '',
      tagline: '',
      problem: '',
      solution: '',
      industry: 'B2B SaaS & Automation',
      targetSegment: '',
      selectedPainPoints: [],
      customPainPoint: '',
      valueVector: 'revenue',
      pricingArchetype: 'subscription',
      targetArpu: 99,
      estimatedCac: 75,
    };
  });

  // Save state on change
  useEffect(() => {
    localStorage.setItem('stagegate_wizard_state', JSON.stringify(formData));
  }, [formData]);

  // Persist maxVisitedStep
  useEffect(() => {
    localStorage.setItem('stagegate_wizard_max_step', maxVisitedStep.toString());
  }, [maxVisitedStep]);

  const updateField = <K extends keyof WizardState>(field: K, value: WizardState[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && typeof value === 'string') {
        next.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
      return next;
    });
  };

  // Safe preset application: preserves downstream steps 2-4 if user has already entered data or visited downstream steps
  const applyPreset = (preset: typeof CONCEPT_PRESETS[0], overwriteAll: boolean = false) => {
    setFormData((prev) => {
      const step1Only = {
        ...prev,
        name: preset.name,
        slug: preset.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        tagline: preset.tagline,
        problem: preset.problem,
        solution: preset.solution,
        industry: preset.industry,
      };

      if (!overwriteAll) {
        // PRESERVE Steps 2, 3, 4 entered data!
        return step1Only;
      }

      // Complete overwrite (only when explicitly requested)
      return {
        ...step1Only,
        targetSegment: preset.targetSegment,
        selectedPainPoints: [...preset.painPoints],
        valueVector: preset.valueVector,
        pricingArchetype: preset.pricingArchetype,
        targetArpu: preset.targetArpu,
        estimatedCac: preset.estimatedCac,
      };
    });
  };

  const handlePresetClick = (preset: typeof CONCEPT_PRESETS[0]) => {
    // Quick Inspiration on Step 1 applies full concept template on fresh form, or preserves custom steps 2-4 if already visited
    applyPreset(preset, maxVisitedStep <= 1);
  };

  const togglePainPoint = (painPoint: string) => {
    setFormData((prev) => {
      const exists = prev.selectedPainPoints.includes(painPoint);
      return {
        ...prev,
        selectedPainPoints: exists
          ? prev.selectedPainPoints.filter((p) => p !== painPoint)
          : [...prev.selectedPainPoints, painPoint],
      };
    });
  };

  const addCustomPainPoint = () => {
    if (!formData.customPainPoint.trim()) return;
    if (!formData.selectedPainPoints.includes(formData.customPainPoint.trim())) {
      setFormData((prev) => ({
        ...prev,
        selectedPainPoints: [...prev.selectedPainPoints, prev.customPainPoint.trim()],
        customPainPoint: '',
      }));
    }
  };

  // Step Validation
  const validateStep = (step: number): boolean => {
    setErrorMessage(null);
    if (step === 1) {
      if (!formData.name.trim() || formData.name.length < 2) {
        setErrorMessage('Please enter a valid venture name (at least 2 characters).');
        return false;
      }
      if (!formData.problem.trim() || formData.problem.length < 10) {
        setErrorMessage('Please provide a problem narrative with at least 10 characters.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!formData.targetSegment) {
        setErrorMessage('Please select a target customer segment.');
        return false;
      }
      if (formData.selectedPainPoints.length === 0) {
        setErrorMessage('Please select at least one customer pain point.');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!formData.pricingArchetype) {
        setErrorMessage('Please choose a monetization archetype.');
        return false;
      }
      if (formData.targetArpu <= 0) {
        setErrorMessage('Please specify a positive target ARPU / monthly price.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      const nextStep = Math.min(4, currentStep + 1);
      setCurrentStep(nextStep);
      setMaxVisitedStep((prev) => Math.max(prev, nextStep));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepJump = (targetStep: number) => {
    setErrorMessage(null);
    // Allow jumping to any step already visited (or current step)
    if (targetStep <= maxVisitedStep) {
      setCurrentStep(targetStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (targetStep === currentStep + 1 && validateStep(currentStep)) {
      setCurrentStep(targetStep);
      setMaxVisitedStep((prev) => Math.max(prev, targetStep));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 4: Authorize Escrow & Launch
  const handleAuthorizeAndLaunch = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      name: formData.name,
      tenantId: 'tenant-default',
      planTier: 'FOUNDER',
      description: `${formData.tagline} - ${formData.problem}`,
    };

    try {
      // POST to backend
      const res = await fetch('/api/ventures?async=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const ventureId = data.venture?.id;
        if (!ventureId) {
          throw new Error('Server returned successful status without a venture ID.');
        }

        // Clear wizard drafts from local storage on successful launch
        try {
          localStorage.removeItem('stagegate_wizard_state');
          localStorage.removeItem('stagegate_wizard_max_step');
        } catch {}

        // Save venture to user local storage portfolio registry
        try {
          const userVentures = JSON.parse(localStorage.getItem('stagegate_user_ventures') || '[]');
          const newVenture = {
            id: ventureId,
            name: formData.name,
            domain: `${ventureId.slice(0, 8)}.axiomrun.app`,
            stagingUrl: `https://stage-${ventureId.slice(0, 8)}.axiomrun.app`,
            planTier: 'FOUNDER',
            status: 'INITIALIZING',
            mrr: 0,
            uptime: 100.0,
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem('stagegate_user_ventures', JSON.stringify([newVenture, ...userVentures]));
        } catch {}

        // Navigate to live dashboard
        onNavigate(`/ventures/${ventureId}`);
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(
          errData.error || errData.message || 'Failed to initialize venture execution pipeline. Please try again.'
        );
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Network error: Unable to reach venture provisioning service. Please check your connection.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unit economics derived values
  const projectedLtv = Math.round(formData.targetArpu * (1 / 0.05) * 0.85); // 5% churn, 85% margin
  const ltvCacRatio = (projectedLtv / Math.max(1, formData.estimatedCac)).toFixed(1);
  const paybackMonths = (formData.estimatedCac / Math.max(1, formData.targetArpu * 0.85)).toFixed(1);

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Wizard Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Busy 9-to-5 Founder Launchpad</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Launch Your Side Business in 4 Guided Steps
          </h1>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            15 minutes to configure. Zero coding required. Our deterministic stage gates build, test, and wire your Stripe and GitHub infrastructure autonomously.
          </p>
        </div>

        {/* 4-Step Stepper Bar */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
          <div className="grid grid-cols-4 gap-2">
            {[
              { num: 1, label: 'Concept Ingestion', icon: Cpu },
              { num: 2, label: 'Target Persona', icon: Users },
              { num: 3, label: 'Business Model', icon: DollarSign },
              { num: 4, label: 'Blueprint Escrow', icon: ShieldCheck },
            ].map((step) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.num;
              const isPast = currentStep > step.num;
              const isReachable = step.num <= maxVisitedStep;

              return (
                <div
                  key={step.num}
                  onClick={() => {
                    handleStepJump(step.num);
                  }}
                  className={`flex flex-col sm:flex-row items-center sm:space-x-3 p-2.5 rounded-xl transition-all select-none ${
                    isActive
                      ? 'bg-indigo-950/70 border border-indigo-600/50 shadow-glow-indigo'
                      : isReachable
                      ? 'cursor-pointer bg-slate-900/50 border border-emerald-900/40 hover:bg-slate-900/90'
                      : 'opacity-40 bg-slate-950 border border-transparent cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : isPast || isReachable
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPast || (isReachable && !isActive) ? <Check className="w-4 h-4" /> : step.num}
                  </div>
                  <div className="text-center sm:text-left mt-1 sm:mt-0">
                    <div className="text-xs font-semibold text-slate-200 hidden sm:block">Step {step.num}</div>
                    <div className="text-[11px] sm:text-xs text-slate-400 truncate max-w-[120px]">{step.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="rounded-xl p-3.5 bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Concept Ingestion */}
        {currentStep === 1 && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  <span>Step 1: Venture Concept Ingestion</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Define your core concept, problem context, and target market domain.
                </p>
              </div>

              {/* Quick preset selector */}
              <div className="text-xs text-slate-400">
                <div className="flex items-center justify-between sm:justify-end gap-2 mb-1">
                  <span className="text-[11px] text-slate-400">Quick Inspiration:</span>
                  {maxVisitedStep > 1 && (
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                      ✓ Steps 2–4 preserved
                    </span>
                  )}
                </div>
                <div className="inline-flex flex-wrap gap-1.5">
                  {CONCEPT_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handlePresetClick(p)}
                      title={maxVisitedStep > 1 ? `Applies concept details to Step 1 without modifying your custom configurations in steps 2–4` : undefined}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-indigo-900/60 border border-slate-800 hover:border-indigo-700 text-[11px] text-slate-300 transition-colors"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Venture Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                  <span>Venture Name *</span>
                  <span className="text-slate-500 font-normal text-[11px]">Auto-slugged for staging</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. MetricFlow, TaskSync, PulseAI"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-1">
                  <span>Preview domain:</span>
                  <span className="text-indigo-400">https://{formData.slug || 'myventure'}.axiomrun.app</span>
                </div>
              </div>

              {/* Industry Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">Target Industry *</label>
                <select
                  value={formData.industry}
                  onChange={(e) => updateField('industry', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Elevator Tagline */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">Tagline & Elevator Pitch *</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => updateField('tagline', e.target.value)}
                placeholder="One sentence describing what your venture does and who it helps"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Problem Statement */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">The Problem Being Solved *</label>
              <textarea
                rows={3}
                value={formData.problem}
                onChange={(e) => updateField('problem', e.target.value)}
                placeholder="Describe what manual, painful problem your customers face today..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Solution Statement */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                <span>The Autonomous Solution *</span>
                <span className="text-slate-500 font-normal text-[11px]">How does Stage Gate OS solve this?</span>
              </label>
              <textarea
                rows={3}
                value={formData.solution}
                onChange={(e) => updateField('solution', e.target.value)}
                placeholder="Describe how your software product will eliminate this problem automatically..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-glow-indigo transition-all"
              >
                <span>Continue to Target Persona</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Target Persona & ICP Formulation */}
        {currentStep === 2 && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>Step 2: Target Persona & ICP Formulation</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pinpoint who will pay for this venture and their primary value motivation.
              </p>
            </div>

            {/* Customer Segment Cards */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-200">Target Customer Segment *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'SMB & Solo Practice Owners',
                    desc: 'Doctors, lawyers, dentists, agency owners with 1-25 staff members',
                  },
                  {
                    id: 'B2B Mid-Market Teams',
                    desc: 'Department heads in 50-500 person organizations seeking workflow automation',
                  },
                  {
                    id: 'SaaS Founders & Solo Creators',
                    desc: 'Technical and non-technical online entrepreneurs building bootstrapped products',
                  },
                  {
                    id: 'Enterprise Studios & Labs',
                    desc: 'Innovation managers in Fortune 500 companies managing corporate venture budgets',
                  },
                ].map((seg) => (
                  <div
                    key={seg.id}
                    onClick={() => updateField('targetSegment', seg.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formData.targetSegment === seg.id
                        ? 'bg-indigo-950/60 border-indigo-500/80 ring-1 ring-indigo-500/50'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-100">{seg.id}</div>
                      {formData.targetSegment === seg.id && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{seg.desc}</div>
                  </div>
                ))}
              </div>
            </div>

              {/* Pain Points Multi-select */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                  <span>Select ICP Pain Points *</span>
                  <span className="text-slate-500 text-[11px]">Choose all that apply</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {/* Preset and custom pain points */}
                  {Array.from(new Set([...COMMON_PAIN_POINTS, ...formData.selectedPainPoints])).map((pp) => {
                    const isSelected = formData.selectedPainPoints.includes(pp);
                    return (
                      <button
                        key={pp}
                        type="button"
                        onClick={() => togglePainPoint(pp)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {pp}
                      </button>
                    );
                  })}
                </div>

                {/* Custom pain point entry */}
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="text"
                    placeholder="Or enter a custom pain point..."
                    value={formData.customPainPoint}
                    onChange={(e) => updateField('customPainPoint', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomPainPoint();
                      }
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 flex-1"
                  />
                  <button
                    type="button"
                    onClick={addCustomPainPoint}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

            {/* Primary Value Vector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-200">Primary Value Vector *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'speed', label: 'Speed & Velocity', desc: '10x faster execution' },
                  { id: 'cost', label: 'Cost Reduction', desc: 'Cut operating spend 60%' },
                  { id: 'compliance', label: 'Risk & Compliance', desc: 'Zero regulatory breach' },
                  { id: 'revenue', label: 'Revenue Growth', desc: 'Direct top-line expansion' },
                ].map((v) => (
                  <div
                    key={v.id}
                    onClick={() => updateField('valueVector', v.id)}
                    className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${
                      formData.valueVector === v.id
                        ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 shadow-sm'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-200">{v.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{v.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center space-x-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-glow-indigo transition-all"
              >
                <span>Continue to Business Model</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Business Model & Monetization Architecture */}
        {currentStep === 3 && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-400" />
                <span>Step 3: Business Model & Monetization Architecture</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure your pricing model, Stripe checkout plumbing, and projected unit economics.
              </p>
            </div>

            {/* Pricing Archetypes */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-200">Monetization Archetype *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'subscription' as const,
                    name: 'Recurring SaaS Subscription',
                    desc: 'Predictable monthly or annual recurring seat pricing with automated Stripe invoices.',
                  },
                  {
                    id: 'usage' as const,
                    name: 'Usage-Based Credit Wallet',
                    desc: 'Prepaid or metered compute credits with low barrier to initial adoption.',
                  },
                  {
                    id: 'freemium' as const,
                    name: 'Freemium + Pro Tier',
                    desc: 'Free tier for top-of-funnel lead velocity, converting power users to paid plans.',
                  },
                  {
                    id: 'enterprise' as const,
                    name: 'High-Touch Enterprise License',
                    desc: 'Custom high-ARPU annual contracts ($5k - $50k) with SAML SSO and SLA.',
                  },
                ].map((arch) => (
                  <div
                    key={arch.id}
                    onClick={() => updateField('pricingArchetype', arch.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formData.pricingArchetype === arch.id
                        ? 'bg-indigo-950/60 border-indigo-500/80 ring-1 ring-indigo-500/50'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-100">{arch.name}</div>
                      {formData.pricingArchetype === arch.id && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{arch.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ARPU & CAC Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">Target Monthly Price (ARPU)</span>
                  <span className="font-mono text-indigo-400 font-bold">${formData.targetArpu} / mo</span>
                </div>
                <input
                  type="range"
                  min={19}
                  max={499}
                  step={10}
                  value={formData.targetArpu}
                  onChange={(e) => updateField('targetArpu', parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>$19</span>
                  <span>$149</span>
                  <span>$499</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">Estimated CAC (Blended)</span>
                  <span className="font-mono text-cyan-400 font-bold">${formData.estimatedCac}</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={300}
                  step={10}
                  value={formData.estimatedCac}
                  onChange={(e) => updateField('estimatedCac', parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>$20</span>
                  <span>$150</span>
                  <span>$300</span>
                </div>
              </div>
            </div>

            {/* Real-time Unit Economics Projections */}
            <div className="bg-slate-900/80 rounded-xl p-4 border border-indigo-900/40">
              <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
                Projected Unit Economics (85% Gross Margin)
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-400">Projected LTV</div>
                  <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                    ${projectedLtv}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-400">LTV:CAC Ratio</div>
                  <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">
                    {ltvCacRatio}x
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-400">Payback Period</div>
                  <div className="text-base font-bold text-indigo-300 font-mono mt-0.5">
                    {paybackMonths} mo
                  </div>
                </div>
              </div>
            </div>

            {/* Included Stack Checklist */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">Turnkey Scaffolding Inclusions:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Next.js 15 App Router & Tailwind CSS UI</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Supabase PostgreSQL with Row Level Security</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Stripe Checkout & Webhook Idempotency Mutex</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>100% Full Git Ejection (Zero Platform Lock-In)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center space-x-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-glow-indigo transition-all"
              >
                <span>Continue to Escrow Authorization</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Blueprint Review & 2PC Escrow Authorization */}
        {currentStep === 4 && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span>Step 4: Blueprint Review & 2PC Escrow Authorization</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review your venture blueprint and authorize the Two-Phase Commit credit escrow.
              </p>
            </div>

            {/* Executive Blueprint Summary */}
            <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{formData.name}</h3>
                  <div className="text-xs font-mono text-indigo-400">
                    https://{formData.slug || 'venture'}.axiomrun.app
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50 text-xs font-semibold">
                  {formData.industry}
                </span>
              </div>
              <p className="text-xs text-slate-300 italic border-l-2 border-indigo-500 pl-3">
                "{formData.tagline}"
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono text-slate-400">
                <div>
                  <span className="text-slate-500 block text-[10px]">TARGET ICP</span>
                  <span className="text-slate-200 truncate block">{formData.targetSegment}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">MONETIZATION</span>
                  <span className="text-slate-200 capitalize block">{formData.pricingArchetype}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">TARGET ARPU</span>
                  <span className="text-emerald-400 font-bold block">${formData.targetArpu}/mo</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">LTV:CAC</span>
                  <span className="text-cyan-400 font-bold block">{ltvCacRatio}x</span>
                </div>
              </div>
            </div>

            {/* 5-Milestone Visual Roadmap */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">5-Milestone Execution Roadmap</span>
                <span className="text-slate-400 font-mono">1,000 Total Credits Allocated</span>
              </div>

              <div className="space-y-2">
                {[
                  {
                    m: 1,
                    title: 'Architectural Scaffolding & DB Schema',
                    credits: 250,
                    value: '$2.50',
                    desc: 'Next.js 15 App Router, TypeScript strict typing, Supabase schema migration',
                  },
                  {
                    m: 2,
                    title: 'Frontend UX & Tailwind Interface',
                    credits: 250,
                    value: '$2.50',
                    desc: 'Responsive dark-mode UI, mobile/tablet viewports, client hydration verification',
                  },
                  {
                    m: 3,
                    title: 'Domain, DNS & TLS 1.3 Socket Setup',
                    credits: 150,
                    value: '$1.50',
                    desc: 'Quad-DoH consensus, RFC 6125 SAN check, Anycast CIDR pool validation',
                  },
                  {
                    m: 4,
                    title: 'Stripe Payments & Billing Lifecycle',
                    credits: 200,
                    value: '$2.00',
                    desc: 'Test clock 30-day advancement, concurrent webhook idempotency flood test',
                  },
                  {
                    m: 5,
                    title: 'Growth Kit, Tracking & SEO Configuration',
                    credits: 150,
                    value: '$1.50',
                    desc: '100% clean-room Git ejection, README verification badge, OpenGraph tags',
                  },
                ].map((milestone) => (
                  <div
                    key={milestone.m}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-md bg-indigo-950 text-indigo-400 border border-indigo-700/50 flex items-center justify-center font-mono font-bold text-[11px]">
                        M{milestone.m}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">{milestone.title}</div>
                        <div className="text-[11px] text-slate-400 hidden sm:block">{milestone.desc}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-mono font-semibold text-slate-300">{milestone.credits} credits</span>
                      <span className="text-[10px] text-slate-500 block">({milestone.value})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pay-Only-For-Working-Code Guarantee Seal */}
            <div className="rounded-xl p-4 bg-emerald-950/30 border border-emerald-500/40 flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-bold text-emerald-300">
                  Pay-Only-For-Working-Code Guarantee
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Your 1,000 milestone credits remain safely held in cryptographic Two-Phase Commit (2PC) escrow.
                  If any stage-gate fails after 3 autonomous self-healing retries,{' '}
                  <strong className="text-emerald-400">100% of escrowed credits are instantly refunded</strong>.
                  Stage Gate OS absorbs all compute COGS. Net user burn invariant: <code className="text-cyan-300 font-mono">ΔB == 0.00</code>.
                </p>
              </div>
            </div>


            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleAuthorizeAndLaunch}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-emerald-600 via-indigo-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-glow-indigo transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Locking Escrow & Dispatching Agents...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Authorize Escrow & Trigger Autonomous Build</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
