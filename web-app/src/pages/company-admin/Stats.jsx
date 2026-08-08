import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  Calendar,
  Ticket,
  Activity,
  PieChart,
  ArrowUp,
  ArrowDown,
  UserCog
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Badge from '../../components/common/Badge';
import { companyAdmin } from '../../services/api';

const Stats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await companyAdmin.getAdvancedStats({ period });
      setStats(response.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const getMaxValue = (data) => {
    if (!data || data.length === 0) return 0;
    return Math.max(...data.map(item => item.count || 0));
  };

  if (loading) return <Loading />;

  const statCards = [
    {
      icon: Ticket,
      label: 'Tickets',
      value: stats?.totalTickets || 0,
      color: 'bg-blue-100 text-blue-600',
      change: '+12%',
      up: true,
    },
    {
      icon: DollarSign,
      label: 'Revenus (Ar)',
      value: (stats?.totalRevenue || 0).toLocaleString(),
      color: 'bg-green-100 text-green-600',
      change: '+8%',
      up: true,
    },
    {
      icon: Users,
      label: 'Agents actifs',
      value: stats?.agents?.length || 0,
      color: 'bg-purple-100 text-purple-600',
      change: '+5%',
      up: true,
    },
    {
      icon: BarChart3,
      label: 'Services',
      value: stats?.serviceDistribution?.length || 0,
      color: 'bg-orange-100 text-orange-600',
      change: '0%',
      up: true,
    },
  ];

  return (
    <Layout title="Statistiques avancées">
      <div className="mb-6">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Statistiques avancées</h1>
            <p className="text-gray-500 mt-1">Analyse détaillée des performances</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="success">📊 Mise à jour en direct</Badge>
            <button
              onClick={() => fetchStats()}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Rafraîchir
            </button>
          </div>
        </div>
      </div>

      {/* Filtre de période */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['day', 'week', 'month', 'year'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              period === p
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
          </button>
        ))}
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                {stat.change && (
                  <div className={`flex items-center gap-1 text-sm ${stat.up ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.up ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    {stat.change}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Évolution des tickets */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Évolution des tickets</Card.Title>
              <span className="text-xs text-gray-400">
                {period === 'day' ? 'Par heure' : period === 'week' ? 'Par jour' : period === 'month' ? 'Par jour' : 'Par mois'}
              </span>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="h-64">
              {stats?.chartData && stats.chartData.length > 0 ? (
                <div className="flex items-end h-full gap-1">
                  {stats.chartData.map((item, index) => {
                    const max = getMaxValue(stats.chartData);
                    const height = max > 0 ? (item.count / max) * 100 : 0;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex flex-col items-center">
                          <div 
                            className="w-full bg-indigo-500 rounded-t transition-all duration-500 hover:bg-indigo-600"
                            style={{ height: `${Math.max(height * 0.8, 5)}px`, minHeight: '10px' }}
                          />
                          <span className="text-xs text-gray-500 mt-1">
                            {new Date(item.period).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Aucune donnée</p>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Répartition des services */}
        <Card>
          <Card.Header>
            <Card.Title>Répartition des services</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              {stats?.serviceDistribution && stats.serviceDistribution.length > 0 ? (
                stats.serviceDistribution.map((item, index) => {
                  const total = stats.serviceDistribution.reduce((sum, i) => sum + i.count, 0);
                  const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{item.name}</span>
                        <span className="text-gray-500">{item.count} tickets ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${colors[index % colors.length]}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-8">Aucune donnée</p>
              )}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Performance des agents */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>Performance des agents</Card.Title>
            <span className="text-xs text-gray-400">Tickets traités</span>
          </div>
        </Card.Header>
        <Card.Body>
          {stats?.agentPerformance && stats.agentPerformance.length > 0 ? (
            <div className="space-y-3">
              {stats.agentPerformance.map((agent, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <UserCog className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-medium text-gray-900">{agent.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{agent.count} tickets</span>
                    <Badge variant={agent.count > 10 ? 'success' : agent.count > 5 ? 'warning' : 'default'}>
                      {agent.count > 10 ? '🏆 Excellent' : agent.count > 5 ? '📈 Bon' : '📊 Moyen'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Aucune performance d'agent enregistrée</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </Layout>
  );
};

export default Stats;