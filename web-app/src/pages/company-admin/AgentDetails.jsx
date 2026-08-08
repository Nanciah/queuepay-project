import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Mail, Phone, Clock, Users, Edit, 
  Calendar, CheckCircle, XCircle, Building2, 
  Tag, Activity, BarChart3 
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import { companyAdmin } from '../../services/api';

const AgentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);

  useEffect(() => {
    fetchAgentDetails();
  }, [id]);

  const fetchAgentDetails = async () => {
    try {
      setLoading(true);
      const response = await companyAdmin.getAgent(id);
      setAgent(response.data.agent);
      setServices(response.data.agent.services || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des détails');
      navigate('/company-admin/agents');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  if (!agent) {
    return (
      <Layout title="Agent non trouvé">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Agent non trouvé</h2>
          <p className="text-gray-500 mt-2">L'agent que vous recherchez n'existe pas</p>
          <Button variant="primary" onClick={() => navigate('/company-admin/agents')} className="mt-4">
            Retour à la liste
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${agent.first_name} ${agent.last_name} - Détails`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/company-admin/agents')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {agent.first_name} {agent.last_name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant={agent.status === 'active' ? 'success' : 'danger'}>
                {agent.status === 'active' ? '✅ Actif' : '❌ Inactif'}
              </Badge>
              <span className="text-sm text-gray-500">
                <Tag className="w-3 h-3 inline mr-1" />
                Code: {agent.agent_code || 'N/A'}
              </span>
              <span className="text-sm text-gray-500">
                <Calendar className="w-3 h-3 inline mr-1" />
                Créé le {new Date(agent.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        {/* 🔥 Bouton Modifier */}
        <Button
          variant="primary"
          onClick={() => navigate(`/company-admin/agents/${agent.id}/edit`)}
        >
          <Edit className="w-4 h-4" />
          Modifier
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de gauche - Informations personnelles */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                <Card.Title>Informations personnelles</Card.Title>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Prénom</p>
                  <p className="font-medium text-gray-900">{agent.first_name}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Nom</p>
                  <p className="font-medium text-gray-900">{agent.last_name}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {agent.email}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Téléphone</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {agent.phone}
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Services assignés */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                <Card.Title>Services assignés</Card.Title>
                <span className="text-sm text-gray-400 ml-auto">
                  {services.length} service{services.length > 1 ? 's' : ''}
                </span>
              </div>
            </Card.Header>
            <Card.Body>
              {services.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Aucun service assigné</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">{service.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        {/* Colonne de droite - Statut et statistiques */}
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <Card.Title>Statut du compte</Card.Title>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Statut</span>
                  <Badge variant={agent.status === 'active' ? 'success' : 'danger'}>
                    {agent.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Rôle</span>
                  <Badge variant="info">Agent</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Email vérifié</span>
                  {agent.email_verified ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Téléphone vérifié</span>
                  {agent.phone_verified ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <Card.Title>Statistiques</Card.Title>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Services assignés</span>
                  <span className="font-semibold text-gray-900">{services.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Tickets aujourd'hui</span>
                  <span className="font-semibold text-gray-900">0</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Tickets ce mois</span>
                  <span className="font-semibold text-gray-900">0</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Taux de présence</span>
                  <span className="font-semibold text-gray-900">100%</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AgentDetails;