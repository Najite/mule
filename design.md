# FININT (Financial Intelligence Network) — Design Grammar & Specification

## 1. Product Positioning & Identity

* **Name:** FININT
* **Full Name:** Financial Intelligence Network
* **Category:** Financial Criminal Intelligence Platform
* **Flagship Capability:** Fraud Ring Intelligence
* **Core Proposition:** FININT helps financial investigators reveal the criminal networks behind isolated transaction alerts.
* **Core Function:** FININT connects transactions, accounts, devices, identities, locations, and beneficiaries to reveal coordinated activity and transform fragmented signals into investigation-ready intelligence.

---

## 2. Design Principles Derived from the VisioAI Reference

We extract the following core design principles from the VisioAI reference (Adhiari Subekti / One Week Wonders) and reinterpret them for an original financial-intelligence identity:

1. **Editorial Composition over SaaS Templates:**
   * Controlled asymmetry and strong vertical/horizontal cadence.
   * Generous, intentional negative space that allows complex financial intelligence to breathe.
   * Clean separation between narrative editorial copy, structured evidence, and visual representations.

2. **Typography Hierarchy & Visual Scale:**
   * Editorial display headlines with tight optical tracking (`-0.035em`) and unitless line-height (`1.15`).
   * Explicit contrast in typographic scale: large display titles (`clamp(2.5rem, 5vw, 4.25rem)`) juxtaposed against delicate, tracked uppercase overlines (`letter-spacing: 0.06em`).
   * Tabular numerals (`font-variant-numeric: tabular-nums`) applied to forensic numbers, transaction values, and timestamps.
   * Paragraph measures capped at 60–72 characters with `text-wrap: pretty`.

3. **Restrained Financial Intelligence Palette:**
   * Foundation in deep ink/obsidian (`#08090C`, `#0D0F14`).
   * Warm neutral surfaces (`#12151C`, `#181C26`) with hairline glass borders (`rgba(255, 255, 255, 0.08)`).
   * Crisp off-white typography (`#F5F5F7`, `#9BA3AF`).
   * **One distinctive signal color for intelligence:** Luminous Amber / Sovereign Gold (`#F59E0B` / `#D97706`), conveying treasury intelligence, institutional scrutiny, and forensic clarity.
   * **One restrained risk color:** Deep Vermilion (`#EF4444` / `#DC2626`) used strictly for high-risk fraud alerts and syndicate exposure.
   * *Zero generic electric-blue dominance, zero neon cyber glows, zero rainbow gradients.*

4. **Relationship Between Narrative & Hero Artwork:**
   * The hero is an editorial marketing composition, not a software dashboard or admin console.
   * The hero artwork represents a fragmented financial system resolving into a coherent intelligence network:
     - Dispersed financial pathways and disparate transaction points.
     - Differentiated entities (Account, Device, Beneficiary, Shared Identity).
     - Directed flows converging into an identified criminal ring.
     - One emerging high-risk cluster highlighted with intelligence focus.
     - Visual distinction between benign volume and coordinated activity.
     - Minimal semantic labels that clarify without cluttering.
     - Full clarity and legibility when motion is disabled (`prefers-reduced-motion`).

5. **Section Pacing & Rhythmic Content Structure:**
   * Avoid uniform three-card grids in every section.
   * Use an editorial sequence:
     1. Hero: Brand, proposition, dual CTAs, and conceptual network artwork.
     2. Problem: "Alerts identify events. They rarely explain the operation." Fragmented alerts vs. network reality.
     3. The FININT Shift: Editorial progression: Fragmented Transactions → Connected Entities → Suspicious Network → Investigation Intelligence.
     4. Flagship Capability: Fraud Ring Intelligence with 4 concrete typologies (rapid dispersion, fan-in/fan-out, circular movement, shared devices).
     5. Integrated Product Preview: A restrained forensic intelligence canvas showing entity resolution, evidence trail, and investigation narrative.
     6. Core Capabilities: 4 distinct architectural pillars.
     7. Differentiation: Traditional transaction-monitoring vs. FININT connected intelligence.
     8. Final CTA: Executive closing invitation with direct exploration access.

