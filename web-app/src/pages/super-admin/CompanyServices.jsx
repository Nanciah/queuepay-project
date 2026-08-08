import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Eye, Trash2, Clock, Users, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import { superAdmin, companyAdmin } from '../../services/api';

const CompanyServices = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [companyName, setCompanyName] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // Récupérer les infos de l'entreprise
      const companyRes = await superAdmin.getCompany(id);
      setCompanyName(companyRes.data.company.name);

      // Récupérer les services de l'entreprise
      const servicesRes = await companyAdmin.getServices();
      const allServices = servicesRes.data.services || [];
      // Filtrer les services de cette entreprise
      const companyServices = allServices.filter(s => s.entity_id === id || s.company_id === id);
      setServices(companyServices);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce service ?')) return;
    try {
      await companyAdmin.deleteService(serviceId);
      toast.success('Service supprimé');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(search.toLowerCase()) ||
    service.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <Layout title={`Services - ${companyName}`}>
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(`/super-admin/companies/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="flex flex-wrap justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Services</h1>
            <p className="text-gray-500 mt-1">
              {services.length} service{services.length > 1 ? 's' : ''} pour {companyName}
            </p>
          </div>
        </div>

        <Card className="mb-6">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un service..."
            icon={<Search className="w-5 h-5" />}
          />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} hover>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-sm text-gray-500">{service.category || 'Non catégorisé'}</p>
                </div>
                <Badge variant={service.is_active ? 'success' : 'danger'}>
                  {service.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {service.description || 'Aucune description'}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {service.duration || service.estimated_duration || 15} min
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {service.capacity || service.max_capacity || 50}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {service.price || service.ticket_price || 0} Ar
                </span>
              </div>

              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-gray-100">
                <button
                  onClick={() => navigate(`/super-admin/services/${service.id}`)}
                  className="flex-1 px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  Voir
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <Card className="text-center py-12">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Aucun service</h3>
              <p className="text-gray-500 mt-1">Cette entreprise n'a pas encore de services</p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default CompanyServices;