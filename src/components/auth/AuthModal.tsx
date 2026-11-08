import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInfra } from '../../context/InfraContext';
import { authService, DEMO_PERSONAS, DemoAccountInfo } from '../../services/authService';
import { 
  X, 
  ShieldCheck, 
  KeyRound, 
  User, 
  Building2, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  Users,
  Smartphone,
  ShieldAlert,
  LogOut,
  ArrowRight
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../i18n/translations';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'citizen-register' | 'institution-register' | 'personas';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
}) => {
  const { 
    currentUser, 
    setCurrentUser, 
    addToast, 
    setCurrentView 
  } = useInfra();

  const [activeTab, setActiveTab] = useState<'login' | 'citizen-register' | 'institution-register' | 'personas'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Citizen Registration Form State
  const [citizenName, setCitizenName] = useState('');
  const [citizenEmail, setCitizenEmail] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [citizenPassword, setCitizenPassword] = useState('');
  const [citizenLocality, setCitizenLocality] = useState('Connaught Place');
  const [citizenPincode, setCitizenPincode] = useState('110001');
  const [citizenLang, setCitizenLang] = useState('en');

  // Institution Onboarding State
  const [instName, setInstName] = useState('New Delhi Municipal Council');
  const [instType, setInstType] = useState('municipal_corporation');
  const [instOfficer, setInstOfficer] = useState('');
  const [instEmail, setInstEmail] = useState('');
  const [instSubmitted, setInstSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const session = await authService.login({ email, password });
      setCurrentUser(session);
      addToast(`Authenticated as ${session.fullName} (${session.officialTitle || session.role})`, 'success');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPersona = (key: string) => {
    const session = authService.loginAsDemoPersona(key);
    setCurrentUser(session);
    addToast(`Switched active persona to ${session.fullName} (${session.officialTitle})`, 'info');
    
    // Automatically route to appropriate dashboard based on role
    if (session.role === 'INFRALENS_SUPER_ADMIN') {
      setCurrentView('super-admin');
    } else if (session.role === 'CHIEF_FIELD_INSPECTOR') {
      setCurrentView('chief-inspector');
    } else if (session.role === 'DEPARTMENT_SUPERVISOR') {
      setCurrentView('supervisor');
    } else if (session.role === 'FIELD_INSPECTOR') {
      setCurrentView('inspector-mobile');
    } else if (session.role === 'CITIZEN') {
      setCurrentView('citizen-portal');
    } else {
      setCurrentView('dashboard');
    }

    onClose();
  };

  const handleCitizenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const session = await authService.registerCitizen({
        fullName: citizenName,
        email: citizenEmail,
        phone: citizenPhone,
        password: citizenPassword,
        state: 'Delhi',
        district: 'New Delhi',
        cityOrVillage: 'New Delhi',
        locality: citizenLocality,
        pincode: citizenPincode,
        preferredLanguage: citizenLang,
        preferredPrivacyRadiusMeters: 1000,
      });
      setCurrentUser(session);
      addToast(`Citizen account registered! Welcome ${session.fullName}`, 'success');
      setCurrentView('citizen-portal');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInstitutionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInstSubmitted(true);
    addToast(`Institutional verification submitted for ${instName}. Under review.`, 'success');
  };

  const handleLogout = () => {
    authService.logout();
    // Default back to Citizen view on logout
    const defaultCitizen = authService.loginAsDemoPersona('citizen');
    setCurrentUser(defaultCitizen);
    addToast('Signed out of official session. Logged in as Public Citizen.', 'info');
    setCurrentView('citizen-portal');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#090D17] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#0C1222] via-[#0E1628] to-[#0A0E18]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-cyan-400 font-extrabold flex items-center gap-2">
                <span>INFRALENS ACCESS CONTROL</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                  Govt of India ULB Ops
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white font-sans">
                Identity Authentication & RBAC Verification
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Identity Banner if logged in */}
        {currentUser && (
          <div className="px-5 py-2.5 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-cyan-950/30 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">Active Identity:</span>
              <span className="text-white font-bold">{currentUser.fullName}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300">
                {currentUser.officialTitle || currentUser.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[11px]"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-[#0A0F1D] text-xs font-mono overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('login')}
            className={`px-4 py-3 flex items-center gap-1.5 border-b-2 font-medium transition-colors shrink-0 ${
              activeTab === 'login'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Official Sign In</span>
          </button>

          <button
            onClick={() => setActiveTab('personas')}
            className={`px-4 py-3 flex items-center gap-1.5 border-b-2 font-medium transition-colors shrink-0 ${
              activeTab === 'personas'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300">Quick Personas</span>
            <span className="text-[9px] px-1.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40">
              Demo
            </span>
          </button>

          <button
            onClick={() => setActiveTab('citizen-register')}
            className={`px-4 py-3 flex items-center gap-1.5 border-b-2 font-medium transition-colors shrink-0 ${
              activeTab === 'citizen-register'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Citizen Sign Up</span>
          </button>

          <button
            onClick={() => setActiveTab('institution-register')}
            className={`px-4 py-3 flex items-center gap-1.5 border-b-2 font-medium transition-colors shrink-0 ${
              activeTab === 'institution-register'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>ULB Onboarding</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'login' && (
            <div className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wide">
                    Official Email / Citizen Identifier
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. director@demo.infralens.gov.in"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0E1524] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wide">
                    Security Password / GovToken
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0E1524] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-900/30"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Official Console'}</span>
                  </button>
                </div>
              </form>

              {/* Instant One-Click Demo Personas Hint */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Technical Evaluation Demo Passwords
                  </span>
                  <button
                    onClick={() => setActiveTab('personas')}
                    className="text-cyan-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>View all personas</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div 
                    onClick={() => handleSelectPersona('director')}
                    className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-colors"
                  >
                    <div className="font-bold text-cyan-300">Dr. Rameshwar Sharma</div>
                    <div className="text-slate-400 text-[10px]">Director of Operations</div>
                  </div>
                  <div 
                    onClick={() => handleSelectPersona('inspector')}
                    className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-colors"
                  >
                    <div className="font-bold text-emerald-300">Vikram Rawat</div>
                    <div className="text-slate-400 text-[10px]">Field Inspector (Mobile)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'personas' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Select any persona below to switch role instantly and test their distinct view permissions & operational workflows.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.keys(DEMO_PERSONAS).map((key) => {
                  const persona = DEMO_PERSONAS[key];
                  const isCurrent = currentUser?.email === persona.email;

                  return (
                    <div
                      key={key}
                      onClick={() => handleSelectPersona(key)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-900/30'
                          : 'bg-[#0E1524] border-slate-800 hover:border-slate-700 hover:bg-[#121B2F]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-xs font-sans">
                          {persona.fullName}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-cyan-300 font-semibold mb-1">
                        {persona.officialTitle}
                      </div>

                      <div className="text-[10px] text-slate-400 truncate">
                        {persona.institutionName}
                      </div>

                      <div className="text-[9px] text-slate-500 mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
                        <span>{persona.disclaimer}</span>
                        <ArrowRight className="w-3 h-3 text-cyan-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'citizen-register' && (
            <form onSubmit={handleCitizenRegister} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">Full Name</label>
                  <input
                    type="text"
                    required
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    placeholder="e.g. Pooja Sharma"
                    className="w-full px-3 py-2 rounded-lg bg-[#0E1524] border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={citizenPhone}
                    onChange={(e) => setCitizenPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-lg bg-[#0E1524] border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">Email Address</label>
                  <input
                    type="email"
                    required
                    value={citizenEmail}
                    onChange={(e) => setCitizenEmail(e.target.value)}
                    placeholder="pooja.sharma@example.com"
                    className="w-full px-3 py-2 rounded-lg bg-[#0E1524] border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">Password</label>
                  <input
                    type="password"
                    required
                    value={citizenPassword}
                    onChange={(e) => setCitizenPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full px-3 py-2 rounded-lg bg-[#0E1524] border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">Locality / Ward</label>
                  <input
                    type="text"
                    value={citizenLocality}
                    onChange={(e) => setCitizenLocality(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0E1524] border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">PIN Code</label>
                  <input
                    type="text"
                    value={citizenPincode}
                    onChange={(e) => setCitizenPincode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0E1524] border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">Preferred Language</label>
                  <select
                    value={citizenLang}
                    onChange={(e) => setCitizenLang(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0E1524] border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.nativeName} ({l.englishName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Registering...' : 'Create Verified Citizen Account'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'institution-register' && (
            instSubmitted ? (
              <div className="p-6 text-center font-mono space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white font-sans">
                  Institutional Verification Docket Submitted
                </h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Your registration for <strong className="text-cyan-300">{instName}</strong> has been assigned Docket <strong className="text-amber-300">#NDMC-2026-V889</strong>. Our state compliance officers will verify your government authorization letter within 24 hours.
                </p>
                <button
                  onClick={() => setInstSubmitted(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                >
                  Submit Another ULB Application
                </button>
              </div>
            ) : (
              <form onSubmit={handleInstitutionSubmit} className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-[11px] leading-relaxed">
                  Institutional access is restricted to verified Local Urban Bodies (ULBs), Panchayati Raj Institutions (PRIs), Public Works Departments (PWD), and State Utilities.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Institution Name</label>
                    <input
                      type="text"
                      required
                      value={instName}
                      onChange={(e) => setInstName(e.target.value)}
                      placeholder="e.g. New Delhi Municipal Council"
                      className="w-full px-3 py-2 rounded-lg bg-[#0E1524] border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Institution Category</label>
                    <select
                      value={instType}
                      onChange={(e) => setInstType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#0E1524] border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="municipal_corporation">Municipal Corporation (ULB Tier 1)</option>
                      <option value="municipality">Municipality (ULB Tier 2)</option>
                      <option value="gram_panchayat">Gram Panchayat (Rural Tier 1)</option>
                      <option value="state_highway_dept">State PWD / Highway Authority</option>
                      <option value="discom_utility">Electricity Distribution DISCOM</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Authorized Officer Designation</label>
                    <input
                      type="text"
                      required
                      value={instOfficer}
                      onChange={(e) => setInstOfficer(e.target.value)}
                      placeholder="e.g. Executive Engineer (Civil)"
                      className="w-full px-3 py-2 rounded-lg bg-[#0E1524] border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Official Email (.gov.in / .nic.in)</label>
                    <input
                      type="email"
                      required
                      value={instEmail}
                      onChange={(e) => setInstEmail(e.target.value)}
                      placeholder="officer@ndmc.gov.in"
                      className="w-full px-3 py-2 rounded-lg bg-[#0E1524] border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-900/30"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Submit Institutional Onboarding Dossier</span>
                  </button>
                </div>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
};
