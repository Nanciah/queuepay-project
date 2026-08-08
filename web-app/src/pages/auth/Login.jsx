import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { auth } from '../../services/api';

// ─── Icônes SVG inline ───
const MailIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const ShieldIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ArrowRightIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const LoaderIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'super_admin',
  });

  useEffect(() => { setMounted(true); }, []);

  const roles = [
    { id: 'super_admin', label: 'Super Admin', color: 'from-violet-500 to-purple-600', icon: '👑', desc: 'Contrôle total' },
    { id: 'company_admin', label: 'Admin Entreprise', color: 'from-blue-500 to-cyan-500', icon: '🏢', desc: 'Gestion entreprise' },
    { id: 'agent', label: 'Agent', color: 'from-emerald-500 to-teal-500', icon: '🎧', desc: 'Interface agent' },
  ];

  const activeRole = roles.find(r => r.id === formData.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('📝 Tentative de connexion avec:', formData.email);
      console.log('🎯 Rôle sélectionné:', formData.role);

      const response = await auth.login(formData.email, formData.password);
      console.log('✅ Réponse du serveur:', response.data);

      const { token, user } = response.data;

      if (user.role !== formData.role) {
        toast.error(`Ce compte n'a pas le rôle "${formData.role}"`);
        setIsLoading(false);
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('🔑 Token stocké:', token);
      console.log('👤 Utilisateur stocké:', user);

      const redirectMap = {
        super_admin: '/super-admin/dashboard',
        company_admin: '/company-admin/dashboard',
        agent: '/agent/dashboard',
      };

      const redirectPath = redirectMap[user.role] || '/';
      console.log(`👤 Rôle: ${user.role} → Redirection vers: ${redirectPath}`);

      toast.success(`Bienvenue ${user.firstName}!`);
      window.location.href = redirectPath;

    } catch (error) {
      console.error('❌ Erreur login:', error);
      toast.error(error.response?.data?.error || 'Erreur de connexion');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex overflow-hidden relative">

      {/* ════════════════════════════════════════
           PANNEAU GAUCHE — Visuel immersif
          ════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative items-center justify-center overflow-hidden">
        {/* Fond animé */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950" />

        {/* Orbes lumineux */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />

        {/* Grille */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

        {/* Contenu central */}
        <div className={`relative z-10 text-center px-12 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {/* Logo géant */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl animate-spin" style={{ animationDuration: '4s' }} />
            <div className="absolute inset-[3px] bg-slate-900 rounded-3xl flex items-center justify-center">
              <span className="text-6xl">⏱️</span>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full animate-ping" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full" />
          </div>

          <h1 className="text-6xl xl:text-7xl font-black text-white tracking-tight mb-4">
            Queue<span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Pay</span>
          </h1>

          <p className="text-xl text-slate-400 font-light tracking-wide mb-8">
            Administration & Gestion de Files d'Attente
          </p>

          {/* Badges */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {[
              { icon: '🔒', text: 'Sécurisé' },
              { icon: '⚡', text: 'Rapide' },
              { icon: '🌍', text: 'Madagascar' },
            ].map((badge, i) => (
              <div key={i} className="px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-sm text-slate-300 flex items-center gap-2 hover:bg-white/10 transition-colors duration-300">
                <span>{badge.icon}</span>
                <span className="font-medium">{badge.text}</span>
              </div>
            ))}
          </div>

          {/* Ligne décorative */}
          <div className="mt-12 w-32 h-1 mx-auto rounded-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

          <p className="mt-8 text-xs text-slate-600 uppercase tracking-[0.3em]">
            © 2026 QueuePay — Tous droits réservés
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════
           PANNEAU DROIT — Formulaire compact
          ════════════════════════════════════════ */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex items-center justify-center p-6 lg:p-10 relative">
        {/* Fond subtil du panneau droit */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />

        <div className={`w-full max-w-md relative z-10 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>

          {/* Carte formulaire */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:p-8 shadow-2xl">

            {/* Header mobile uniquement */}
            <div className="lg:hidden text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">⏱️</span>
              </div>
              <h1 className="text-2xl font-black text-white">
                Queue<span className="text-indigo-400">Pay</span>
              </h1>
            </div>

            <h2 className="text-xl font-bold text-white mb-1">Connexion</h2>
            <p className="text-sm text-slate-500 mb-6">Accédez à votre espace administrateur</p>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Rôles — chips compactes */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Espace de connexion
                </label>
                <div className="flex gap-2">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: role.id })}
                      className={`flex-1 relative p-2.5 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden text-center
                        ${formData.role === role.id 
                          ? `border-white/30 bg-gradient-to-br ${role.color} shadow-lg shadow-${role.color.split('-')[1]}-500/20` 
                          : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10'
                        }`}
                    >
                      <div className="text-xl mb-0.5">{role.icon}</div>
                      <div className={`text-[10px] font-bold leading-tight ${formData.role === role.id ? 'text-white' : 'text-slate-400'}`}>
                        {role.label}
                      </div>
                      {formData.role === role.id && (
                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-600 mt-1.5 flex items-center gap-1">
                  <ShieldIcon className="w-3 h-3" />
                  {activeRole?.desc}
                </p>
              </div>

              {/* Email */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <div className={`relative transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.01]' : ''}`}>
                  <MailIcon className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${focusedField === 'email' ? 'text-indigo-400' : 'text-slate-600'}`} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white placeholder-slate-600 
                      focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 
                      transition-all duration-300 hover:bg-white/[0.06]"
                    placeholder="admin@queuepay.mg"
                    required
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Mot de passe
                </label>
                <div className={`relative transition-all duration-300 ${focusedField === 'password' ? 'scale-[1.01]' : ''}`}>
                  <LockIcon className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${focusedField === 'password' ? 'text-indigo-400' : 'text-slate-600'}`} />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white placeholder-slate-600 
                      focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 
                      transition-all duration-300 hover:bg-white/[0.06]"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="mt-1.5 text-right">
                  <Link 
                    to="/forgot-password" 
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors inline-flex items-center gap-0.5 group"
                  >
                    Mot de passe oublié ?
                    <ArrowRightIcon className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>

              {/* Bouton */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full py-3 rounded-xl font-bold text-sm text-white overflow-hidden transition-all duration-300 
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
                  hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <LoaderIcon className="w-4 h-4 animate-spin" />
                      <span>Connexion...</span>
                    </>
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <ArrowRightIcon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Info credentials */}
            <div className="mt-4 p-3 bg-white/[0.03] rounded-lg border border-white/5 hover:border-white/10 transition-colors duration-300">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shrink-0">
                  <span className="text-sm">🔑</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">Super Admin</p>
                  <p className="text-[9px] text-slate-600 font-mono">admin@queuepay.mg</p>
                  <p className="text-[9px] text-slate-700 font-mono">Admin@2026#QueuePay</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default Login;