import React from 'react';
import { Download, ExternalLink, Check, Copy, ArrowLeft, Shield, Sparkles, Box, FileCode, Image as ImageIcon } from 'lucide-react';

interface BrandAssetsPageProps {
  onNavigate?: (path: string) => void;
}

export const BrandAssetsPage: React.FC<BrandAssetsPageProps> = ({
  onNavigate = (path: string) => { window.location.hash = path; },
}) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const assetList = [
    {
      category: 'Primary Brand Icons',
      items: [
        {
          title: 'Square Dark Icon (Default)',
          subtitle: 'PWA, App Store & Desktop launcher',
          svg: '/brand/stagegate-icon.svg',
          png: '/brand/stagegate-icon-512.png',
          hiResPng: '/brand/stagegate-icon-1024.png',
          preview: '/brand/stagegate-icon-512.png',
          bg: 'bg-slate-950',
        },
        {
          title: 'Transparent Silicon Die',
          subtitle: 'For overlays, pitch decks & documents',
          svg: '/brand/stagegate-icon-transparent.svg',
          png: '/brand/stagegate-icon-transparent-512.png',
          hiResPng: '/brand/stagegate-icon-transparent-1024.png',
          preview: '/brand/stagegate-icon-transparent-512.png',
          bg: 'bg-[#0e1628]',
        },
        {
          title: 'Circular Avatar Icon',
          subtitle: 'X (Twitter), GitHub & Discord profiles',
          svg: '/brand/stagegate-icon-circle.svg',
          png: '/brand/stagegate-icon-circle-512.png',
          hiResPng: '/brand/stagegate-icon-circle-512.png',
          preview: '/brand/stagegate-icon-circle-512.png',
          bg: 'bg-slate-950',
        },
      ]
    },
    {
      category: 'Horizontal Brand Lockups (1200x320)',
      items: [
        {
          title: 'Dark Mode Lockup (Primary)',
          subtitle: 'For dark websites, presentation headers & video overlays',
          svg: '/brand/stagegate-logo-dark.svg',
          png: '/brand/stagegate-logo-dark-1200.png',
          preview: '/brand/stagegate-logo-dark-1200.png',
          bg: 'bg-[#080C14]',
        },
        {
          title: 'Transparent Lockup',
          subtitle: 'Zero background color for custom backdrop designs',
          svg: '/brand/stagegate-logo-transparent.svg',
          png: '/brand/stagegate-logo-transparent-1200.png',
          preview: '/brand/stagegate-logo-transparent-1200.png',
          bg: 'bg-[#0d131f]',
        },
        {
          title: 'Light Mode Lockup',
          subtitle: 'For white papers, investor memos, invoices & light documentation',
          svg: '/brand/stagegate-logo-light.svg',
          png: '/brand/stagegate-logo-light-1200.png',
          preview: '/brand/stagegate-logo-light-1200.png',
          bg: 'bg-white',
          isLight: true,
        },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Back navigation & Header */}
        <div className="space-y-4">
          <button
            onClick={() => onNavigate('/')}
            className="inline-flex items-center space-x-2 text-xs font-mono text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Stage Gate OS</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-b border-slate-800 pb-8">
            <div>
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-mono mb-2">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Official Brand Assets &amp; Logo Kit</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Download Brand Assets
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Vector SVGs, high-resolution PNGs (up to 1024px), favicons, and social cards for Stage Gate OS.
              </p>
            </div>

            <div className="shrink-0 flex items-center space-x-3">
              <a
                href="/brand/stagegate-brand-assets.zip"
                download="stagegate-brand-assets.zip"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download All Assets (.ZIP)</span>
              </a>
            </div>
          </div>
        </div>

        {/* Brand Asset Sections */}
        {assetList.map((section, idx) => (
          <div key={idx} className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2 border-b border-slate-800/80 pb-2">
              <span>{section.category}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {section.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all shadow-xl"
                >
                  <div className="space-y-1">
                    <h3 className={`text-sm font-semibold ${item.isLight ? 'text-indigo-300' : 'text-white'}`}>{item.title}</h3>
                    <p className="text-xs text-slate-400 leading-snug">{item.subtitle}</p>
                  </div>

                  <div className={`w-full h-44 rounded-xl border border-slate-800/80 ${item.bg} flex items-center justify-center p-4 overflow-hidden shadow-inner`}>
                    <img src={item.preview} alt={item.title} className="max-h-full max-w-full object-contain" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={item.svg}
                      download
                      className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                    >
                      <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                      <span>SVG Vector</span>
                    </a>
                    <a
                      href={item.png}
                      download
                      className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/50 text-xs font-medium transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-300" />
                      <span>PNG Image</span>
                    </a>
                    {item.hiResPng && (
                      <a
                        href={item.hiResPng}
                        download
                        className="col-span-2 flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-300 text-[11px] font-mono transition-colors"
                      >
                        <Download className="w-3 h-3 text-emerald-400" />
                        <span>High-Res PNG (1024px)</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Social Card Preview */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white">Social Media &amp; Open Graph Preview Banner</h2>
              <p className="text-xs text-slate-400">1200 &times; 630 px for Twitter/X cards, LinkedIn, and GitHub headers</p>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href="/brand/stagegate-og-banner.svg"
                download="stagegate-og-banner.svg"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                SVG
              </a>
              <a
                href="/brand/stagegate-og-banner-1200x630.png"
                download="stagegate-og-banner-1200x630.png"
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
              >
                PNG (1200x630)
              </a>
            </div>
          </div>
          <div className="w-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
            <img src="/brand/stagegate-og-banner-1200x630.png" alt="Stage Gate OS Open Graph Banner" className="w-full h-auto object-contain" />
          </div>
        </div>

        {/* Color Palette Cheatsheet */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Official Brand Color Palette</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: 'Electric Indigo', hex: '#6366F1', desc: 'Core Die & .OS' },
              { name: 'Indigo Highlight', hex: '#818CF8', desc: 'Silicon Pins & Glow' },
              { name: 'Stage-Gate Emerald', hex: '#10B981', desc: 'Verification Shield' },
              { name: 'Engine Cyan', hex: '#06B6D4', desc: 'Telemetry Accent' },
              { name: 'Container Navy', hex: '#0E1628', desc: 'Squircle Surface' },
              { name: 'Space Obsidian', hex: '#080C14', desc: 'Canvas Background' },
            ].map((color, cIdx) => (
              <div
                key={cIdx}
                onClick={() => handleCopy(color.hex, color.hex)}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all group"
              >
                <div className="h-12 rounded-lg mb-2 shadow-inner" style={{ backgroundColor: color.hex }}></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{color.name}</span>
                  {copiedKey === color.hex ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <div className="text-[11px] font-mono text-slate-400">{color.hex}</div>
                <div className="text-[10px] text-slate-500">{color.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