---

## 3. Design Tokens & CSS Variables

```css
:root {
  /* Canvas & Foundations */
  --bg-canvas: #08090C;
  --bg-surface-subtle: #0D0F15;
  --bg-surface-raised: #12151D;
  --bg-surface-overlay: #181C27;

  /* Card & Panel Surfaces */
  --card-bg: rgba(18, 21, 29, 0.72);
  --card-bg-hover: rgba(24, 28, 39, 0.88);
  --card-border: rgba(255, 255, 255, 0.08);
  --card-border-hover: rgba(245, 158, 11, 0.35);

  /* Typography */
  --text-primary: #F5F5F7;
  --text-secondary: #9BA3AF;
  --text-muted: #6B7280;
  --text-inverse: #08090C;

  /* Intelligence Signal (Primary Accent) */
  --signal-amber: #F59E0B;
  --signal-amber-hover: #D97706;
  --signal-amber-light: #FBBF24;
  --signal-amber-subtle: rgba(245, 158, 11, 0.12);
  --signal-glow: radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, transparent 70%);

  /* Risk & Alert (Restrained) */
  --risk-critical: #EF4444;
  --risk-critical-subtle: rgba(239, 68, 68, 0.12);
  --risk-border: rgba(239, 68, 68, 0.35);

  /* Benign / Verified Signal */
  --status-verified: #10B981;
  --status-verified-subtle: rgba(16, 185, 129, 0.12);

  /* Typography Stacks */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-heading: 'Plus Jakarta Sans', var(--font-sans);
  --font-mono: 'JetBrains Mono', 'SF Mono', Consolas, monospace;

  /* Elevation & Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.65);
  --shadow-signal: 0 0 32px rgba(245, 158, 11, 0.2);

  /* Animation Timings */
  --ease-out-standard: cubic-bezier(0.2, 0, 0, 1);
  --duration-fast: 150ms;
  --duration-smooth: 250ms;
}
```

---

## 4. Installed Skills Compliance

* **`better-colors`:** Defined semantic role tokens (`--bg-canvas`, `--text-primary`, `--signal-amber`, `--risk-critical`). Single filled primary action per view (`Explore FININT`). Contrast measured and guaranteed ≥ 4.5:1 for body and ≥ 3:1 for large display/controls.
* **`better-typography`:** Unitless line-heights (1.15 for display, 1.3 for headings, 1.6 for body). Letter-spacing in `em` (`-0.035em` on headlines, `0.06em` on uppercase badges). `tabular-nums` on figures, counts, scores, and monetary values. `text-wrap: balance` on headlines and `text-wrap: pretty` on paragraphs.
* **`better-layout`:** Grouping with space over lines. Logical properties used (`margin-inline`, `padding-inline`). Proper alignment edges. Fluid responsiveness down to 320px with zero horizontal scroll.
* **`better-ui`:** Concentric border radii (`outer = inner + padding`). Scale on press to `0.96` over `150ms ease-out` with disabled exclusion. Transitions name exact properties (`opacity, transform, border-color, background-color`). Motion strictly guarded under `@media (prefers-reduced-motion: no-preference)` with static fallbacks.
* **`better-writing`:** Verb-first CTAs ("Explore FININT", "See How It Works"). High-signal, calm, forensic tone. Avoided hype buzzwords. Clear error and empty states.
* **`better-accessibility`:** Semantic landmarks (`<header>`, `<main>`, `<section>`, `<footer>`). Accessible names on all interactive controls. Visible `:focus-visible` rings with ≥ 3:1 contrast. Minimum touch targets (44×44px touch, 40×40px desktop). No reliance on color alone (icons + textual labels).
