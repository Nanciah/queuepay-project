import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Phone, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { companyAdmin } from '../../services/api';

const CreateAgent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'active',
    serviceIds: [],
  });

  useEffect(() => {
    fetchServices();
    if (isEditing) {
      fetchAgent();
    }
  }, [id]);

  const fetchServices = async () => {
    try {
      const response = await companyAdmin.getServices();
      setServices(response.data.services || []);
    } catch (error) {
      console.error('Erreur chargement services:', error);
    }
  };

  const fetchAgent = async () => {
    try {
      const response = await companyAdmin.getAgent(id);
      const agent = response.data.agent;
      setFormData({
        firstName: agent.first_name || '',
        lastName: agent.last_name || '',
        email: agent.email || '',
        phone: agent.phone || '',
        status: agent.status || 'active',
        serviceIds: agent.assigned_service_ids || [],
      });
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'agent');
      navigate('/company-admin/agents');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('📝 Envoi des données:', formData);
      console.log('📝 Mode:', isEditing ? 'Édition' : 'Création');
      
      let response;
      
      if (isEditing) {
        // 🔥 MODE ÉDITION - Pas de génération de mot de passe
        response = await companyAdmin.updateAgent(id, formData);
        console.log('✅ Réponse mise à jour:', response.data);
        toast.success('Agent mis à jour avec succès !');
        
      } else {
        // 🔥 MODE CRÉATION - Génération du mot de passe
        response = await companyAdmin.createAgent(formData);
        console.log('✅ Réponse création:', response.data);
        
        if (response.data && response.data.agent) {
          toast.success('Agent créé avec succès !');
          
          // Afficher le mot de passe
          if (response.data.agent.password) {
            toast.success(`Mot de passe temporaire: ${response.data.agent.password}`, {
              duration: 10000,
            });
          }
          
          // Afficher le statut de l'email
          if (response.data.email) {
            if (response.data.email.sent) {
              toast.success('📧 Email envoyé avec les identifiants');
            } else {
              toast.warning('⚠️ Agent créé mais email non envoyé');
            }
          }
        }
      }
      
      navigate('/company-admin/agents');
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      console.error('❌ Détails:', error.response?.data);
      
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error(isEditing ? 'Erreur lors de la mise à jour' : 'Erreur lors de la création');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = (serviceId) => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  };

  return (
    <Layout title={isEditing ? 'Modifier l\'agent' : 'Créer un agent'}>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/company-admin/agents')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <Card>
          <Card.Header>
            <Card.Title>
              {isEditing ? 'Modifier l\'agent' : 'Nouvel agent'}
            </Card.Title>
            <p className="text-sm text-gray-500 mt-1">
              {isEditing ? 'Modifiez les informations de l\'agent' : 'Remplissez les informations pour créer un nouvel agent'}
            </p>
          </Card.Header>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Prénom *"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Jean"
                required
                icon={<User className="w-5 h-5" />}
              />
              <Input
                label="Nom *"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Dupont"
                required
              />
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="agent@entreprise.com"
                required
                icon={<Mail className="w-5 h-5" />}
              />
              <Input
                label="Téléphone *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0340000000"
                required
                icon={<Phone className="w-5 h-5" />}
              />
            </div>

            {/* Services assignés */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Services assignés
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={formData.serviceIds.includes(service.id)}
                      onChange={() => toggleService(service.id)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{service.name}</span>
                  </label>
                ))}
              </div>
              {services.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Aucun service disponible. Créez d'abord un service.
                </p>
              )}
            </div>

            {/* Statut */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.status === 'active'}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })
                  }
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Agent actif</span>
              </label>
            </div>

            {/* 🔥 Message différent selon le mode */}
            {!isEditing ? (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  ⚠️ Le mot de passe de l'agent sera généré automatiquement et affiché après la création.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  ℹ️ Modification de l'agent - Le mot de passe reste inchangé.
                </p>
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="flex-1"
              >
                <Save className="w-5 h-5" />
                {isEditing ? 'Mettre à jour' : 'Créer l\'agent'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/company-admin/agents')}
              >
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateAgent;