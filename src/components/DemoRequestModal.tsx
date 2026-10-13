import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Lock,
  Sparkles,
} from 'lucide-react';

interface DemoRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchPortal: () => void;
}

export const DemoRequestModal: React.FC<DemoRequestModalProps> = ({
  isOpen,
  onClose,
  onLaunchPortal,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    email: '',
    institution: 'Zenith Bank Plc',
    coreBanking: 'Infosys Finacle 11.0',
    deployment: 'Private Banking Cloud VPC',
    focus: 'Cross-Bank Mule Ring Disruption',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referenceCode, setReferenceCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate verified registration handshake
    setTimeout(() => {
      const code = `FININT-BRF-${Math.floor(1000 + Math.random() * 9000)}`;
      setReferenceCode(code);
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 900);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReset()}>
      <DialogContent className="max-w-2xl bg-canvas-raised border border-border-strong text-text-primary p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        {!isSubmitted ? (
          <>
            <DialogHeader className="text-left space-y-2 mb-6">
              <div className="flex items-center gap-2">
                <Badge variant="signal" className="font-mono text-xs gap-1.5 py-0.5">
                  <ShieldCheck className="size-3.5" />
                  Institutional Clearance
                </Badge>
                <span className="text-xs font-mono text-text-muted">
                  Zenith Zecathon 6.0 Track 6
                </span>
              </div>
              <DialogTitle className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-text-primary">
                Schedule Executive Briefing & Sandbox Access
              </DialogTitle>
              <DialogDescription className="text-text-secondary text-sm leading-relaxed">
                Reserved for Chief Risk Officers, Heads of AML/CFT Compliance, and Core Banking
                Architects evaluating in-flight syndicate disruption.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">
                    Officer Full Name
                  </label>
                  <div className="relative">
                    <User className="size-4 text-text-muted absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Babatunde Alabi"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-canvas border border-border-medium rounded-xl py-2 pl-9 pr-3 text-sm text-text-primary focus:outline-none focus:border-signal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">
                    Official Title / Role
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Head of AML Surveillance"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-canvas border border-border-medium rounded-xl py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-signal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">
                    Institutional Email Address
                  </label>
                  <div className="relative">
                    <Mail className="size-4 text-text-muted absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="b.alabi@zenithbank.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-canvas border border-border-medium rounded-xl py-2 pl-9 pr-3 text-sm text-text-primary focus:outline-none focus:border-signal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">
                    Financial Institution / Agency
                  </label>
                  <div className="relative">
                    <Building2 className="size-4 text-text-muted absolute left-3 top-3" />
                    <select
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      className="w-full bg-canvas border border-border-medium rounded-xl py-2 pl-9 pr-3 text-sm text-text-primary focus:outline-none focus:border-signal"
                    >
                      <option value="Zenith Bank Plc">Zenith Bank Plc</option>
                      <option value="Access Bank Plc">Access Bank Plc</option>
                      <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                      <option value="Guaranty Trust Bank (GTCO)">Guaranty Trust Bank (GTCO)</option>
                      <option value="United Bank for Africa (UBA)">United Bank for Africa (UBA)</option>
                      <option value="OPay Digital Services">OPay Digital Services</option>
                      <option value="Kuda Microfinance Bank">Kuda Microfinance Bank</option>
                      <option value="Moniepoint MFB">Moniepoint MFB</option>
                      <option value="Nigeria Financial Intelligence Unit (NFIU)">
                        Nigeria Financial Intelligence Unit (NFIU)
                      </option>
                      <option value="Central Bank of Nigeria (CBN)">Central Bank of Nigeria (CBN)</option>
                      <option value="Other Regulated Financial Entity">Other Regulated Entity</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">
                    Core Banking Integration
                  </label>
                  <select
                    value={formData.coreBanking}
                    onChange={(e) => setFormData({ ...formData, coreBanking: e.target.value })}
                    className="w-full bg-canvas border border-border-medium rounded-xl py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-signal"
                  >
                    <option value="Infosys Finacle 11.0">Infosys Finacle 11.0 (FI SOAP)</option>
                    <option value="Infosys Finacle 10.x">Infosys Finacle 10.x</option>
                    <option value="Temenos T24 Transact">Temenos T24 Transact</option>
                    <option value="Oracle FLEXCUBE">Oracle FLEXCUBE</option>
                    <option value="Custom Neobank / API Core">Custom Neobank / Microservices Core</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">
                    Deployment Enclave
                  </label>
                  <select
                    value={formData.deployment}
                    onChange={(e) => setFormData({ ...formData, deployment: e.target.value })}
                    className="w-full bg-canvas border border-border-medium rounded-xl py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-signal"
                  >
                    <option value="Private Banking Cloud VPC">Private Bank Cloud VPC (Azure/AWS Gov)</option>
                    <option value="Sovereign On-Premise Tier-3 DC">
                      Sovereign On-Premise Tier-3 DC
                    </option>
                    <option value="Dedicated Air-Gapped Sandbox">
                      Dedicated Air-Gapped Test Enclave
                    </option>
                  </select>
                </div>
              </div>

              {/* Data Sovereignty Guarantee Note */}
              <div className="p-3.5 rounded-xl bg-canvas border border-border-subtle flex items-start gap-3 text-xs text-text-muted">
                <Lock className="size-4 text-signal shrink-0 mt-0.5" />
                <span>
                  NDPA 2023 §39 In-VPC Data Sovereignty enforced. Sandbox requests are provisioned
                  with synthetically salted NIBSS telemetry matching institutional privacy controls.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-border-subtle">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="w-full sm:w-auto text-xs text-text-muted hover:text-text-primary cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto font-semibold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 px-6 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-slate-950 animate-ping" />
                      Dispatching Institutional Request...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>Confirm Executive Request</span>
                      <ArrowRight className="size-4" />
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-6 space-y-6">
            <div className="size-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="size-8" />
            </div>

            <div>
              <Badge variant="verified" className="font-mono text-xs mb-3">
                Clearance Granted &bull; {referenceCode}
              </Badge>
              <h3 className="font-heading font-extrabold text-2xl text-text-primary">
                Executive Briefing Request Registered
              </h3>
              <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto leading-relaxed">
                Institutional documentation, Finacle 11.0 SOAP envelope definitions, and sandbox keys
                have been queued for dispatch to <strong className="text-text-primary">{formData.email}</strong>.
              </p>
            </div>

            <div className="bg-canvas border border-border-medium rounded-xl p-4 max-w-md mx-auto text-left text-xs font-mono space-y-1.5 text-text-muted">
              <div>
                <span className="text-text-secondary">Institution:</span> {formData.institution}
              </div>
              <div>
                <span className="text-text-secondary">Core Switch:</span> {formData.coreBanking}
              </div>
              <div>
                <span className="text-text-secondary">Deployment:</span> {formData.deployment}
              </div>
              <div>
                <span className="text-text-secondary">Audit Status:</span> Pre-screened for CBN AML/CFT 2022
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="default"
                onClick={() => {
                  handleReset();
                  onLaunchPortal();
                }}
                className="w-full sm:w-auto font-semibold text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 gap-2 cursor-pointer"
              >
                <Sparkles className="size-4" />
                <span>Launch AML Operations Portal Now</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full sm:w-auto text-xs cursor-pointer"
              >
                Close Window
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
