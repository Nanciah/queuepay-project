import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, CreditCard, BarChart3, 
  Plus, Settings, TrendingUp, ChevronRight,
  ArrowUpRight, Sparkles, Activity
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { superAdmin } from '../../services/api';
import Layout from '../../components/layout/Layout';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    setMounted(true);
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await superAdmin.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  const statCards = [
    { 
      icon: Building2, 
      label: 'Entreprises', 
      value: stats?.totalCompanies || 0,
      color: 'indigo',
      gradient: 'from-indigo-500 to-violet-600',
      bgGradient: 'from-indigo-50 to-violet-50',
      link: '/super-admin/companies'
    },
    { 
      icon: Users, 
      label: 'Utilisateurs', 
      value: stats?.totalUsers || 0,
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      link: '/super-admin/users'
    },
    { 
      icon: CreditCard, 
      label: 'Revenus', 
      value: `${(stats?.totalRevenue || 0).toLocaleString()} Ar`,
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50',
      link: '/super-admin/transactions'
    },
    { 
      icon: BarChart3, 
      label: 'Tickets', 
      value: stats?.totalTickets || 0,
      color: 'purple',
      gradient: 'from-purple-500 to-fuchsia-500',
      bgGradient: 'from-purple-50 to-fuchsia-50',
      link: '/super-admin/tickets'
    },
  ];

  const quickActions = [
    {
      icon: Building2,
      label: 'Gérer entreprises',
      desc: 'Ajouter, modifier, supprimer',
      gradient: 'from-indigo-500 to-violet-600',
      bg: 'bg-indigo-50',
      hoverBg: 'hover:bg-indigo-100',
      text: 'text-indigo-700',
      subtext: 'text-indigo-600',
      link: '/super-admin/companies'
    },
    {
      icon: Users,
      label: 'Gérer utilisateurs',
      desc: 'Voir et gérer les comptes',
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
      hoverBg: 'hover:bg-blue-100',
      text: 'text-blue-700',
      subtext: 'text-blue-600',
      link: '/super-admin/users'
    },
    {
      icon: Settings,
      label: 'Configuration',
      desc: 'Paramètres système',
      gradient: 'from-slate-500 to-slate-600',
      bg: 'bg-slate-50',
      hoverBg: 'hover:bg-slate-100',
      text: 'text-slate-700',
      subtext: 'text-slate-600',
      link: '/super-admin/settings'
    },
    {
      icon: TrendingUp,
      label: 'Rapports',
      desc: 'Statistiques détaillées',
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50',
      hoverBg: 'hover:bg-emerald-100',
      text: 'text-emerald-700',
      subtext: 'text-emerald-600',
      link: '/super-admin/reports'
    },
  ];

  return (
    <Layout title="Tableau de bord"> 
      <div className="max-w-7xl mx-auto">

        {/* ═══ HEADER ═══ */}
        <div className={`flex flex-wrap justify-between items-end mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-600">Super Admin</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-600">En ligne</span>
              </div>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Tableau de bord
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Bienvenue <span className="font-semibold text-gray-700">{user?.firstName}</span> ! Voici un aperçu de la plateforme
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/super-admin/companies/create')}
            className="mt-4 sm:mt-0 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 flex items-center gap-2">
              <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
              Nouvelle entreprise
            </span>
          </Button>
        </div>

        {/* ═══ STATS CARDS ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const isHovered = hoveredCard === index;

            return (
              <div
                key={index}
                className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <Card
                  className={`relative overflow-hidden cursor-pointer transition-all duration-300 
                    ${isHovered ? 'shadow-xl shadow-indigo-500/10 scale-[1.02]' : 'shadow-sm hover:shadow-md'}
                    border border-gray-100 hover:border-indigo-200`}
                  onClick={() => navigate(stat.link)}
                >
                  {/* Fond gradient subtil au hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 transition-opacity duration-500 ${isHovered ? 'opacity-100' : ''}`} />

                  {/* Halo décoratif */}
                  <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${stat.gradient} rounded-full blur-2xl opacity-0 transition-opacity duration-500 ${isHovered ? 'opacity-20' : ''}`} />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg shadow-${stat.color}-500/20 transition-transform duration-300 ${isHovered ? 'scale-110 rotate-3' : ''}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full transition-all duration-300 ${isHovered ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <ArrowUpRight className="w-3 h-3" />
                        Voir
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                      <p className={`text-2xl font-black text-gray-900 mt-0.5 transition-all duration-300 ${isHovered ? 'translate-x-1' : ''}`}>
                        {stat.value}
                      </p>
                    </div>

                    {/* Barre de progression décorative */}
                    <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full transition-all duration-1000 ease-out ${mounted ? 'w-full' : 'w-0'}`}
                        style={{ transitionDelay: `${600 + index * 200}ms` }}
                      />
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* ═══ ACTIONS RAPIDES ═══ */}
        <div className={`transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card className="border border-gray-100 shadow-sm">
            <Card.Header className="border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <Card.Title className="text-lg font-bold">Actions rapides</Card.Title>
              </div>
            </Card.Header>
            <Card.Body className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => navigate(action.link)}
                      className={`group relative p-5 rounded-2xl border border-gray-100 ${action.bg} ${action.hoverBg} 
                        transition-all duration-300 text-left overflow-hidden
                        hover:shadow-lg hover:shadow-${action.color}-500/10 hover:scale-[1.02] hover:border-transparent`}
                      style={{ transitionDelay: `${index * 50}ms` }}
                    >
                      {/* Halo au hover */}
                      <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${action.gradient} rounded-full blur-2xl opacity-0 group-hover:opacity-15 transition-opacity duration-500`} />

                      <div className="relative z-10">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <p className={`font-bold ${action.text} text-sm mb-1`}>{action.label}</p>
                        <p className={`text-xs ${action.subtext} opacity-75 leading-relaxed`}>{action.desc}</p>

                        <div className="mt-3 flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                          <span className={action.text}>Accéder</span>
                          <ChevronRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* ═══ FOOTER INFO ═══ */}
        <div className={`mt-8 flex items-center justify-between text-xs text-gray-400 transition-all duration-700 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <p>Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-500" />
            Système opérationnel
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </Layout> 
  );
};

export default SuperAdminDashboard