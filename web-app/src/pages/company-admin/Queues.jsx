import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, Ticket, RefreshCw, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import { companyAdmin } from '../../services/api';

const Queues = () => {
  const navigate = useNavigate();
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueues();
  }, []);

  const fetchQueues = async () => {
    try {
      setLoading(true);
      // 🔥 Utiliser la route avec les vraies statistiques
      const response = await companyAdmin.getServicesWithStats();
      setQueues(response.data.services || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des files');
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (waitingCount) => {
    if (waitingCount === 0) return 'success';
    if (waitingCount < 5) return 'warning';
    return 'danger';
  };

  const getStatusLabel = (waitingCount) => {
    if (waitingCount === 0) return 'Vide';
    if (waitingCount < 5) return 'Modérée';
    return 'Saturée';
  };

  // 🔥 Calculer la saturation
  const getSaturation = (waitingCount, capacity) => {
    if (!capacity || capacity === 0) return 0;
    return Math.round((waitingCount / capacity) * 100);
  };

  const getSaturationColor = (saturation) => {
    if (saturation === 0) return 'bg-gray-200';
    if (saturation < 30) return 'bg-green-500';
    if (saturation < 60) return 'bg-yellow-500';
    if (saturation < 85) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getSaturationLabel = (saturation) => {
    if (saturation === 0) return 'Vide';
    if (saturation < 30) return 'Faible';
    if (saturation < 60) return 'Modérée';
    if (saturation < 85) return 'Élevée';
    return 'Saturée';
  };

  if (loading) return <Loading />;

  return (
    <Layout title="Files d'attente">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Files d'attente</h1>
          <p className="text-gray-500 mt-1">
            {queues.length} file{queues.length > 1 ? 's' : ''} d'attente active{queues.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="secondary" onClick={fetchQueues}>
          <RefreshCw className="w-5 h-5" />
          Rafraîchir
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {queues.map((queue) => {
          const saturation = getSaturation(queue.waitingCount || 0, queue.max_capacity || 50);
          
          return (
            <Card key={queue.id} hover>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{queue.name}</h3>
                  <p className="text-sm text-gray-500">{queue.category || 'Non catégorisé'}</p>
                </div>
                <Badge variant={queue.is_active ? 'success' : 'danger'}>
                  {queue.is_active ? '🟢 Active' : '🔴 Fermée'}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Users className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm text-gray-500">En attente</p>
                  <p className="text-xl font-bold text-gray-900">{queue.waitingCount || 0}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Ticket className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm text-gray-500">Aujourd'hui</p>
                  <p className="text-xl font-bold text-gray-900">{queue.todayTickets || 0}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm text-gray-500">Attente moyenne</p>
                  <p className="text-xl font-bold text-gray-900">{queue.avgWaitTime || 0} min</p>
                </div>
              </div>

              {/* 🔥 Barre de saturation */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Saturation</span>
                  <span className={saturation > 85 ? 'text-red-500 font-medium' : ''}>
                    {getSaturationLabel(saturation)} ({saturation}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getSaturationColor(saturation)}`}
                    style={{ width: `${Math.min(saturation, 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => navigate(`/agent/queue/${queue.id}`)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition"
                >
                  <span className="font-medium">Gérer la file</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {queues.length === 0 && (
        <Card className="text-center py-12">
          <div className="flex flex-col items-center">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Aucune file d'attente</h3>
            <p className="text-gray-500 mt-1">Créez un service pour commencer</p>
            <Button variant="primary" onClick={() => navigate('/company-admin/services/create')} className="mt-4">
              Créer un service
            </Button>
          </div>
        </Card>
      )}
    </Layout>
  );
};

export default Queues;