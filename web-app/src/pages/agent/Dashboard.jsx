import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { 
    Users, 
    Clock, 
    CheckCircle, 
    TrendingUp,
    AlertCircle,
    ChevronRight,
    RefreshCw,
    Bell,
    Award,
    User,
    Phone,
    Calendar,
    ArrowRight
} from 'lucide-react';
import { companyAdmin } from '../../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { isConnected } = useSocket();

    const [stats, setStats] = useState({
        todayTickets: 0,
        waitingTickets: 0,
        completedToday: 0,
        averageWaitTime: 0,
        totalServed: 0
    });
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [recentActivity, setRecentActivity] = useState([]);

    const fetchData = async () => {
        try {
           const [statsRes, servicesRes, activityRes] = await Promise.all([
                companyAdmin.getAgentStats(),
                companyAdmin.getAgentServices(),
                companyAdmin.getAgentRecentActivity()
            ]);
            setStats(statsRes.data || {});
            setServices(servicesRes.data || []);
            setRecentActivity(activityRes.data || []);
        } catch (error) {
            console.error('Erreur chargement dashboard:', error);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const statCards = [
        { 
            label: 'Aujourd\'hui', 
            value: stats.todayTickets || 0, 
            icon: Users, 
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100'
        },
        { 
            label: 'En attente', 
            value: stats.waitingTickets || 0, 
            icon: Clock, 
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
            border: 'border-yellow-100'
        },
        { 
            label: 'Servis aujourd\'hui', 
            value: stats.completedToday || 0, 
            icon: CheckCircle, 
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-100'
        },
        { 
            label: 'Temps moyen', 
            value: `${stats.averageWaitTime || 0} min`, 
            icon: TrendingUp, 
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            border: 'border-purple-100'
        },
        { 
            label: 'Total servis', 
            value: stats.totalServed || 0, 
            icon: Award, 
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            border: 'border-orange-100'
        },
    ];

    const getStatusColor = (status) => {
        const colors = {
            waiting: 'bg-yellow-100 text-yellow-700',
            called: 'bg-blue-100 text-blue-700',
            completed: 'bg-green-100 text-green-700',
            cancelled: 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getStatusLabel = (status) => {
        const labels = {
            waiting: 'En attente',
            called: 'Appelé',
            completed: 'Complété',
            cancelled: 'Annulé'
        };
        return labels[status] || status;
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
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Bonjour {user?.first_name || 'Agent'} 👋
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Voici votre tableau de bord agent
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-sm text-gray-600">
                            {isConnected ? 'En ligne' : 'Hors ligne'}
                        </span>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Actualiser
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div 
                            key={index} 
                            className={`bg-white rounded-lg shadow-sm p-4 border ${stat.border} hover:shadow-md transition-shadow`}
                        >
                            <div className="flex items-center justify-between">
                                <div className={`p-2 rounded-lg ${stat.bg}`}>
                                    <Icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                <span className="text-2xl font-bold text-gray-900">
                                    {stat.value}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">{stat.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Services assignés */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            Mes services assignés
                        </h2>
                    </div>
                    <span className="text-sm text-gray-500">
                        {services.length} service{services.length > 1 ? 's' : ''}
                    </span>
                </div>
                <div className="divide-y divide-gray-100">
                    {services.length === 0 ? (
                        <div className="p-8 text-center">
                            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">Aucun service assigné</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Contactez votre administrateur pour être assigné à un service
                            </p>
                        </div>
                    ) : (
                        services.map((service) => (
                            <div
                                key={service.id}
                                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                                onClick={() => navigate('/agent/queue', { 
                                    state: { serviceId: service.id, serviceName: service.name }
                                })}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                                        <Users className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                                            {service.name}
                                        </p>
                                        <div className="flex items-center gap-3 text-sm">
                                            <span className="text-gray-500">
                                                {service.waitingCount || 0} en attente
                                            </span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                            <span className={`${service.isActive ? 'text-green-500' : 'text-red-500'}`}>
                                                ● {service.isActive ? 'Actif' : 'Inactif'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                            {service.todayCount || 0}
                                        </p>
                                        <p className="text-xs text-gray-400">Aujourd'hui</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Activité récente */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            Activité récente
                        </h2>
                    </div>
                    <button 
                        onClick={() => navigate('/agent/history')}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                        Voir tout
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                    {recentActivity.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p>Aucune activité récente</p>
                        </div>
                    ) : (
                        recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        activity.status === 'completed' ? 'bg-green-100' :
                                        activity.status === 'called' ? 'bg-blue-100' :
                                        activity.status === 'cancelled' ? 'bg-red-100' :
                                        'bg-gray-100'
                                    }`}>
                                        {activity.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                                        {activity.status === 'called' && <Bell className="w-4 h-4 text-blue-600" />}
                                        {activity.status === 'cancelled' && <AlertCircle className="w-4 h-4 text-red-600" />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            Ticket {activity.ticket_number}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {activity.client_name || 'Client'} • {activity.service_name || 'Service'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activity.status)}`}>
                                        {getStatusLabel(activity.status)}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(activity.created_at).toLocaleTimeString('fr-FR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                    onClick={() => {
                        if (services.length > 0) {
                            navigate('/agent/queue', { 
                                state: { serviceId: services[0].id, serviceName: services[0].name }
                            });
                        } else {
                            toast.error('Aucun service assigné');
                        }
                    }}
                    className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors text-center"
                >
                    <Users className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-indigo-700">Gérer la file</p>
                </button>
                <button
                    onClick={() => navigate('/agent/history')}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-center"
                >
                    <Clock className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">Historique</p>
                </button>
                <button
                    onClick={() => navigate('/agent/profile')}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-center"
                >
                    <User className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">Mon profil</p>
                </button>
                <button
    onClick={() => navigate('/agent/support')}
    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-center"
>
    <Phone className="w-6 h-6 text-gray-600 mx-auto mb-2" />
    <p className="text-sm font-medium text-gray-700">Support</p>
</button>
            </div>
        </div>
    );
};

export default Dashboard;