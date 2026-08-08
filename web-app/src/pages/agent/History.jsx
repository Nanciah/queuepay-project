import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    Calendar,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    XCircle,
    Clock,
    User,
    Phone,
    Eye,
    Download,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { agent } from '../../services/api';
import toast from 'react-hot-toast';

const History = () => {
    const navigate = useNavigate();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDate, setFilterDate] = useState('all');
    const [expandedId, setExpandedId] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    // Statistiques
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        cancelled: 0,
        called: 0
    });

    // Charger l'historique
    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await agent.getHistory({
                page: pagination.page,
                limit: pagination.limit,
                status: filterStatus !== 'all' ? filterStatus : undefined
            });

            const data = response.data;
            setTickets(data.tickets || []);
            setPagination(prev => ({
                ...prev,
                total: data.total || 0,
                totalPages: data.totalPages || 0
            }));

            // Calculer les statistiques
            const allTickets = data.tickets || [];
            setStats({
                total: allTickets.length,
                completed: allTickets.filter(t => t.status === 'completed').length,
                cancelled: allTickets.filter(t => t.status === 'cancelled').length,
                called: allTickets.filter(t => t.status === 'called').length
            });
        } catch (error) {
            console.error('Erreur chargement historique:', error);
            toast.error('Erreur lors du chargement de l\'historique');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [pagination.page, filterStatus]);

    // Filtrer côté client (recherche)
    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = 
            ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtre date (simple)
        let matchesDate = true;
        if (filterDate === 'today') {
            const today = new Date().toDateString();
            matchesDate = new Date(ticket.created_at).toDateString() === today;
        } else if (filterDate === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            matchesDate = new Date(ticket.created_at) >= weekAgo;
        } else if (filterDate === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            matchesDate = new Date(ticket.created_at) >= monthAgo;
        }
        
        return matchesSearch && matchesDate;
    });

    // Obtenir le badge de statut
    const getStatusBadge = (status) => {
        const config = {
            completed: { 
                color: 'bg-green-100 text-green-700', 
                icon: CheckCircle,
                label: 'Complété'
            },
            cancelled: { 
                color: 'bg-red-100 text-red-700', 
                icon: XCircle,
                label: 'Annulé'
            },
            called: { 
                color: 'bg-blue-100 text-blue-700', 
                icon: Clock,
                label: 'Appelé'
            },
            waiting: {
                color: 'bg-yellow-100 text-yellow-700',
                icon: Clock,
                label: 'En attente'
            },
            pending: {
                color: 'bg-gray-100 text-gray-700',
                icon: Clock,
                label: 'En file'
            }
        };
        const c = config[status] || config.pending;
        const Icon = c.icon;
        return (
            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>
                <Icon className="w-3 h-3" />
                {c.label}
            </span>
        );
    };

    // Formater la date
    const formatDate = (date) => {
        if (!date) return '---';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Changer de page
    const goToPage = (page) => {
        if (page < 1 || page > pagination.totalPages) return;
        setPagination(prev => ({ ...prev, page }));
    };

    // Rafraîchir
    const handleRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    // Exporter (si disponible)
  const handleExport = async () => {
    try {
        toast.loading('Export en cours...', { id: 'export' });
        
        const response = await agent.exportHistory({
            status: filterStatus !== 'all' ? filterStatus : undefined,
            date: filterDate !== 'all' ? filterDate : undefined,
            search: searchTerm || undefined
        });

        // Créer un blob et télécharger
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `historique_agent_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Export réussi !', { id: 'export' });
    } catch (error) {
        console.error('Erreur export:', error);
        toast.error('Erreur lors de l\'export', { id: 'export' });
    }
};

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Historique</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Historique des tickets traités
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Actualiser
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Exporter
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-4 text-center border border-gray-100">
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-sm text-gray-500">Total</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 text-center border border-green-100">
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                    <p className="text-sm text-gray-500">Complétés</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 text-center border border-blue-100">
                    <p className="text-2xl font-bold text-blue-600">{stats.called}</p>
                    <p className="text-sm text-gray-500">Appelés</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 text-center border border-red-100">
                    <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                    <p className="text-sm text-gray-500">Annulés</p>
                </div>
            </div>

            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un ticket ou un client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="completed">Complétés</option>
                        <option value="called">Appelés</option>
                        <option value="cancelled">Annulés</option>
                        <option value="waiting">En attente</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <select
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    >
                        <option value="all">Toutes les dates</option>
                        <option value="today">Aujourd'hui</option>
                        <option value="week">Cette semaine</option>
                        <option value="month">Ce mois</option>
                    </select>
                </div>
            </div>

            {/* Liste des tickets */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {filteredTickets.length === 0 ? (
                    <div className="p-12 text-center">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Aucun ticket trouvé</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Ajustez vos filtres ou revenez plus tard
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredTickets.map((ticket) => (
                            <div key={ticket.id} className="p-4 hover:bg-gray-50 transition-colors">
                                {/* Ligne principale */}
                                <div 
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                                >
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <span className="font-bold text-indigo-600 text-lg">
                                            {ticket.ticket_number}
                                        </span>
                                        {getStatusBadge(ticket.status)}
                                        <span className="text-sm text-gray-500 hidden sm:inline">
                                            {ticket.user?.first_name || 'Client'} {ticket.user?.last_name || ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-400 hidden md:inline">
                                            {formatDate(ticket.created_at)}
                                        </span>
                                        {expandedId === ticket.id ? (
                                            <ChevronUp className="w-4 h-4 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Détails expansés */}
                                {expandedId === ticket.id && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">Client</p>
                                            <p className="font-medium mt-1">
                                                {ticket.user?.first_name || 'Client'} {ticket.user?.last_name || ''}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">Téléphone</p>
                                            <p className="font-medium mt-1">{ticket.user?.phone || '---'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">Service</p>
                                            <p className="font-medium mt-1">{ticket.service_name || '---'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">Temps d'attente</p>
                                            <p className="font-medium mt-1">{ticket.estimated_wait_time || 0} min</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">Créé le</p>
                                            <p className="font-medium mt-1">{formatDate(ticket.created_at)}</p>
                                        </div>
                                        {ticket.completed_at && (
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase tracking-wider">Complété le</p>
                                                <p className="font-medium mt-1 text-green-600">
                                                    {formatDate(ticket.completed_at)}
                                                </p>
                                            </div>
                                        )}
                                        {ticket.cancelled_at && (
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase tracking-wider">Annulé le</p>
                                                <p className="font-medium mt-1 text-red-600">
                                                    {formatDate(ticket.cancelled_at)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        {pagination.total} ticket{pagination.total > 1 ? 's' : ''}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => goToPage(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Précédent
                        </button>
                        <span className="flex items-center px-4 py-2 text-sm font-medium text-gray-700">
                            Page {pagination.page} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => goToPage(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;