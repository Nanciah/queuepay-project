import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Clock, Users, Ticket, RefreshCw, 
  Building2, User, Calendar, ChevronRight, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import { superAdmin } from '../../services/api';

const QueueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState(null);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    fetchQueueDetails();
  }, [id]);

  const fetchQueueDetails = async () => {
    try {
      setLoading(true);
      // Récupérer les détails de la file
      const response = await superAdmin.getQueue(id);
      setQueue(response.data.queue);
      setTickets(response.data.tickets || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      waiting: 'warning',
      called: 'info',
      completed: 'success',
      cancelled: 'danger',
      pending: 'default'
    };
    const labels = {
      waiting: '⏳ En attente',
      called: '📢 Appelé',
      completed: '✅ Terminé',
      cancelled: '❌ Annulé',
      pending: '📌 En file'
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  if (loading) return <Loading />;

  if (!queue) {
    return (
      <Layout title="File non trouvée">
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">File non trouvée</h2>
          <p className="text-gray-500 mt-2">La file d'attente que vous recherchez n'existe pas</p>
          <Button variant="primary" onClick={() => navigate('/super-admin/queues')} className="mt-4">
            Retour à la liste
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`File - ${queue.name}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/super-admin/queues')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{queue.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">{queue.company_name || 'N/A'}</span>
              </div>
              {getStatusBadge(queue.status)}
            </div>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchQueueDetails}>
          <RefreshCw className="w-4 h-4" />
          Rafraîchir
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">En attente</p>
              <p className="text-2xl font-bold">{queue.waiting || 0}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Ticket className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Aujourd'hui</p>
              <p className="text-2xl font-bold">{queue.today || 0}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Attente moyenne</p>
              <p className="text-2xl font-bold">{queue.avg_wait || 0} min</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Capacité</p>
              <p className="text-2xl font-bold">{queue.capacity || 50}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tickets en attente */}
      <Card>
        <Card.Header>
          <Card.Title>Tickets en attente</Card.Title>
        </Card.Header>
        <Card.Body>
          {tickets.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun ticket en attente</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numéro</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arrivée</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono text-sm">{ticket.ticket_number || ticket.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{ticket.user?.first_name || 'Anonyme'} {ticket.user?.last_name || ''}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{ticket.position || '-'}</td>
                      <td className="px-4 py-3">{getStatusBadge(ticket.status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(ticket.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/super-admin/tickets/${ticket.id}`)}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Actions */}
      <div className="mt-6 flex gap-4">
        <Button variant="secondary" onClick={() => navigate('/super-admin/queues')}>
          Retour à la liste
        </Button>
        <Button variant="primary" onClick={fetchQueueDetails}>
          <RefreshCw className="w-4 h-4" />
          Rafraîchir
        </Button>
      </div>
    </Layout>
  );
};

export default QueueDetails;