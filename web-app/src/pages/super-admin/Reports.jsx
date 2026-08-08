import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Calendar, TrendingUp, Users, Building2, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { superAdmin } from '../../services/api';

const Reports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await superAdmin.getStats();
      setStats(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

const handleExport = async (type) => {
    try {
        toast.loading(`Export ${type} en cours...`, { id: 'export' });
        
        const response = await superAdmin.exportReport({ 
            type: type,
            format: 'csv'
        });
        
        // Créer un blob et télécharger
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `rapport_${type}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        
        toast.success(`Export ${type} terminé avec succès !`, { id: 'export' });
    } catch (error) {
        console.error('Erreur export:', error);
        toast.error(`Erreur lors de l'export ${type}`, { id: 'export' });
    }
};

  if (loading) return <Loading />;

  return (
    <Layout title="Rapports">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rapports et analyses</h1>
        <p className="text-gray-500 mt-1">Exportez et analysez les données de la plateforme</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
            <p className="text-sm text-gray-500">Utilisateurs</p>
            <button
              onClick={() => handleExport('utilisateurs')}
              className="mt-3 px-4 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
            >
              <Download className="w-4 h-4 inline mr-1" />
              Exporter
            </button>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <Building2 className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats?.totalCompanies || 0}</p>
            <p className="text-sm text-gray-500">Entreprises</p>
            <button
              onClick={() => handleExport('entreprises')}
              className="mt-3 px-4 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
            >
              <Download className="w-4 h-4 inline mr-1" />
              Exporter
            </button>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats?.totalTickets || 0}</p>
            <p className="text-sm text-gray-500">Tickets</p>
            <button
              onClick={() => handleExport('tickets')}
              className="mt-3 px-4 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition"
            >
              <Download className="w-4 h-4 inline mr-1" />
              Exporter
            </button>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats?.totalRevenue?.toLocaleString() || 0} Ar</p>
            <p className="text-sm text-gray-500">Revenus</p>
            <button
              onClick={() => handleExport('revenus')}
              className="mt-3 px-4 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
            >
              <Download className="w-4 h-4 inline mr-1" />
              Exporter
            </button>
          </div>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Rapports disponibles</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">Rapport des entreprises</p>
                  <p className="text-sm text-gray-500">Liste complète des entreprises</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => handleExport('entreprises')}>
                <Download className="w-4 h-4" />
                Exporter
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">Rapport des tickets</p>
                  <p className="text-sm text-gray-500">Analyse des tickets par période</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => handleExport('tickets')}>
                <Download className="w-4 h-4" />
                Exporter
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">Rapport d'activité</p>
                  <p className="text-sm text-gray-500">Activité par jour/semaine/mois</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => handleExport('activite')}>
                <Download className="w-4 h-4" />
                Exporter
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Layout>
  );
};

export default Reports;