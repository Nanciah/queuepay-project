import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ClipboardList, 
  UserCog, 
  Ticket, 
  TrendingUp, 
  Users, 
  Clock,
  Plus,
  BarChart3,
  DollarSign,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import { companyAdmin } from '../../services/api';

const CompanyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalServices: 0,
    totalAgents: 0,
    totalTickets: 0,
    totalRevenue: 0,
    activeQueues: 0,
    todayTickets: 0,
    averageWaitTime: 0
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const statsResponse = await companyAdmin.getStats();
      setStats(statsResponse.data);
      
      if (user?.companyId) {
        setCompanyName('Mon Entreprise');
      }
      
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  const statCards = [
    {
      icon: ClipboardList,
      label: 'Services',
      value: stats.totalServices || 0,
      color: 'bg-blue-100 text-blue-600',
      link: '/company-admin/services'
    },
    {
      icon: UserCog,
      label: 'Agents',
      value: stats.totalAgents || 0,
      color: 'bg-green-100 text-green-600',
      link: '/company-admin/agents'
    },
    {
      icon: Ticket,
      label: 'Tickets aujourd\'hui',
      value: stats.todayTickets || 0,
      color: 'bg-purple-100 text-purple-600',
      link: '/company-admin/queues'
    },
    {
      icon: DollarSign,
      label: 'Revenus (Ar)',
      value: (stats.totalRevenue || 0).toLocaleString(),
      color: 'bg-yellow-100 text-yellow-600',
      link: '/company-admin/stats'
    }
  ];

  const quickActions = [
    {
      icon: Plus,
      label: 'Nouveau service',
      description: 'Ajouter un service à votre entreprise',
      color: 'bg-indigo-50 text-indigo-700',
      link: '/company-admin/services/create'
    },
    {
      icon: UserCog,
      label: 'Nouvel agent',
      description: 'Ajouter un agent de guichet',
      color: 'bg-green-50 text-green-700',
      link: '/company-admin/agents/create'
    },
    {
      icon: BarChart3,
      label: 'Voir les statistiques',
      description: 'Analyser la performance',
      color: 'bg-purple-50 text-purple-700',
      link: '/company-admin/stats'
    },
    {
      icon: Clock,
      label: 'Files d\'attente',
      description: 'Gérer les files en cours',
      color: 'bg-orange-50 text-orange-700',
      link: '/company-admin/queues'
    }
  ];

  return (
    <Layout title="Tableau de bord">
      {/* Header avec bienvenue */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenue {user?.firstName || 'Admin'}!
            </h1>
            <p className="text-gray-500 mt-1">
              {companyName || 'Votre entreprise'} - Gérez vos services et agents
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm">
              <Activity className="w-4 h-4 text-green-500" />
              <span>Tout est opérationnel</span>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/company-admin/services/create')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouveau service
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(stat.link)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Actions rapides */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(action.link)}
                className={`p-4 rounded-xl text-left transition hover:shadow-md ${action.color}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg bg-white/50`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{action.label}</span>
                </div>
                <p className="text-sm opacity-75">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets récents */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Tickets récents</Card.Title>
              <button
                onClick={() => navigate('/company-admin/queues')}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Voir tout
              </button>
            </div>
          </Card.Header>
          <Card.Body>
            {recentTickets.length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun ticket récent</p>
                <p className="text-sm text-gray-400">Les tickets apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTickets.slice(0, 5).map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{ticket.ticket_number}</p>
                      <p className="text-sm text-gray-500">{ticket.service_name}</p>
                    </div>
                    <Badge variant={ticket.status === 'completed' ? 'success' : 'warning'}>
                      {ticket.status === 'completed' ? 'Terminé' : 'En cours'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Statistiques rapides */}
        <Card>
          <Card.Header>
            <Card.Title>Statistiques rapides</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Services actifs</span>
                <span className="font-semibold text-gray-900">{stats.totalServices || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Agents en service</span>
                <span className="font-semibold text-gray-900">{stats.totalAgents || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Files actives</span>
                <span className="font-semibold text-gray-900">{stats.activeQueues || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Temps d'attente moyen</span>
                <span className="font-semibold text-gray-900">{stats.averageWaitTime || 0} min</span>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Layout>
  );
};

export default CompanyDashboard;
