# Stage Gate OS — Brand Identity Assets & Logo Kit

This directory contains the official vector (SVG) and raster (PNG) brand assets, logos, app icons, favicons, and social cards for **Stage Gate OS** (`STAGEGATE.OS`) — *The Autonomous Business Operating System*.

---

## 📦 Instant Downloads & Interactive Gallery

An interactive brand asset viewer and one-click download portal is available at:
- **Local File:** [`brand-assets/index.html`](./index.html) (double-click to open in any browser)
- **Web Route:** `/brand/index.html` (or `/#/brand` inside the web app)
- **All-in-One Package:** [`stagegate-brand-assets.zip`](./stagegate-brand-assets.zip) (contains all SVG and PNG assets)

---

## 🎨 Brand Asset Inventory

### 1. Vector Assets (`brand-assets/svg/`)

| File | Canvas Size | Description |
|---|---|---|
| [`stagegate-icon.svg`](./svg/stagegate-icon.svg) | 512 &times; 512 | Square dark app icon with Silicon CPU die and Stage-Gate verification shield badge. |
| [`stagegate-icon-circle.svg`](./svg/stagegate-icon-circle.svg) | 512 &times; 512 | Circular avatar version for X (Twitter), GitHub, Slack, and Discord profiles. |
| [`stagegate-icon-transparent.svg`](./svg/stagegate-icon-transparent.svg) | 512 &times; 512 | Standalone Silicon CPU die without dark background squircle. |
| [`stagegate-logo-dark.svg`](./svg/stagegate-logo-dark.svg) | 1200 &times; 320 | Primary horizontal lockup on dark `#080C14` background for headers, decks, and videos. |
| [`stagegate-logo-transparent.svg`](./svg/stagegate-logo-transparent.svg) | 1200 &times; 320 | Horizontal lockup with transparent background for custom overlays. |
| [`stagegate-logo-light.svg`](./svg/stagegate-logo-light.svg) | 1200 &times; 320 | Inverted horizontal lockup for light backgrounds, white papers, and print. |
| [`stagegate-og-banner.svg`](./svg/stagegate-og-banner.svg) | 1200 &times; 630 | Social preview banner with Stage-Gate G1–G5 badges for Open Graph & Twitter cards. |
| [`favicon.svg`](./svg/favicon.svg) | 64 &times; 64 | Vector browser favicon optimized for tab clarity. |

### 2. High-Resolution Raster Assets (`brand-assets/png/`)

| File | Resolution | Recommended Use |
|---|---|---|
| [`stagegate-icon-1024.png`](./png/stagegate-icon-1024.png) | 1024 &times; 1024 | Master HD App Store, macOS icon, high-density displays |
| [`stagegate-icon-512.png`](./png/stagegate-icon-512.png) | 512 &times; 512 | PWA manifest, desktop launcher, web app icon |
| [`stagegate-icon-256.png`](./png/stagegate-icon-256.png) | 256 &times; 256 | UI preview dialogs, docks, notifications |
| [`stagegate-icon-192.png`](./png/stagegate-icon-192.png) | 192 &times; 192 | Android Home Screen icon (`icon-192.png`) |
| [`stagegate-icon-64.png`](./png/stagegate-icon-64.png) | 64 &times; 64 | HiDPI browser favicon |
| [`stagegate-icon-32.png`](./png/stagegate-icon-32.png) | 32 &times; 32 | Standard browser favicon |
| [`stagegate-icon-transparent-1024.png`](./png/stagegate-icon-transparent-1024.png) | 1024 &times; 1024 | Master transparent Silicon chip |
| [`stagegate-icon-transparent-512.png`](./png/stagegate-icon-transparent-512.png) | 512 &times; 512 | Transparent Silicon chip overlay |
| [`stagegate-icon-circle-512.png`](./png/stagegate-icon-circle-512.png) | 512 &times; 512 | Circular social avatar (Twitter/X, GitHub, Discord) |
| [`apple-touch-icon.png`](./png/apple-touch-icon.png) | 180 &times; 180 | iOS Apple Touch icon |
| [`stagegate-logo-dark-1200.png`](./png/stagegate-logo-dark-1200.png) | 1200 &times; 320 | High-res horizontal banner logo for presentations & READMEs |
| [`stagegate-logo-transparent-1200.png`](./png/stagegate-logo-transparent-1200.png) | 1200 &times; 320 | Transparent horizontal logo for custom backdrops |
| [`stagegate-logo-light-1200.png`](./png/stagegate-logo-light-1200.png) | 1200 &times; 320 | High-res logo for white papers, invoices, and light slides |
| [`stagegate-og-banner-1200x630.png`](./png/stagegate-og-banner-1200x630.png) | 1200 &times; 630 | Social sharing preview card (Open Graph / Twitter Summary) |

---

## 🎨 Color Palette & Design Tokens

| Token Name | HEX | RGB | Role in Brand |
|---|---|---|---|
| **Electric Indigo** | `#6366F1` | `rgb(99, 102, 241)` | Primary brand color, central processor core, `.OS` wordmark |
| **Indigo Highlight** | `#818CF8` | `rgb(129, 140, 248)` | Silicon package pins, circuit traces, glowing borders |
| **Stage-Gate Emerald** | `#10B981` | `rgb(16, 185, 129)` | Verification shield, passing stage-gate status indicator |
| **Engine Cyan** | `#06B6D4` | `rgb(6, 182, 212)` | Secondary telemetry accent, gradient highlights |
| **Container Navy** | `#0E1628` | `rgb(14, 22, 40)` | Icon squircle container, elevated UI panels |
| **Space Obsidian** | `#080C14` | `rgb(8, 12, 20)` | Deep space canvas background |
| **Text White** | `#F8FAFC` | `rgb(248, 250, 252)` | Primary headlines and wordmark (`STAGEGATE`) |
| **Text Slate** | `#94A3B8` | `rgb(148, 163, 184)` | Secondary subtitles and technical copy |

---

## 🔤 Typography

- **Wordmark (`STAGEGATE`):** `Inter` (Font-weight: `900 Black`, letter-spacing: `-1px`)
- **Top-Level Domain (`.OS`):** `Inter` (Font-weight: `900 Black`, color: `#818CF8`)
- **Technical Badges:** `JetBrains Mono` (Font-weight: `800 Bold`, uppercase)
- **Tagline:** `Inter` (Font-weight: `700 Bold`, letter-spacing: `3.5px`, uppercase)
- **Tagline Text:** *"THE AUTONOMOUS BUSINESS OPERATING SYSTEM"*
- **Pillar Subline:** *"Deterministic Stage-Gates • 100% Full Git Ejection • Zero-Charge Guarantee"*

---

## 💻 Web & HTML Integration

### Linking Favicon & Apple Touch Icon in HTML
```html
<link rel="icon" type="image/svg+xml" href="/brand/favicon.svg" />
<link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />
```

### Social Media (Open Graph & Twitter Cards)
```html
<meta property="og:image" content="https://stagegateos.com/brand/stagegate-og-banner-1200x630.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://stagegateos.com/brand/stagegate-og-banner-1200x630.png" />
```
