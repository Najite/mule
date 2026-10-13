import React from 'react';
import { Network } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-canvas border-t border-border-subtle py-14 sm:py-16 text-text-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-12 border-b border-border-subtle">
          {/* Brand Info */}
          <div className="flex flex-col gap-2 max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-canvas-raised border border-border-medium flex items-center justify-center text-signal">
                <Network className="size-4" aria-hidden="true" />
              </div>
              <span className="font-heading font-bold text-lg text-text-primary tracking-tight">
                FININT
              </span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Financial Intelligence Network — Transforming fragmented transactions into
              connected criminal intelligence.
            </p>
          </div>

          {/* Platform Category and Nav */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs font-mono">
            <div className="flex flex-col gap-2.5">
              <span className="text-text-primary font-semibold uppercase tracking-wider">
                Architecture
              </span>
              <a href="#problem" className="text-text-muted hover:text-text-primary transition-colors">
                The Problem
              </a>
              <a href="#shift" className="text-text-muted hover:text-text-primary transition-colors">
                The FININT Shift
              </a>
              <a href="#flagship" className="text-text-muted hover:text-text-primary transition-colors">
                Ring Intelligence
              </a>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-text-primary font-semibold uppercase tracking-wider">
                Platform
              </span>
              <a href="#preview" className="text-text-muted hover:text-text-primary transition-colors">
                Canvas Preview
              </a>
              <a href="#capabilities" className="text-text-muted hover:text-text-primary transition-colors">
                Capabilities
              </a>
              <a href="#roi-calculator" className="text-text-muted hover:text-text-primary transition-colors">
                ROI Impact Model
              </a>
              <a href="#faq" className="text-text-muted hover:text-text-primary transition-colors">
                Architecture FAQ
              </a>
              <a href="#differentiation" className="text-text-muted hover:text-text-primary transition-colors">
                Differentiation
              </a>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-text-primary font-semibold uppercase tracking-wider">
                Compliance & Rails
              </span>
              <span className="text-text-muted">NFIU / CBN AML/CFT Compliant</span>
              <span className="text-text-muted">NIBSS NIP & Finacle API Native</span>
              <span className="text-text-muted">NDPR Data Protection Audited</span>
            </div>
          </div>
        </div>

        {/* Bottom Rights & Disclaimers */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-text-muted">
          <div>
            © {new Date().getFullYear()} FININT. Zenith Bank Zecathon 6.0 — Track 6: Digital Fraud Disruption.
          </div>
          <div>
            Program Implementation Partner: Beyond Limits
          </div>
        </div>
      </div>
    </footer>
  );
};
