import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Building2, Edit, Trash2, Eye, Wifi, WifiOff, MapPin, Mail, Phone, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import Badge from '../../components/common/Badge';
import { superAdmin } from '../../services/api';
import Layout from '../../components/layout/Layout';
import { useSocket } from '../../context/SocketContext';

const Companies = () => {
  const navigate = useNavigate();
  const { socket, isConnected, on, off } = useSocket();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [mounted, setMounted] = useState(false);
  const [hoveredCompany, setHoveredCompany] = useState(null);

  console.log('🔵 [COMPANIES] Composant rendu, isConnected:', isConnected);
  console.log('🔵 [COMPANIES] socket:', socket ? 'OK' : 'NULL');

  useEffect(() => {
    setMounted(true);
    console.log('🔄 [COMPANIES] fetchCompanies appelé');
    fetchCompanies();
  }, []);

  // ✅ ÉCOUTER LES ÉVÉNEMENTS WEBSOCKET
  useEffect(() => {
    console.log('🔄 [COMPANIES] useEffect WebSocket - isConnected:', isConnected);
    console.log('🔄 [COMPANIES] socket:', socket ? 'OK' : 'NULL');
    console.log('🔄 [COMPANIES] on function:', typeof on);
    console.log('🔄 [COMPANIES] off function:', typeof off);

    if (!isConnected || !socket) {
      console.log('⚠️ [COMPANIES] Socket non connecté - pas d\'écoute');
      return;
    }

    console.log('📡 [COMPANIES] Écoute des événements entreprises...');

    const onCompanyCreated = (data) => {
      console.log('📢 [COMPANIES] Événement company-created reçu !', data);
      console.log('📢 [COMPANIES] Nouvelle entreprise:', data.company);
      setCompanies(prev => {
        console.log('📢 [COMPANIES] Avant mise à jour:', prev.length);
        const newList = [data.company, ...prev];
        console.log('📢 [COMPANIES] Après mise à jour:', newList.length);
        return newList;
      });
      toast.success(`🏢 Entreprise "${data.company.name}" créée !`);
    };

    const onCompanyUpdated = (data) => {
      console.log('📢 [COMPANIES] Événement company-updated reçu !', data);
      console.log('📢 [COMPANIES] Entreprise mise à jour:', data.company);
      setCompanies(prev => {
        console.log('📢 [COMPANIES] Avant mise à jour:', prev.length);
        const newList = prev.map(c => 
          c.id === data.company.id ? data.company : c
        );
        console.log('📢 [COMPANIES] Après mise à jour:', newList.length);
        return newList;
      });
      toast.success(`🏢 Entreprise "${data.company.name}" mise à jour !`);
    };

    const onCompanyDeleted = (data) => {
      console.log('📢 [COMPANIES] Événement company-deleted reçu !', data);
      console.log('📢 [COMPANIES] Entreprise supprimée:', data.companyName);
      setCompanies(prev => {
        console.log('📢 [COMPANIES] Avant suppression:', prev.length);
        const newList = prev.filter(c => c.id !== data.companyId);
        console.log('📢 [COMPANIES] Après suppression:', newList.length);
        return newList;
      });
      toast.error(`🏢 Entreprise "${data.companyName}" supprimée`);
    };

    console.log('📡 [COMPANIES] Enregistrement des écouteurs...');
    on('company-created', onCompanyCreated);
    on('company-updated', onCompanyUpdated);
    on('company-deleted', onCompanyDeleted);
    console.log('✅ [COMPANIES] Écouteurs enregistrés');

    return () => {
      console.log('📡 [COMPANIES] Nettoyage des écouteurs...');
      off('company-created', onCompanyCreated);
      off('company-updated', onCompanyUpdated);
      off('company-deleted', onCompanyDeleted);
      console.log('✅ [COMPANIES] Écouteurs nettoyés');
    };
  }, [isConnected, socket, on, off]);

  const fetchCompanies = async () => {
    try {
      console.log('🔄 [COMPANIES] fetchCompanies - appel API');
      const response = await superAdmin.getCompanies();
      console.log('📦 [COMPANIES] Réponse reçue:', response.data.companies?.length || 0, 'entreprises');
      setCompanies(response.data.companies || []);
    } catch (error) {
      console.error('❌ [COMPANIES] Erreur fetchCompanies:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette entreprise ?')) return;

    try {
      console.log('🗑️ [COMPANIES] Suppression de l\'entreprise:', id);
      await superAdmin.deleteCompany(id);
      toast.success('Entreprise supprimée');
      fetchCompanies();
    } catch (error) {
      console.error('❌ [COMPANIES] Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchSearch = company.name.toLowerCase().includes(search.toLowerCase()) ||
                        company.city?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || company.status === filter;
    return matchSearch && matchFilter;
  });

  const statusConfig = {
    active:    { label: 'Actif',     gradient: 'from-emerald-400 to-teal-500',     bg: 'bg-emerald-50',     text: 'text-emerald-700',     dot: 'bg-emerald-500',     border: 'border-emerald-200' },
    pending:   { label: 'En attente', gradient: 'from-amber-400 to-orange-500',    bg: 'bg-amber-50',      text: 'text-amber-700',      dot: 'bg-amber-500',      border: 'border-amber-200' },
    suspended: { label: 'Suspendu',   gradient: 'from-red-400 to-rose-500',        bg: 'bg-red-50',        text: 'text-red-700',        dot: 'bg-red-500',        border: 'border-red-200' },
  };

  const filterTabs = [
    { key: 'all',       label: 'Tous',       count: companies.length },
    { key: 'active',    label: 'Actifs',     count: companies.filter(c => c.status === 'active').length },
    { key: 'pending',   label: 'En attente', count: companies.filter(c => c.status === 'pending').length },
    { key: 'suspended', label: 'Suspendus',  count: companies.filter(c => c.status === 'suspended').length },
  ];

  if (loading) return <Loading />;

  return (
    <Layout title="Entreprises">
      <div className="max-w-7xl mx-auto">

        {/* ═══ HEADER ═══ */}
        <div className={`flex flex-wrap justify-between items-end mb-8 gap-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-full">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-600">Gestion</span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors duration-300 ${isConnected ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                {isConnected ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-600">Temps réel</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs font-semibold text-red-600">Hors ligne</span>
                  </>
                )}
              </div>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Entreprises</h1>
            <p className="text-gray-500 mt-1 text-sm">
              <span className="font-bold text-gray-700">{companies.length}</span> entreprise{companies.length > 1 ? 's' : ''} enregistrée{companies.length > 1 ? 's' : ''} sur la plateforme
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/super-admin/companies/create')}
            className="group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 flex items-center gap-2">
              <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
              Nouvelle entreprise
            </span>
          </Button>
        </div>

        {/* ═══ BARRE DE RECHERCHE + FILTRES ═══ */}
        <div className={`mb-6 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card className="border border-gray-100 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Recherche */}
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher une entreprise par nom ou ville..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 
                    focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-300 hover:bg-white"
                />
              </div>

              {/* Filtres */}
              <div className="flex gap-2 flex-wrap">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`relative px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 overflow-hidden
                      ${filter === tab.key 
                        ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-105' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                      }`}
                  >
                    <span className="relative z-10 flex items-center gap-1.5">
                      {tab.label}
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${filter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {tab.count}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* ═══ LISTE DES ENTREPRISES ═══ */}
        {filteredCompanies.length === 0 ? (
          <div className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Card className="text-center py-16 border border-dashed border-gray-200">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                <Building2 className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {search || filter !== 'all' ? 'Aucun résultat' : 'Aucune entreprise'}
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                {search || filter !== 'all' 
                  ? 'Essayez de modifier vos critères de recherche ou de filtre.' 
                  : 'Commencez par créer votre première entreprise sur la plateforme.'}
              </p>
              <Button
                variant="primary"
                onClick={() => search || filter !== 'all' ? (setSearch(''), setFilter('all')) : navigate('/super-admin/companies/create')}
                className="mx-auto"
              >
                <Plus className="w-5 h-5" />
                {search || filter !== 'all' ? 'Réinitialiser les filtres' : 'Créer une entreprise'}
              </Button>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCompanies.map((company, index) => {
              const status = statusConfig[company.status] || statusConfig.pending;
              const isHovered = hoveredCompany === company.id;

              return (
                <div
                  key={company.id}
                  className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  style={{ transitionDelay: `${index * 75}ms` }}
                  onMouseEnter={() => setHoveredCompany(company.id)}
                  onMouseLeave={() => setHoveredCompany(null)}
                >
                  <Card className={`relative overflow-hidden transition-all duration-300 border border-gray-100 
                    ${isHovered ? 'shadow-xl shadow-gray-900/5 scale-[1.02] border-indigo-200' : 'shadow-sm hover:shadow-md'}`}
                  >
                    {/* Bandeau de statut en haut */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${status.gradient}`} />

                    <div className="pt-5 px-5 pb-5">
                      {/* Header card */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${isHovered ? 'scale-110 rotate-3' : ''} ${status.bg}`}>
                            {company.logo ? (
                              <img src={company.logo} alt={company.name} className="w-8 h-8 object-contain rounded-lg" />
                            ) : (
                              <Building2 className="w-6 h-6 text-gray-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 truncate text-sm">{company.name}</h3>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <p className="text-xs text-gray-500 truncate">{company.city || 'Ville non spécifiée'}</p>
                            </div>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.bg} ${status.text} border ${status.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${company.status === 'active' ? 'animate-pulse' : ''}`} />
                          {status.label}
                        </div>
                      </div>

                      {/* Métadonnées */}
                      <div className="space-y-2 mb-4">
                        {company.email && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 group/info">
                            <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center group-hover/info:bg-indigo-50 transition-colors">
                              <Mail className="w-3 h-3 text-gray-400 group-hover/info:text-indigo-500 transition-colors" />
                            </div>
                            <span className="truncate">{company.email}</span>
                          </div>
                        )}
                        {company.phone && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 group/info">
                            <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center group-hover/info:bg-indigo-50 transition-colors">
                              <Phone className="w-3 h-3 text-gray-400 group-hover/info:text-indigo-500 transition-colors" />
                            </div>
                            <span>{company.phone}</span>
                          </div>
                        )}
                        {company.admins && company.admins.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 group/info">
                            <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center group-hover/info:bg-indigo-50 transition-colors">
                              <User className="w-3 h-3 text-gray-400 group-hover/info:text-indigo-500 transition-colors" />
                            </div>
                            <span>{company.admins[0].firstName} {company.admins[0].lastName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-400 group/info">
                          <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center">
                            <Calendar className="w-3 h-3 text-gray-400" />
                          </div>
                          <span>{new Date(company.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => navigate(`/super-admin/companies/${company.id}`)}
                          className="flex-1 px-3 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all duration-300 flex items-center justify-center gap-1.5 group/btn"
                        >
                          <Eye className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:scale-110" />
                          Voir
                        </button>
                        <button
                          onClick={() => navigate(`/super-admin/companies/${company.id}/edit`)}
                          className="px-3 py-2 text-xs font-bold text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-all duration-300 flex items-center justify-center group/btn"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:scale-110" />
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
                          className="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-300 flex items-center justify-center group/btn"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:scale-110" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ FOOTER INFO ═══ */}
        {filteredCompanies.length > 0 && (
          <div className={`mt-8 flex items-center justify-between text-xs text-gray-400 transition-all duration-700 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <p>Affichage de <span className="font-bold text-gray-600">{filteredCompanies.length}</span> sur <span className="font-bold text-gray-600">{companies.length}</span> entreprise{companies.length > 1 ? 's' : ''}</p>
            <p className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              {isConnected ? 'Synchronisation temps réel active' : 'Mode hors ligne'}
            </p>
          </div>
        )}
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

export default Companies;