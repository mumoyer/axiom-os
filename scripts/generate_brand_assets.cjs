const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const brandDir = path.join(rootDir, 'brand-assets');
const svgDir = path.join(brandDir, 'svg');
const pngDir = path.join(brandDir, 'png');
const clientPublicDir = path.join(rootDir, 'client', 'public');
const clientPublicBrandDir = path.join(clientPublicDir, 'brand');

[brandDir, svgDir, pngDir, clientPublicDir, clientPublicBrandDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 1. STAGEGATE ICON SVG (512x512) - Square Dark
const stagegateIconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E1628"/>
      <stop offset="50%" stop-color="#090E1A"/>
      <stop offset="100%" stop-color="#050811"/>
    </linearGradient>

    <!-- Outer Border Glow -->
    <linearGradient id="borderGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#06B6D4" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.3"/>
    </linearGradient>

    <!-- Chip Package Gradient -->
    <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>

    <!-- Core Die Gradient -->
    <linearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#4338CA"/>
    </linearGradient>

    <!-- Shield Badge Gradient -->
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="50%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>

    <!-- Drop Shadows -->
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.65"/>
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#6366F1" flood-opacity="0.25"/>
    </filter>

    <filter id="shieldShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.75"/>
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#10B981" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Base Squircle Container -->
  <rect x="24" y="24" width="464" height="464" rx="104" fill="url(#bgGrad)" filter="url(#shadow)"/>
  <rect x="24" y="24" width="464" height="464" rx="104" stroke="url(#borderGlow)" stroke-width="4"/>

  <!-- Circuit traces in background -->
  <g stroke="#334155" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.45">
    <path d="M80 140h40l30 30h30"/>
    <path d="M80 370h50l30-30h20"/>
    <path d="M430 140h-40l-30 30h-30"/>
    <circle cx="80" cy="140" r="4.5" fill="#6366F1"/>
    <circle cx="80" cy="370" r="4.5" fill="#06B6D4"/>
    <circle cx="430" cy="140" r="4.5" fill="#818CF8"/>
  </g>

  <!-- CPU Socket Pins (Crisp solid color so no SVG gradient bounding box issue) -->
  <g fill="none" stroke="#818CF8" stroke-width="12" stroke-linecap="round">
    <!-- Top Pins -->
    <path d="M190 84v42"/>
    <path d="M256 84v42"/>
    <path d="M322 84v42"/>
    <!-- Bottom Pins -->
    <path d="M190 386v42"/>
    <path d="M256 386v42"/>
    <path d="M322 386v42"/>
    <!-- Left Pins -->
    <path d="M84 190h42"/>
    <path d="M84 256h42"/>
    <path d="M84 322h42"/>
    <!-- Right Pins -->
    <path d="M386 190h42"/>
    <path d="M386 256h42"/>
    <path d="M386 322h42"/>
  </g>

  <!-- Outer Silicon Package -->
  <rect x="120" y="120" width="272" height="272" rx="38" fill="url(#chipGrad)" stroke="#384966" stroke-width="3.5"/>
  <rect x="136" y="136" width="240" height="240" rx="26" fill="none" stroke="#6366F1" stroke-width="1.5" stroke-opacity="0.35"/>

  <!-- Inner Processing Die (Glowing Core) -->
  <rect x="178" y="178" width="156" height="156" rx="24" fill="url(#coreGrad)"/>
  <rect x="178" y="178" width="156" height="156" rx="24" stroke="#A5B4FC" stroke-width="3" stroke-opacity="0.8"/>

  <!-- Core Circuit Pattern -->
  <g fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.95">
    <rect x="218" y="218" width="76" height="76" rx="14" stroke="#FFFFFF" stroke-width="5"/>
    <path d="M256 196v22"/>
    <path d="M256 294v22"/>
    <path d="M196 256h22"/>
    <path d="M294 256h22"/>
    <circle cx="256" cy="256" r="6.5" fill="#FFFFFF"/>
  </g>

  <!-- Bottom-Right Verification Stage-Gate Badge -->
  <g transform="translate(324, 324)" filter="url(#shieldShadow)">
    <!-- Badge Background Ring & Fill -->
    <circle cx="68" cy="68" r="68" fill="#080C14"/>
    <circle cx="68" cy="68" r="58" fill="url(#shieldGrad)"/>
    <circle cx="68" cy="68" r="58" fill="none" stroke="#A7F3D0" stroke-width="2.5" stroke-opacity="0.6"/>

    <!-- Shield Check Icon -->
    <g transform="translate(36, 36) scale(2.65)" fill="none" stroke="#042F2E" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" stroke-width="3.2" stroke="#022C22" />
    </g>
  </g>
</svg>`;

// 2. STAGEGATE ICON CIRCLE (512x512)
const stagegateIconCircleSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <defs>
    <linearGradient id="bgGradCircle" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E1628"/>
      <stop offset="50%" stop-color="#090E1A"/>
      <stop offset="100%" stop-color="#050811"/>
    </linearGradient>
    <linearGradient id="borderGlowCircle" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="50%" stop-color="#06B6D4"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
    <linearGradient id="chipGradCircle" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="coreGradCircle" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#4338CA"/>
    </linearGradient>
    <linearGradient id="shieldGradCircle" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="50%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <filter id="shieldShadowCircle" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.8"/>
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#10B981" flood-opacity="0.5"/>
    </filter>
  </defs>

  <circle cx="256" cy="256" r="248" fill="url(#bgGradCircle)"/>
  <circle cx="256" cy="256" r="246" stroke="url(#borderGlowCircle)" stroke-width="4"/>

  <!-- CPU Socket Pins -->
  <g fill="none" stroke="#818CF8" stroke-width="12" stroke-linecap="round">
    <path d="M190 86v38"/>
    <path d="M256 86v38"/>
    <path d="M322 86v38"/>
    <path d="M190 388v38"/>
    <path d="M256 388v38"/>
    <path d="M322 388v38"/>
    <path d="M86 190h38"/>
    <path d="M86 256h38"/>
    <path d="M86 322h38"/>
    <path d="M388 190h38"/>
    <path d="M388 256h38"/>
    <path d="M388 322h38"/>
  </g>

  <!-- Outer Silicon Package -->
  <rect x="124" y="124" width="264" height="264" rx="36" fill="url(#chipGradCircle)" stroke="#384966" stroke-width="3.5"/>
  <rect x="140" y="140" width="232" height="232" rx="26" fill="none" stroke="#6366F1" stroke-width="1.5" stroke-opacity="0.35"/>

  <!-- Core Die -->
  <rect x="180" y="180" width="152" height="152" rx="24" fill="url(#coreGradCircle)"/>
  <rect x="180" y="180" width="152" height="152" rx="24" stroke="#A5B4FC" stroke-width="3" stroke-opacity="0.8"/>

  <!-- Circuit Pattern -->
  <g fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.95">
    <rect x="220" y="220" width="72" height="72" rx="12" stroke="#FFFFFF" stroke-width="5"/>
    <path d="M256 198v22"/>
    <path d="M256 292v22"/>
    <path d="M198 256h22"/>
    <path d="M292 256h22"/>
    <circle cx="256" cy="256" r="6" fill="#FFFFFF"/>
  </g>

  <!-- Bottom-Right Verification Badge -->
  <g transform="translate(322, 322)" filter="url(#shieldShadowCircle)">
    <circle cx="66" cy="66" r="66" fill="#080C14"/>
    <circle cx="66" cy="66" r="56" fill="url(#shieldGradCircle)"/>
    <circle cx="66" cy="66" r="56" fill="none" stroke="#A7F3D0" stroke-width="2.5" stroke-opacity="0.6"/>
    <g transform="translate(36, 36) scale(2.5)" fill="none" stroke="#042F2E" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" stroke-width="3.2" stroke="#022C22"/>
    </g>
  </g>
</svg>`;

// 3. STAGEGATE ICON TRANSPARENT (512x512)
const stagegateIconTransparentSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <defs>
    <linearGradient id="chipGradTr" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="coreGradTr" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#4338CA"/>
    </linearGradient>
    <linearGradient id="shieldGradTr" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="50%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <filter id="shadowTr" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.55"/>
      <feDropShadow dx="0" dy="4" stdDeviation="10" flood-color="#6366F1" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- CPU Socket Pins -->
  <g fill="none" stroke="#818CF8" stroke-width="14" stroke-linecap="round">
    <path d="M190 68v44"/>
    <path d="M256 68v44"/>
    <path d="M322 68v44"/>
    <path d="M190 400v44"/>
    <path d="M256 400v44"/>
    <path d="M322 400v44"/>
    <path d="M68 190h44"/>
    <path d="M68 256h44"/>
    <path d="M68 322h44"/>
    <path d="M400 190h44"/>
    <path d="M400 256h44"/>
    <path d="M400 322h44"/>
  </g>

  <!-- Outer Silicon Package -->
  <rect x="110" y="110" width="292" height="292" rx="42" fill="url(#chipGradTr)" stroke="#475569" stroke-width="4" filter="url(#shadowTr)"/>
  <rect x="128" y="128" width="256" height="256" rx="30" fill="none" stroke="#818CF8" stroke-width="2" stroke-opacity="0.4"/>

  <!-- Core Die -->
  <rect x="176" y="176" width="160" height="160" rx="26" fill="url(#coreGradTr)"/>
  <rect x="176" y="176" width="160" height="160" rx="26" stroke="#A5B4FC" stroke-width="3.5" stroke-opacity="0.8"/>

  <!-- Circuit Pattern -->
  <g fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="216" y="216" width="80" height="80" rx="14" stroke="#FFFFFF" stroke-width="5.5"/>
    <path d="M256 194v22"/>
    <path d="M256 296v22"/>
    <path d="M194 256h22"/>
    <path d="M296 256h22"/>
    <circle cx="256" cy="256" r="7" fill="#FFFFFF"/>
  </g>

  <!-- Bottom-Right Verification Badge -->
  <g transform="translate(318, 318)">
    <circle cx="68" cy="68" r="68" fill="#080C14"/>
    <circle cx="68" cy="68" r="58" fill="url(#shieldGradTr)"/>
    <circle cx="68" cy="68" r="58" fill="none" stroke="#A7F3D0" stroke-width="3" stroke-opacity="0.7"/>
    <g transform="translate(36, 36) scale(2.65)" fill="none" stroke="#042F2E" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" stroke-width="3.2" stroke="#022C22" />
    </g>
  </g>
</svg>`;

// 4. FULL LOGO - DARK (1200x320)
// Using Inter for the primary brand text so STAGEGATE.OS is tight and unified, with badges adjacent.
const stagegateLogoDarkSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 320" width="1200" height="320" fill="none">
  <defs>
    <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080C14"/>
      <stop offset="100%" stop-color="#04060B"/>
    </linearGradient>
    <linearGradient id="logoIconBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E1628"/>
      <stop offset="100%" stop-color="#080C16"/>
    </linearGradient>
    <linearGradient id="logoBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#06B6D4" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#1E293B" stop-opacity="0.8"/>
    </linearGradient>
    <linearGradient id="logoCore" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#4338CA"/>
    </linearGradient>
    <linearGradient id="logoShield" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.6"/>
      <feDropShadow dx="0" dy="2" stdDeviation="8" flood-color="#6366F1" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="320" fill="url(#logoBgGrad)" rx="24"/>
  <rect width="1200" height="320" fill="none" stroke="#1E293B" stroke-width="2" rx="24"/>

  <!-- Logo Glyph on Left (x: 65, y: 60, size: 200x200) -->
  <g transform="translate(65, 60)" filter="url(#logoShadow)">
    <rect width="200" height="200" rx="46" fill="url(#logoIconBg)"/>
    <rect width="200" height="200" rx="46" stroke="url(#logoBorder)" stroke-width="2.5"/>

    <!-- Pins -->
    <g fill="none" stroke="#818CF8" stroke-width="5" stroke-linecap="round">
      <path d="M75 22v14"/><path d="M100 22v14"/><path d="M125 22v14"/>
      <path d="M75 164v14"/><path d="M100 164v14"/><path d="M125 164v14"/>
      <path d="M22 75h14"/><path d="M22 100h14"/><path d="M22 125h14"/>
      <path d="M164 75h14"/><path d="M164 100h14"/><path d="M164 125h14"/>
    </g>

    <!-- Outer chip -->
    <rect x="48" y="48" width="104" height="104" rx="16" fill="#1E293B" stroke="#334155" stroke-width="2"/>
    <rect x="54" y="54" width="92" height="92" rx="12" fill="none" stroke="#6366F1" stroke-width="1" stroke-opacity="0.4"/>

    <!-- Core Die -->
    <rect x="70" y="70" width="60" height="60" rx="10" fill="url(#logoCore)" stroke="#A5B4FC" stroke-width="1.5"/>

    <!-- Circuit core -->
    <rect x="85" y="85" width="30" height="30" rx="5" fill="none" stroke="#FFFFFF" stroke-width="2.2"/>
    <circle cx="100" cy="100" r="3" fill="#FFFFFF"/>

    <!-- Verification Badge (bottom-right) -->
    <g transform="translate(138, 138)">
      <circle cx="28" cy="28" r="28" fill="#080C14"/>
      <circle cx="28" cy="28" r="24" fill="url(#logoShield)"/>
      <circle cx="28" cy="28" r="24" fill="none" stroke="#A7F3D0" stroke-width="1.5"/>
      <g transform="translate(14, 14) scale(1.16)" fill="none" stroke="#042F2E" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" stroke-width="3" stroke="#022C22"/>
      </g>
    </g>
  </g>

  <!-- Typography & Brand Lockup on Right (x: 295) -->
  <g transform="translate(295, 132)">
    <!-- STAGEGATE.OS Title -->
    <text font-family="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="64" font-weight="900" letter-spacing="-1">
      <tspan fill="#FFFFFF">STAGEGATE</tspan><tspan fill="#818CF8">.OS</tspan>
    </text>

    <!-- Badges Row alongside Wordmark -->
    <g transform="translate(500, -44)">
      <!-- BETA Badge -->
      <rect x="0" y="8" width="60" height="26" rx="6" fill="#F59E0B" fill-opacity="0.15" stroke="#F59E0B" stroke-opacity="0.45" stroke-width="1.5"/>
      <text x="30" y="25" fill="#FCD34D" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="800" text-anchor="middle" letter-spacing="1">BETA</text>

      <!-- AUTONOMOUS ENGINE Badge -->
      <rect x="70" y="8" width="170" height="26" rx="13" fill="#1E1B4B" stroke="#6366F1" stroke-opacity="0.6" stroke-width="1.5"/>
      <circle cx="86" cy="21" r="3.5" fill="#34D399"/>
      <text x="162" y="25" fill="#C7D2FE" font-family="'Inter', sans-serif" font-size="11" font-weight="700" text-anchor="middle" letter-spacing="0.8">AUTONOMOUS ENGINE</text>
    </g>
  </g>

  <!-- Primary Subtitle / Tagline -->
  <text x="297" y="184" fill="#94A3B8" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="17" font-weight="700" letter-spacing="3.5">
    THE AUTONOMOUS BUSINESS OPERATING SYSTEM
  </text>

  <!-- Secondary Pillar Line -->
  <g transform="translate(297, 222)">
    <text fill="#64748B" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="500" letter-spacing="0.5">
      Deterministic Stage-Gates <tspan fill="#475569">•</tspan> 100% Full Git Ejection <tspan fill="#475569">•</tspan> Zero-Charge Guarantee
    </text>
  </g>
</svg>`;

// 5. FULL LOGO - TRANSPARENT (1200x320)
const stagegateLogoTransparentSvg = stagegateLogoDarkSvg
  .replace('<rect width="1200" height="320" fill="url(#logoBgGrad)" rx="24"/>', '')
  .replace('<rect width="1200" height="320" fill="none" stroke="#1E293B" stroke-width="2" rx="24"/>', '');

// 6. FULL LOGO - LIGHT (1200x320)
const stagegateLogoLightSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 320" width="1200" height="320" fill="none">
  <defs>
    <linearGradient id="logoLightBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F8FAFC"/>
    </linearGradient>
    <linearGradient id="lightIconBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="lightCore" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#4F46E5"/>
    </linearGradient>
    <linearGradient id="lightShield" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <filter id="lightShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="320" fill="url(#logoLightBg)" rx="24"/>
  <rect width="1200" height="320" fill="none" stroke="#E2E8F0" stroke-width="2" rx="24"/>

  <!-- Logo Glyph on Left -->
  <g transform="translate(65, 60)" filter="url(#lightShadow)">
    <rect width="200" height="200" rx="46" fill="url(#lightIconBg)"/>
    <rect width="200" height="200" rx="46" stroke="#4F46E5" stroke-opacity="0.4" stroke-width="2.5"/>

    <!-- Pins -->
    <g fill="none" stroke="#818CF8" stroke-width="5" stroke-linecap="round">
      <path d="M75 22v14"/><path d="M100 22v14"/><path d="M125 22v14"/>
      <path d="M75 164v14"/><path d="M100 164v14"/><path d="M125 164v14"/>
      <path d="M22 75h14"/><path d="M22 100h14"/><path d="M22 125h14"/>
      <path d="M164 75h14"/><path d="M164 100h14"/><path d="M164 125h14"/>
    </g>

    <!-- Outer chip -->
    <rect x="48" y="48" width="104" height="104" rx="16" fill="#1E293B" stroke="#334155" stroke-width="2"/>

    <!-- Core Die -->
    <rect x="70" y="70" width="60" height="60" rx="10" fill="url(#lightCore)" stroke="#A5B4FC" stroke-width="1.5"/>

    <!-- Circuit core -->
    <rect x="85" y="85" width="30" height="30" rx="5" fill="none" stroke="#FFFFFF" stroke-width="2.2"/>
    <circle cx="100" cy="100" r="3" fill="#FFFFFF"/>

    <!-- Verification Badge -->
    <g transform="translate(138, 138)">
      <circle cx="28" cy="28" r="28" fill="#FFFFFF"/>
      <circle cx="28" cy="28" r="24" fill="url(#lightShield)"/>
      <g transform="translate(14, 14) scale(1.16)" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" stroke-width="3" stroke="#FFFFFF"/>
      </g>
    </g>
  </g>

  <!-- Typography on Right -->
  <g transform="translate(295, 132)">
    <text font-family="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="64" font-weight="900" letter-spacing="-1">
      <tspan fill="#0F172A">STAGEGATE</tspan><tspan fill="#4F46E5">.OS</tspan>
    </text>

    <!-- Badges Row -->
    <g transform="translate(500, -44)">
      <rect x="0" y="8" width="60" height="26" rx="6" fill="#F59E0B" fill-opacity="0.1" stroke="#F59E0B" stroke-opacity="0.5" stroke-width="1.5"/>
      <text x="30" y="25" fill="#D97706" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="800" text-anchor="middle" letter-spacing="1">BETA</text>

      <rect x="70" y="8" width="170" height="26" rx="13" fill="#EEF2FF" stroke="#6366F1" stroke-opacity="0.3" stroke-width="1.5"/>
      <circle cx="86" cy="21" r="3.5" fill="#10B981"/>
      <text x="162" y="25" fill="#4338CA" font-family="'Inter', sans-serif" font-size="11" font-weight="700" text-anchor="middle" letter-spacing="0.8">AUTONOMOUS ENGINE</text>
    </g>
  </g>

  <!-- Subtitle -->
  <text x="297" y="184" fill="#475569" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="17" font-weight="700" letter-spacing="3.5">
    THE AUTONOMOUS BUSINESS OPERATING SYSTEM
  </text>

  <!-- Secondary Pillar Line -->
  <text x="297" y="222" fill="#64748B" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="500" letter-spacing="0.5">
    Deterministic Stage-Gates <tspan fill="#94A3B8">•</tspan> 100% Full Git Ejection <tspan fill="#94A3B8">•</tspan> Zero-Charge Guarantee
  </text>
</svg>`;

// 7. CRISP BROWSER FAVICON SVG (64x64)
const stagegateFaviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
  <defs>
    <linearGradient id="favBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E1628"/>
      <stop offset="100%" stop-color="#050811"/>
    </linearGradient>
    <linearGradient id="favShield" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#favBg)"/>
  <rect x="2" y="2" width="60" height="60" rx="14" stroke="#6366F1" stroke-width="2" stroke-opacity="0.8"/>

  <!-- CPU Lines -->
  <g fill="none" stroke="#818CF8" stroke-width="2" stroke-linecap="round">
    <path d="M24 6v4"/><path d="M32 6v4"/><path d="M40 6v4"/>
    <path d="M24 54v4"/><path d="M32 54v4"/><path d="M40 54v4"/>
    <path d="M6 24h4"/><path d="M6 32h4"/><path d="M6 40h4"/>
    <path d="M54 24h4"/><path d="M54 32h4"/><path d="M54 40h4"/>
  </g>

  <!-- CPU Box -->
  <rect x="14" y="14" width="36" height="36" rx="8" fill="#1E293B" stroke="#6366F1" stroke-width="1.5"/>
  <rect x="22" y="22" width="20" height="20" rx="4" fill="#6366F1"/>

  <!-- Verification Dot -->
  <circle cx="48" cy="48" r="10" fill="#080C14"/>
  <circle cx="48" cy="48" r="8" fill="url(#favShield)"/>
  <path d="m44 48 3 3 5-5" fill="none" stroke="#022C22" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// 8. SOCIAL MEDIA / OPEN GRAPH BANNER (1200x630)
const stagegateOgBannerSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" fill="none">
  <defs>
    <linearGradient id="ogBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080C14"/>
      <stop offset="60%" stop-color="#05080E"/>
      <stop offset="100%" stop-color="#020307"/>
    </linearGradient>
    <radialGradient id="ogGlow" cx="50%" cy="35%" r="50%">
      <stop offset="0%" stop-color="#6366F1" stop-opacity="0.22"/>
      <stop offset="60%" stop-color="#06B6D4" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#080C14" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ogCard" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E1628"/>
      <stop offset="100%" stop-color="#080C16"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#ogBg)"/>
  <rect width="1200" height="630" fill="url(#ogGlow)"/>

  <!-- Subtle grid lines -->
  <g stroke="#1E293B" stroke-width="1" stroke-opacity="0.4">
    <path d="M0 105h1200"/><path d="M0 210h1200"/><path d="M0 315h1200"/><path d="M0 420h1200"/><path d="M0 525h1200"/>
    <path d="M200 0v630"/><path d="M400 0v630"/><path d="M600 0v630"/><path d="M800 0v630"/><path d="M1000 0v630"/>
  </g>

  <!-- Center Content -->
  <!-- Icon (Scale 0.8, Centered at x: 536, y: 70) -->
  <g transform="translate(536, 60) scale(0.25)">
    <!-- Insert embedded icon graphic -->
    <rect width="512" height="512" rx="110" fill="#0E1628" stroke="#6366F1" stroke-width="8"/>
    <!-- CPU Socket Pins -->
    <g fill="none" stroke="#818CF8" stroke-width="14" stroke-linecap="round">
      <path d="M190 68v44"/><path d="M256 68v44"/><path d="M322 68v44"/>
      <path d="M190 400v44"/><path d="M256 400v44"/><path d="M322 400v44"/>
      <path d="M68 190h44"/><path d="M68 256h44"/><path d="M68 322h44"/>
      <path d="M400 190h44"/><path d="M400 256h44"/><path d="M400 322h44"/>
    </g>
    <rect x="110" y="110" width="292" height="292" rx="42" fill="#1E293B" stroke="#475569" stroke-width="4"/>
    <rect x="176" y="176" width="160" height="160" rx="26" fill="#6366F1" stroke="#A5B4FC" stroke-width="4"/>
    <rect x="216" y="216" width="80" height="80" rx="14" stroke="#FFFFFF" stroke-width="6"/>
    <circle cx="256" cy="256" r="8" fill="#FFFFFF"/>
    <circle cx="390" cy="390" r="70" fill="#080C14"/>
    <circle cx="390" cy="390" r="58" fill="#10B981"/>
    <path d="m365 390 18 18 36-36" stroke="#022C22" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Big Brand Heading -->
  <text x="600" y="260" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="76" font-weight="900" text-anchor="middle" letter-spacing="-1.5">
    <tspan fill="#FFFFFF">STAGEGATE</tspan><tspan fill="#818CF8">.OS</tspan>
  </text>

  <!-- Tagline -->
  <text x="600" y="315" font-family="'Inter', sans-serif" font-size="22" font-weight="700" fill="#94A3B8" text-anchor="middle" letter-spacing="4">
    THE AUTONOMOUS BUSINESS OPERATING SYSTEM
  </text>

  <text x="600" y="360" font-family="'Inter', sans-serif" font-size="17" font-weight="400" fill="#64748B" text-anchor="middle">
    From Validated Idea to Live Venture in Hours • 100% Zero-Charge Failure Guarantee
  </text>

  <!-- 5 Stage Gate Badges Bar -->
  <g transform="translate(160, 420)">
    <!-- Stage 1 -->
    <g transform="translate(0, 0)">
      <rect width="160" height="48" rx="10" fill="#0F172A" stroke="#10B981" stroke-opacity="0.5" stroke-width="1.5"/>
      <circle cx="24" cy="24" r="5" fill="#10B981"/>
      <text x="40" y="29" fill="#F1F5F9" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700">G1: Syntax</text>
    </g>
    <!-- Stage 2 -->
    <g transform="translate(180, 0)">
      <rect width="160" height="48" rx="10" fill="#0F172A" stroke="#10B981" stroke-opacity="0.5" stroke-width="1.5"/>
      <circle cx="24" cy="24" r="5" fill="#10B981"/>
      <text x="40" y="29" fill="#F1F5F9" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700">G2: TLS 1.3</text>
    </g>
    <!-- Stage 3 -->
    <g transform="translate(360, 0)">
      <rect width="160" height="48" rx="10" fill="#0F172A" stroke="#10B981" stroke-opacity="0.5" stroke-width="1.5"/>
      <circle cx="24" cy="24" r="5" fill="#10B981"/>
      <text x="40" y="29" fill="#F1F5F9" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700">G3: DNS Quorum</text>
    </g>
    <!-- Stage 4 -->
    <g transform="translate(540, 0)">
      <rect width="160" height="48" rx="10" fill="#0F172A" stroke="#10B981" stroke-opacity="0.5" stroke-width="1.5"/>
      <circle cx="24" cy="24" r="5" fill="#10B981"/>
      <text x="40" y="29" fill="#F1F5F9" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700">G4: Stripe Clock</text>
    </g>
    <!-- Stage 5 -->
    <g transform="translate(720, 0)">
      <rect width="160" height="48" rx="10" fill="#0F172A" stroke="#10B981" stroke-opacity="0.5" stroke-width="1.5"/>
      <circle cx="24" cy="24" r="5" fill="#10B981"/>
      <text x="40" y="29" fill="#F1F5F9" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700">G5: Git Eject</text>
    </g>
  </g>

  <!-- Bottom Link -->
  <text x="600" y="550" font-family="'JetBrains Mono', monospace" font-size="15" font-weight="600" fill="#818CF8" text-anchor="middle">
    https://stagegateos.com
  </text>
</svg>`;

// Write all SVGs
const svgFiles = {
  'stagegate-icon.svg': stagegateIconSvg,
  'stagegate-icon-circle.svg': stagegateIconCircleSvg,
  'stagegate-icon-transparent.svg': stagegateIconTransparentSvg,
  'stagegate-logo-dark.svg': stagegateLogoDarkSvg,
  'stagegate-logo-transparent.svg': stagegateLogoTransparentSvg,
  'stagegate-logo-light.svg': stagegateLogoLightSvg,
  'stagegate-og-banner.svg': stagegateOgBannerSvg,
  'favicon.svg': stagegateFaviconSvg,
};

Object.entries(svgFiles).forEach(([name, content]) => {
  fs.writeFileSync(path.join(svgDir, name), content.trim());
  fs.writeFileSync(path.join(clientPublicBrandDir, name), content.trim());
});

// Update client/public/favicon.svg directly
fs.writeFileSync(path.join(clientPublicDir, 'favicon.svg'), stagegateFaviconSvg.trim());

console.log('Successfully wrote 8 refined SVG brand assets.');

async function generatePngs() {
  console.log('Launching Playwright Chromium to render updated PNGs...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  async function renderSvgToPng(svgFilePath, outputPngPath, width, height, transparent = false) {
    const svgContent = fs.readFileSync(svgFilePath, 'utf8');
    const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8"/>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@700;800&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body, html { width: ${width}px; height: ${height}px; overflow: hidden; background: ${transparent ? 'transparent' : '#080C14'}; }
          svg { width: 100%; height: 100%; display: block; }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>`;

    await page.setViewportSize({ width, height });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.screenshot({ path: outputPngPath, omitBackground: transparent });
    console.log(`Rendered: ${path.basename(outputPngPath)} (${width}x${height})`);
  }

  // 1. Icon Renders (Square Dark)
  const iconDarkPath = path.join(svgDir, 'stagegate-icon.svg');
  await renderSvgToPng(iconDarkPath, path.join(pngDir, 'stagegate-icon-1024.png'), 1024, 1024, false);
  await renderSvgToPng(iconDarkPath, path.join(pngDir, 'stagegate-icon-512.png'), 512, 512, false);
  await renderSvgToPng(iconDarkPath, path.join(pngDir, 'stagegate-icon-256.png'), 256, 256, false);
  await renderSvgToPng(iconDarkPath, path.join(pngDir, 'stagegate-icon-192.png'), 192, 192, false);
  await renderSvgToPng(iconDarkPath, path.join(pngDir, 'stagegate-icon-64.png'), 64, 64, false);
  await renderSvgToPng(iconDarkPath, path.join(pngDir, 'stagegate-icon-32.png'), 32, 32, false);

  // 2. Icon Renders (Transparent)
  const iconTransPath = path.join(svgDir, 'stagegate-icon-transparent.svg');
  await renderSvgToPng(iconTransPath, path.join(pngDir, 'stagegate-icon-transparent-512.png'), 512, 512, true);
  await renderSvgToPng(iconTransPath, path.join(pngDir, 'stagegate-icon-transparent-1024.png'), 1024, 1024, true);

  // 3. Icon Circle (Social Avatars)
  const iconCirclePath = path.join(svgDir, 'stagegate-icon-circle.svg');
  await renderSvgToPng(iconCirclePath, path.join(pngDir, 'stagegate-icon-circle-512.png'), 512, 512, true);

  // 4. Apple Touch Icon (180x180)
  await renderSvgToPng(iconDarkPath, path.join(pngDir, 'apple-touch-icon.png'), 180, 180, false);
  fs.copyFileSync(path.join(pngDir, 'apple-touch-icon.png'), path.join(clientPublicDir, 'apple-touch-icon.png'));

  // 5. Horizontal Logos (1200x320)
  const logoDarkPath = path.join(svgDir, 'stagegate-logo-dark.svg');
  await renderSvgToPng(logoDarkPath, path.join(pngDir, 'stagegate-logo-dark-1200.png'), 1200, 320, false);

  const logoTransPath = path.join(svgDir, 'stagegate-logo-transparent.svg');
  await renderSvgToPng(logoTransPath, path.join(pngDir, 'stagegate-logo-transparent-1200.png'), 1200, 320, true);

  const logoLightPath = path.join(svgDir, 'stagegate-logo-light.svg');
  await renderSvgToPng(logoLightPath, path.join(pngDir, 'stagegate-logo-light-1200.png'), 1200, 320, false);

  // 6. Social / Open Graph Card (1200x630)
  const ogBannerPath = path.join(svgDir, 'stagegate-og-banner.svg');
  await renderSvgToPng(ogBannerPath, path.join(pngDir, 'stagegate-og-banner-1200x630.png'), 1200, 630, false);

  await browser.close();
  console.log('All PNG renders completed!');

  // Copy PNGs to client public directory
  const pngFiles = fs.readdirSync(pngDir);
  pngFiles.forEach(file => {
    fs.copyFileSync(path.join(pngDir, file), path.join(clientPublicBrandDir, file));
  });

  // Create Zip Archive
  console.log('Generating ZIP archive of all brand assets...');
  const zipPath = path.join(brandDir, 'stagegate-brand-assets.zip');
  try {
    execSync(`powershell.exe -NoProfile -Command "Compress-Archive -Path '${brandDir}\\svg', '${brandDir}\\png' -DestinationPath '${zipPath}' -Force"`);
    fs.copyFileSync(zipPath, path.join(clientPublicBrandDir, 'stagegate-brand-assets.zip'));
    console.log(`ZIP Archive created at: ${zipPath}`);
  } catch (err) {
    console.error('Failed to create zip with PowerShell:', err.message);
  }
}

generatePngs().catch(console.error);
