import React from 'react';
import { Smartphone, Landmark, UserCheck, ArrowRight } from 'lucide-react';

export const HeroArtwork: React.FC = () => {
  return (
    <div
      className="relative w-full aspect-[4/3] sm:aspect-[16/11] lg:aspect-[1/1] xl:aspect-[5/4] rounded-2xl border border-border-medium bg-canvas-subtle/80 overflow-hidden backdrop-blur-xl shadow-2xl flex items-center justify-center p-4 sm:p-6 select-none"
      aria-label="Diagram illustrating fragmented financial transactions resolving into an identified fraud network"
      role="img"
    >
      {/* Background radial gradient warmth (warm amber tone) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 65% 55% at 55% 45%, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.05) 45%, transparent 75%)',
        }}
      />

      {/* SVG Canvas for Layered Financial Pathways & Converging Flows */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 600 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="benignPath" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#334155" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="convergingFlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0.85" />
          </linearGradient>

          {/* Marker Arrows */}
          <marker
            id="arrowAmber"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#F59E0B" />
          </marker>
          <marker
            id="arrowRisk"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#EF4444" />
          </marker>
        </defs>

        {/* 1. Diffuse Ordinary Banking Activity (Faint grey geometric conduits) */}
        <path
          d="M 50 120 C 130 110, 200 180, 280 180 S 420 140, 550 90"
          stroke="url(#benignPath)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
        <path
          d="M 70 380 C 140 360, 190 280, 260 270 S 410 320, 530 420"
          stroke="url(#benignPath)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
        <path
          d="M 40 240 C 120 250, 170 210, 240 210 S 430 230, 560 260"
          stroke="url(#benignPath)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />

        {/* 2. Converging Coordinated Influx Lines (Peripheral Accounts -> Shared Ring) */}
        {/* Vector 1: Inflow from Upper Peripheral Account */}
        <path
          d="M 120 130 C 190 140, 240 180, 310 190"
          stroke="#F59E0B"
          strokeWidth="2"
          strokeDasharray="6 4"
          markerEnd="url(#arrowAmber)"
          className="motion-safe:animate-flow-dash"
        />

        {/* Vector 2: Inflow from Lower Peripheral Account */}
        <path
          d="M 110 360 C 180 340, 230 290, 290 270"
          stroke="#F59E0B"
          strokeWidth="2"
          strokeDasharray="6 4"
          markerEnd="url(#arrowAmber)"
          className="motion-safe:animate-flow-dash"
        />

        {/* Vector 3: Hardware device bridging accounts */}
        <path
          d="M 230 110 C 230 150, 290 170, 330 190"
          stroke="#FBBF24"
          strokeWidth="2"
          strokeDasharray="3 3"
        />
        <path
          d="M 230 110 C 270 120, 370 150, 410 180"
          stroke="#FBBF24"
          strokeWidth="2"
          strokeDasharray="3 3"
        />

        {/* 3. The Fraud Ring Cluster (Converged Circular Pathway) */}
        <circle
          cx="370"
          cy="240"
          r="95"
          stroke="rgba(245, 158, 11, 0.2)"
          strokeWidth="32"
          fill="none"
        />
        <circle
          cx="370"
          cy="240"
          r="95"
          stroke="url(#ringGradient)"
          strokeWidth="3"
          strokeDasharray="8 6"
          fill="rgba(14, 18, 25, 0.4)"
          className="motion-safe:animate-flow-dash"
        />

        {/* Ring internal circulating flows */}
        <path
          d="M 310 190 C 370 160, 420 170, 450 220"
          stroke="#F59E0B"
          strokeWidth="2.5"
          markerEnd="url(#arrowAmber)"
        />
        <path
          d="M 450 220 C 470 270, 430 320, 380 330"
          stroke="#EF4444"
          strokeWidth="2.5"
          markerEnd="url(#arrowRisk)"
        />
        <path
          d="M 380 330 C 320 330, 280 290, 290 240"
          stroke="#EF4444"
          strokeWidth="2.5"
          markerEnd="url(#arrowRisk)"
        />
        <path
          d="M 290 240 C 290 210, 300 200, 310 190"
          stroke="#F59E0B"
          strokeWidth="2.5"
          markerEnd="url(#arrowAmber)"
        />

        {/* Vector 4: High-Risk Outflow to Offshore Beneficiary */}
        <path
          d="M 450 220 C 490 200, 520 220, 540 260"
          stroke="#EF4444"
          strokeWidth="2.5"
          strokeDasharray="6 3"
          markerEnd="url(#arrowRisk)"
          className="motion-safe:animate-flow-dash"
        />
      </svg>

      {/* HTML Semantic Entity Cards Overlaid Precisely on Coordinates */}

      {/* Entity 1: Peripheral Account (Upper Left) */}
      <div className="absolute top-[16%] sm:top-[20%] left-[4%] sm:left-[10%] bg-canvas-raised/95 border border-border-medium rounded-lg p-1.5 sm:p-2.5 shadow-lg flex items-center gap-1.5 sm:gap-2 max-w-[120px] sm:max-w-[160px]">
        <div className="size-5 sm:size-6 rounded bg-slate-800 flex items-center justify-center text-text-secondary shrink-0">
          <Landmark className="size-3 sm:size-3.5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] sm:text-[10px] font-mono uppercase text-text-muted tracking-wider">Account</span>
          <span className="text-[11px] sm:text-xs font-mono font-medium text-text-primary truncate tabular-nums">ACC-4891</span>
        </div>
      </div>

      {/* Entity 2: Peripheral Account (Lower Left - Hidden on very small screens to avoid clutter) */}
      <div className="hidden sm:flex absolute bottom-[20%] left-[8%] bg-canvas-raised/95 border border-border-medium rounded-lg p-2.5 shadow-lg items-center gap-2 max-w-[160px]">
        <div className="size-6 rounded bg-slate-800 flex items-center justify-center text-text-secondary shrink-0">
          <Landmark className="size-3.5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-mono uppercase text-text-muted tracking-wider">Account</span>
          <span className="text-xs font-mono font-medium text-text-primary truncate tabular-nums">ACC-8204</span>
        </div>
      </div>

      {/* Entity 3: Shared Device (Top Center Bridge) */}
      <div className="absolute top-[8%] sm:top-[12%] left-[30%] sm:left-[36%] bg-canvas-raised/95 border border-signal/40 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 shadow-md flex items-center gap-1.5">
        <Smartphone className="size-3 sm:size-3.5 text-signal" />
        <div className="flex items-center gap-1">
          <span className="text-[9px] sm:text-[10px] font-mono uppercase text-signal font-semibold">Device</span>
          <span className="text-[10px] sm:text-[11px] font-mono text-text-primary tabular-nums">DEV-IOS-22</span>
        </div>
      </div>

      {/* Entity 4: Shared Identity / Synthetic ID (Lower Center) */}
      <div className="absolute bottom-[14%] sm:bottom-[16%] left-[24%] sm:left-[35%] bg-canvas-raised/95 border border-border-medium rounded-full px-2 sm:px-3 py-1 sm:py-1.5 shadow-md flex items-center gap-1.5">
        <UserCheck className="size-3 sm:size-3.5 text-text-secondary" />
        <div className="flex items-center gap-1">
          <span className="text-[9px] sm:text-[10px] font-mono uppercase text-text-muted">Identity</span>
          <span className="text-[10px] sm:text-[11px] font-mono text-text-primary tabular-nums">SYN-ID-904</span>
        </div>
      </div>

      {/* Entity 5: Beneficiary / Offshore Terminal Hub (Right) */}
      <div className="absolute top-[52%] sm:top-[48%] right-[3%] sm:right-[6%] bg-canvas-raised/95 border border-risk/40 rounded-lg p-1.5 sm:p-2.5 shadow-xl flex items-center gap-1.5 sm:gap-2 max-w-[125px] sm:max-w-[160px]">
        <div className="size-5 sm:size-6 rounded bg-risk/20 border border-risk/40 flex items-center justify-center text-risk shrink-0">
          <ArrowRight className="size-3 sm:size-3.5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] sm:text-[10px] font-mono uppercase text-risk font-semibold tracking-wider">Beneficiary</span>
          <span className="text-[10px] sm:text-xs font-mono font-medium text-text-primary truncate tabular-nums">BEN-OFFSHORE</span>
        </div>
      </div>

      {/* Center Intelligence Focal Badge: Identified Fraud Ring */}
      <div className="absolute top-[38%] sm:top-[42%] left-[48%] sm:left-[55%] -translate-x-1/2 -translate-y-1/2 bg-canvas-overlay/95 border border-signal/50 rounded-xl p-2.5 sm:p-4 shadow-2xl backdrop-blur-md max-w-[160px] sm:max-w-[240px] text-center z-10">
        <div className="flex items-center justify-center gap-1 mb-0.5">
          <span className="size-1.5 sm:size-2 rounded-full bg-risk animate-ping opacity-75" />
          <span className="size-1.5 sm:size-2 rounded-full bg-risk inline-block" />
          <span className="text-[9px] sm:text-[10px] font-mono uppercase font-bold text-risk tracking-wider">
            High-risk flow
          </span>
        </div>
        <div className="font-heading font-bold text-xs sm:text-base text-text-primary tracking-tight">
          Fraud Ring #04
        </div>
        <div className="text-[10px] sm:text-[11px] font-mono text-signal mt-0.5 tabular-nums font-medium">
          ₦14.2M Exposure
        </div>
        <div className="mt-1.5 pt-1.5 sm:mt-2 sm:pt-2 border-t border-border-subtle flex items-center justify-between text-[9px] sm:text-[10px] text-text-muted">
          <span>Coordinated</span>
          <span className="font-mono text-text-secondary">4 Accounts</span>
        </div>
      </div>

      {/* Minimal Footer Telemetry Strip */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-text-muted border-t border-border-subtle pt-2">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-signal" />
          Graph Topology: Multi-Entity Resolution
        </span>
        <span className="tabular-nums">Pattern: Circular Dispersion</span>
      </div>
    </div>
  );
};
