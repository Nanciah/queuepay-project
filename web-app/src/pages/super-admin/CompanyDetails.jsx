import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, Mail, Phone, MapPin, Edit, Trash2, 
  User, Calendar, Clock, ClipboardList, Users, Eye, XCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import { superAdmin } from '../../services/api';

const CompanyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [agents, setAgents] = useState([]);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({ services: 0, agents: 0 });

  useEffect(() => {
    fetchCompanyDetails();
  }, [id]);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      
      // Récupérer les infos de l'entreprise
      const response = await superAdmin.getCompany(id);
      setCompany(response.data.company);
      
      // Récupérer les admins de l'entreprise
      const usersResponse = await superAdmin.getUsers();
      const companyAdmins = usersResponse.data.users.filter(
        user => user.company_id === id && user.role === 'company_admin'
      );
      setAdmins(companyAdmins);
      
      // 🔥 Récupérer les agents avec la route superAdmin
      const agentsResponse = await superAdmin.getCompanyAgents(id);
      setAgents(agentsResponse.data.agents || []);
      
      // 🔥 Récupérer les services avec la route superAdmin
      const servicesResponse = await superAdmin.getCompanyServices(id);
      setServices(servicesResponse.data.services || []);
      
      // Mettre à jour les stats
      setStats({
        services: servicesResponse.data.services?.length || 0,
        agents: agentsResponse.data.agents?.length || 0
      });
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette entreprise ?')) return;
    try {
      await superAdmin.deleteCompany(id);
      toast.success('Entreprise supprimée');
      navigate('/super-admin/companies');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await superAdmin.updateCompany(id, { status: newStatus });
      setCompany({ ...company, status: newStatus });
      toast.success(`Statut mis à jour: ${newStatus}`);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet agent ?')) return;
    try {
      // Utiliser la route companyAdmin pour la suppression
      const { companyAdmin } = await import('../../services/api');
      await companyAdmin.deleteAgent(agentId);
      toast.success('Agent supprimé');
      fetchCompanyDetails();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce service ?')) return;
    try {
      const { companyAdmin } = await import('../../services/api');
      await companyAdmin.deleteService(serviceId);
      toast.success('Service supprimé');
      fetchCompanyDetails();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) return <Loading />;

  if (!company) {
    return (
      <Layout title="Entreprise non trouvée">
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Entreprise non trouvée</h2>
          <p className="text-gray-500 mt-2">L'entreprise que vous recherchez n'existe pas</p>
          <Button variant="primary" onClick={() => navigate('/super-admin/companies')} className="mt-4">
            Retour à la liste
          </Button>
        </div>
      </Layout>
    );
  }

  const statusColors = {
    active: 'success',
    pending: 'warning',
    suspended: 'danger'
  };

  const statusLabels = {
    active: 'Actif',
    pending: 'En attente',
    suspended: 'Suspendu'
  };

  return (
    <Layout title={`${company.name} - Détails`}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/super-admin/companies')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant={statusColors[company.status] || 'default'}>
                {statusLabels[company.status] || company.status}
              </Badge>
              <span className="text-sm text-gray-500">
                Créée le {new Date(company.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {company.status === 'active' && (
            <Button variant="warning" size="sm" onClick={() => handleStatusChange('suspended')}>
              Suspendre
            </Button>
          )}
          {company.status === 'suspended' && (
            <Button variant="success" size="sm" onClick={() => handleStatusChange('active')}>
              Réactiver
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => navigate(`/super-admin/companies/${id}/edit`)}>
            <Edit className="w-4 h-4" />
            Modifier
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de gauche - Informations et Ressources */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <Card>
            <Card.Header>
              <Card.Title>Informations générales</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                {company.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                    <p className="text-gray-600">{company.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {company.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-900">{company.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {company.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Téléphone</p>
                        <p className="text-gray-900">{company.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {company.address && (
                    <div className="flex items-center gap-3 md:col-span-2">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Adresse</p>
                        <p className="text-gray-900">{company.address}</p>
                      </div>
                    </div>
                  )}
                  
                  {company.city && (
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Ville</p>
                        <p className="text-gray-900">{company.city}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-500">Créé le :</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(company.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Mis à jour :</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(company.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Services */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                  <Card.Title>Services ({services.length})</Card.Title>
                </div>
                <button
                  onClick={() => navigate(`/super-admin/companies/${id}/services`)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Voir tous
                </button>
              </div>
            </Card.Header>
            <Card.Body>
              {services.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Aucun service pour cette entreprise
                </div>
              ) : (
                <div className="space-y-2">
                  {services.slice(0, 5).map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-500">
                          {service.estimated_duration || 15} min • 
                          {service.ticket_price || 0} Ar
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={service.is_active ? 'success' : 'danger'}>
                          {service.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Supprimer"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {services.length > 5 && (
                    <p className="text-sm text-gray-500 text-center mt-2">
                      +{services.length - 5} autres services
                    </p>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Agents */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <Card.Title>Agents ({agents.length})</Card.Title>
                </div>
                <button
                  onClick={() => navigate(`/super-admin/companies/${id}/agents`)}
                  className="text-sm text-green-600 hover:text-green-800 font-medium"
                >
                  Voir tous
                </button>
              </div>
            </Card.Header>
            <Card.Body>
              {agents.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Aucun agent pour cette entreprise
                </div>
              ) : (
                <div className="space-y-2">
                  {agents.slice(0, 5).map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold text-sm">
                            {agent.first_name?.[0]}{agent.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {agent.first_name} {agent.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{agent.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={agent.status === 'active' ? 'success' : 'danger'}>
                          {agent.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                        <button
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Supprimer"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {agents.length > 5 && (
                    <p className="text-sm text-gray-500 text-center mt-2">
                      +{agents.length - 5} autres agents
                    </p>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        {/* Colonne de droite - Admins et Stats */}
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <Card.Title>Administrateurs</Card.Title>
            </Card.Header>
            <Card.Body>
              {admins.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun administrateur</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {admins.map((admin) => (
                    <div key={admin.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold">
                          {admin.first_name?.[0]}{admin.last_name?.[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {admin.first_name} {admin.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{admin.email}</p>
                        {admin.phone && <p className="text-xs text-gray-400">{admin.phone}</p>}
                      </div>
                      <Badge variant="success">Admin</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Statistiques rapides</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Services</span>
                  <span className="font-semibold text-gray-900">{stats.services || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Agents</span>
                  <span className="font-semibold text-gray-900">{stats.agents || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Administrateurs</span>
                  <span className="font-semibold text-gray-900">{admins.length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Statut</span>
                  <Badge variant={statusColors[company.status] || 'default'}>
                    {statusLabels[company.status] || company.status}
                  </Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CompanyDetails;