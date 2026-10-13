import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, ArrowUpRight, Network } from 'lucide-react';

interface NavbarProps {
  onOpenExplore: () => void;
  onOpenHowItWorks: () => void;
  onOpenBlueprint?: () => void;
  onLaunchPortal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenExplore,
  onOpenHowItWorks,
  onOpenBlueprint,
  onLaunchPortal,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'The Problem', href: '#problem' },
    { label: 'The FININT Shift', href: '#shift' },
    { label: 'Ring Intelligence', href: '#flagship' },
    { label: 'Live Studio', href: '#workbench' },
    { label: 'Capabilities', href: '#capabilities' },
    { label: 'Differentiation', href: '#differentiation' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-canvas/90 backdrop-blur-md border-b border-border-subtle py-3.5 shadow-md shadow-black/40'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brandmark */}
        <a
          href="#"
          className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded-lg p-1"
          aria-label="FININT Home"
        >
          <div className="size-9 rounded-lg bg-canvas-raised border border-border-medium flex items-center justify-center text-signal group-hover:border-signal/50 transition-colors shadow-sm">
            <Network className="size-5 text-signal" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-lg tracking-tight text-text-primary">
                FININT
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-canvas-overlay border border-border-subtle text-signal font-semibold tracking-wider">
                Platform
              </span>
            </div>
            <span className="text-[11px] text-text-secondary font-medium tracking-tight">
              Financial Intelligence Network
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs xl:text-sm font-medium text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-md hover:bg-canvas-raised transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Header Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {onLaunchPortal && (
            <Button
              variant="default"
              size="sm"
              onClick={onLaunchPortal}
              className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold shadow-md shadow-amber-500/20 border border-amber-400/40"
            >
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Launch AML Portal</span>
              <span className="text-[9px] font-mono uppercase bg-slate-950/40 text-amber-200 px-1.5 py-0.2 rounded">
                Supabase Live
              </span>
            </Button>
          )}

          {onOpenBlueprint && (
            <button
              type="button"
              onClick={onOpenBlueprint}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium tracking-wide bg-signal/10 border border-signal/30 text-signal hover:bg-signal/20 transition-all cursor-pointer"
              title="View Zenith Bank Zecathon 6.0 Track 6 Integration Blueprint"
            >
              <span className="size-1.5 rounded-full bg-signal animate-pulse" />
              <span>Zecathon 6.0 Blueprint</span>
            </button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenHowItWorks}
            className="text-xs text-text-secondary hover:text-text-primary"
          >
            See How It Works
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenExplore}
            className="gap-1.5 border-border-medium hover:border-signal/40 text-xs"
          >
            <span>Explore FININT</span>
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-canvas-raised/98 border-b border-border-medium px-4 pt-4 pb-6 backdrop-blur-xl shadow-xl">
          <nav className="flex flex-col gap-2" aria-label="Mobile Navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-text-primary px-3 py-2 rounded-lg hover:bg-canvas-overlay"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 pt-4 border-t border-border-subtle flex flex-col gap-2.5">
            {onLaunchPortal && (
              <Button
                variant="default"
                className="w-full justify-center bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold gap-2"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLaunchPortal();
                }}
              >
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Launch AML Portal (Supabase Live)</span>
              </Button>
            )}
            {onOpenBlueprint && (
              <Button
                variant="outline"
                className="w-full justify-center border-signal/40 text-signal hover:bg-signal/10"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBlueprint();
                }}
              >
                Zenith Zecathon 6.0 Blueprint
              </Button>
            )}
            <Button
              variant="default"
              className="w-full justify-center"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenExplore();
              }}
            >
              Explore FININT
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenHowItWorks();
              }}
            >
              See How It Works
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
