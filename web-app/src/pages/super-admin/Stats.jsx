import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, TrendingUp, Users, Building2, DollarSign, Calendar, Ticket, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import { superAdmin } from '../../services/api';

const Stats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await superAdmin.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
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
      color: 'bg-indigo-100 text-indigo-600'
    },
    {
      icon: Users,
      label: 'Utilisateurs',
      value: stats?.totalUsers || 0,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Ticket,
      label: 'Tickets',
      value: stats?.totalTickets || 0,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: DollarSign,
      label: 'Revenus (Ar)',
      value: (stats?.totalRevenue || 0).toLocaleString(),
      color: 'bg-green-100 text-green-600'
    },
  ];

  return (
    <Layout title="Statistiques">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Statistiques globales</h1>
        <p className="text-gray-500 mt-1">Aperçu de l'activité de la plateforme</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Évolution des tickets</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="text-center">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Graphique à venir</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Répartition des utilisateurs</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Graphique à venir</p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Layout>
  );
};

export default Stats;