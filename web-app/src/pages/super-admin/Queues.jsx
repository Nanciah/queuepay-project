import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, Users, Ticket, RefreshCw, ChevronRight, 
  Building2, AlertCircle, CheckCircle, XCircle, Eye  // ← AJOUTER Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import { superAdmin } from '../../services/api';

const Queues = () => {
  const navigate = useNavigate();
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchQueues();
  }, []);

  const fetchQueues = async () => {
    try {
      setLoading(true);
      // Utiliser la route API pour récupérer toutes les files
      const response = await superAdmin.getQueues();
      setQueues(response.data.queues || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des files');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      paused: 'warning',
      closed: 'danger'
    };
    const labels = {
      active: '🟢 Active',
      paused: '🟡 En pause',
      closed: '🔴 Fermée'
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const getSaturationLevel = (waiting, capacity) => {
    const ratio = waiting / (capacity || 50);
    if (ratio === 0) return { label: 'Vide', color: 'text-gray-400' };
    if (ratio < 0.3) return { label: 'Faible', color: 'text-green-500' };
    if (ratio < 0.6) return { label: 'Modérée', color: 'text-yellow-500' };
    if (ratio < 0.85) return { label: 'Élevée', color: 'text-orange-500' };
    return { label: 'Saturée', color: 'text-red-500' };
  };

  const filteredQueues = queues.filter(queue => {
    if (filter === 'all') return true;
    if (filter === 'active') return queue.status === 'active';
    if (filter === 'paused') return queue.status === 'paused';
    if (filter === 'closed') return queue.status === 'closed';
    if (filter === 'saturated') {
      const saturation = getSaturationLevel(queue.waiting || 0, queue.capacity || 50);
      return saturation.label === 'Saturée';
    }
    return true;
  });

  if (loading) return <Loading />;

  return (
    <Layout title="Files d'attente">
      <div className="mb-6">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Files d'attente</h1>
            <p className="text-gray-500 mt-1">
              {queues.length} file{queues.length > 1 ? 's' : ''} d'attente sur la plateforme
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={fetchQueues}>
              <RefreshCw className="w-4 h-4" />
              Rafraîchir
            </Button>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Toutes
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'active'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Actives
        </button>
        <button
          onClick={() => setFilter('paused')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'paused'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          En pause
        </button>
        <button
          onClick={() => setFilter('closed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'closed'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Fermées
        </button>
        <button
          onClick={() => setFilter('saturated')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'saturated'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ⚠️ Saturées
        </button>
      </div>

      {/* Liste des files */}
      {filteredQueues.length === 0 ? (
        <Card className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Aucune file d'attente</h3>
          <p className="text-gray-500 mt-1">Aucune file ne correspond à vos critères</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredQueues.map((queue) => {
            const saturation = getSaturationLevel(queue.waiting || 0, queue.capacity || 50);
            return (
              <Card key={queue.id} hover>
                {/* En-tête */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      queue.status === 'active' ? 'bg-green-100' :
                      queue.status === 'paused' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      <Clock className={`w-5 h-5 ${
                        queue.status === 'active' ? 'text-green-600' :
                        queue.status === 'paused' ? 'text-yellow-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{queue.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-500">{queue.company_name || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(queue.status)}
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm text-gray-500">En attente</p>
                    <p className="text-xl font-bold text-gray-900">{queue.waiting || 0}</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <Ticket className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm text-gray-500">Aujourd'hui</p>
                    <p className="text-xl font-bold text-gray-900">{queue.today || 0}</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm text-gray-500">Attente</p>
                    <p className="text-xl font-bold text-gray-900">{queue.avg_wait || 0} min</p>
                  </div>
                </div>

                {/* Saturation */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>Saturation</span>
                    <span className={saturation.color}>{saturation.label}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        saturation.label === 'Saturée' ? 'bg-red-500' :
                        saturation.label === 'Élevée' ? 'bg-orange-500' :
                        saturation.label === 'Modérée' ? 'bg-yellow-500' :
                        saturation.label === 'Faible' ? 'bg-green-500' :
                        'bg-gray-300'
                      }`}
                      style={{
                        width: `${Math.min(((queue.waiting || 0) / (queue.capacity || 50)) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/super-admin/queues/${queue.id}`)}
                    className="flex-1 px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                  >
                    <Eye className="w-4 h-4 inline mr-1" />
                    Voir les détails
                  </button>
                  <button
                    onClick={() => navigate(`/agent/queue/${queue.service_id}`)}
                    className="px-3 py-2 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default Queues;