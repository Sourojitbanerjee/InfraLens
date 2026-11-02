import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { InstitutionType } from '../../types/institution';
import { InstitutionClassificationEngine } from '../../services/institutionClassificationEngine';
import { InstitutionVerificationService } from '../../services/institutionVerificationService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InstitutionalRegistrationModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [officialCode, setOfficialCode] = useState('');
  const [institutionType, setInstitutionType] = useState<InstitutionType>('municipality');
  const [state, setState] = useState('West Bengal');
  const [district, setDistrict] = useState('Darjeeling');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nodalName, setNodalName] = useState('');
  const [nodalDesignation, setNodalDesignation] = useState('');
  const [nodalPhone, setNodalPhone] = useState('');
  const [nodalEmail, setNodalEmail] = useState('');
  const [wardCount, setWardCount] = useState<number>(35);
  const [population, setPopulation] = useState<number>(350000);
  const [teamCount, setTeamCount] = useState<number>(8);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  // Live algorithmic classification preview
  const liveClassification = InstitutionClassificationEngine.classify({
    institutionType,
    wardCount: Number(wardCount) || 1,
    populationEstimate: Number(population) || 1000,
    inspectionTeamCount: Number(teamCount) || 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = InstitutionVerificationService.registerInstitution({
        name,
        officialCode: officialCode || `ULB-${state.slice(0, 2).toUpperCase()}-${name.slice(0, 3).toUpperCase()}`,
        institutionType,
        state,
        district,
        headquartersAddress: address,
        officialEmail: email,
        officialPhone: phone,
        nodalOfficerName: nodalName,
        nodalOfficerDesignation: nodalDesignation,
        nodalOfficerPhone: nodalPhone,
        nodalOfficerEmail: nodalEmail,
        wardCountEstimate: Number(wardCount),
        populationEstimate: Number(population),
        inspectionTeamCountEstimate: Number(teamCount),
      });

      setSubmissionSuccess(result.message);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 my-8 text-slate-100"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          {submissionSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white">Registration Application Submitted</h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">{submissionSuccess}</p>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 max-w-md mx-auto">
                Assigned Size Tier: <strong>{liveClassification.effectiveTier}</strong> (Composite Score: {liveClassification.compositeScore}/100)
              </div>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm"
              >
                Close & Return
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Onboard Municipal Authority or Gram Panchayat</h2>
                  <p className="text-xs text-slate-400">Institutional registration with algorithmic size evaluation and verification checklist.</p>
                </div>
              </div>

              {/* Live Classification Banner */}
              <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/30 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">Algorithmic Scale Assessment:</span>
                  <span className="px-2 py-0.5 rounded font-bold bg-emerald-500 text-slate-950">
                    {liveClassification.effectiveTier} TIER
                  </span>
                </div>
                <div className="text-emerald-400 font-semibold">
                  Score: {liveClassification.compositeScore} / 100
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <label className="text-slate-400">Institution Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Siliguri Municipal Corporation"
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400">Institution Type</label>
                  <select
                    value={institutionType}
                    onChange={(e) => setInstitutionType(e.target.value as InstitutionType)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="municipal_corporation">Municipal Corporation (Large ULB)</option>
                    <option value="municipality">Municipality (Medium ULB)</option>
                    <option value="municipal_board">Municipal Board / Town Council</option>
                    <option value="gram_panchayat">Gram Panchayat (Rural Village Level)</option>
                    <option value="panchayat_samiti">Panchayat Samiti (Block Level)</option>
                    <option value="zilla_parishad">Zilla Parishad (District Level)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400">District</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-400">Official Headquarters Address</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Baghajatin Park Road, Siliguri 734001"
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400">Official Municipal Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="commissioner@smc.gov.in"
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400">Official Helpline Phone</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 353 243 2888"
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Sizing Parameters */}
                <div>
                  <label className="text-slate-400">Estimated Population</label>
                  <input
                    type="number"
                    value={population}
                    onChange={(e) => setPopulation(parseInt(e.target.value, 10))}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400">Number of Wards / Gram Sansads</label>
                  <input
                    type="number"
                    value={wardCount}
                    onChange={(e) => setWardCount(parseInt(e.target.value, 10))}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-400">Field Inspection Teams Available</label>
                  <input
                    type="number"
                    value={teamCount}
                    onChange={(e) => setTeamCount(parseInt(e.target.value, 10))}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Nodal Officer Section */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-800">
                  <div className="text-slate-300 font-bold mb-2">Designated Municipal Nodal Officer</div>
                </div>

                <div>
                  <label className="text-slate-400">Nodal Officer Full Name</label>
                  <input
                    type="text"
                    required
                    value={nodalName}
                    onChange={(e) => setNodalName(e.target.value)}
                    placeholder="Er. Sourav Roy"
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400">Official Designation</label>
                  <input
                    type="text"
                    required
                    value={nodalDesignation}
                    onChange={(e) => setNodalDesignation(e.target.value)}
                    placeholder="Executive Engineer (Civil)"
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400">Nodal Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={nodalPhone}
                    onChange={(e) => setNodalPhone(e.target.value)}
                    placeholder="+91 94340 11223"
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400">Nodal Official Email</label>
                  <input
                    type="email"
                    required
                    value={nodalEmail}
                    onChange={(e) => setNodalEmail(e.target.value)}
                    placeholder="sourav.roy@siligurismc.in"
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  {isSubmitting ? 'Evaluating Scale...' : 'Submit Institutional Onboarding'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
