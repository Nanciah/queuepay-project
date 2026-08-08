import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Clock, Users, DollarSign, Tag, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { companyAdmin } from '../../services/api';

const CreateService = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    price: 0,
    duration: 15,
    capacity: 50,
    is_active: true,
    agent_id: '', // 🔥 Ajout : ID de l'agent assigné
  });

  useEffect(() => {
    fetchAgents();
    if (isEditing) {
      fetchService();
    }
  }, [id]);

  const fetchAgents = async () => {
    try {
      const response = await companyAdmin.getAgents();
      setAgents(response.data.agents || []);
    } catch (error) {
      console.error('Erreur chargement agents:', error);
    }
  };

  const fetchService = async () => {
    try {
      const response = await companyAdmin.getService(id);
      const service = response.data.service;
      setFormData({
        name: service.name || '',
        description: service.description || '',
        category: service.category || 'other',
        price: service.price || 0,
        duration: service.duration || 15,
        capacity: service.capacity || 50,
        is_active: service.is_active !== undefined ? service.is_active : true,
        agent_id: service.agent_id || '', // 🔥 Récupérer l'agent assigné
      });
    } catch (error) {
      toast.error('Erreur lors du chargement du service');
      navigate('/company-admin/services');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const dataToSend = {
        ...formData,
        agent_id: formData.agent_id || null, // 🔥 Envoyer l'agent_id
      };

      if (isEditing) {
        await companyAdmin.updateService(id, dataToSend);
        toast.success('Service mis à jour avec succès !');
      } else {
        await companyAdmin.createService(dataToSend);
        toast.success('Service créé avec succès !');
      }
      navigate('/company-admin/services');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { value: 'health', label: 'Santé' },
    { value: 'banking', label: 'Banque' },
    { value: 'administration', label: 'Administration' },
    { value: 'commerce', label: 'Commerce' },
    { value: 'transport', label: 'Transport' },
    { value: 'education', label: 'Éducation' },
    { value: 'other', label: 'Autre' },
  ];

  return (
    <Layout title={isEditing ? 'Modifier le service' : 'Créer un service'}>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/company-admin/services')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <Card>
          <Card.Header>
            <Card.Title>
              {isEditing ? 'Modifier le service' : 'Nouveau service'}
            </Card.Title>
            <p className="text-sm text-gray-500 mt-1">
              {isEditing ? 'Modifiez les informations du service' : 'Remplissez les informations pour créer un nouveau service'}
            </p>
          </Card.Header>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom et Description */}
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Nom du service *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Consultation générale"
                required
                icon={<Tag className="w-5 h-5" />}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="3"
                  placeholder="Description du service..."
                />
              </div>
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Prix, Durée, Capacité */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Prix (Ar)"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                min="0"
                step="100"
                icon={<DollarSign className="w-5 h-5" />}
              />
              <Input
                label="Durée (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                min="1"
                icon={<Clock className="w-5 h-5" />}
              />
              <Input
                label="Capacité max"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                min="1"
                icon={<Users className="w-5 h-5" />}
              />
            </div>

            {/* 🔥 NOUVEAU : Sélection de l'agent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <UserCog className="w-4 h-4 inline mr-2" />
                Assigner à un agent
              </label>
              <select
                value={formData.agent_id}
                onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">-- Sélectionner un agent --</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.first_name} {agent.last_name} ({agent.email})
                  </option>
                ))}
              </select>
              {agents.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Aucun agent disponible. <a href="/company-admin/agents/create" className="text-indigo-600 hover:underline">Créez d'abord un agent</a>
                </p>
              )}
            </div>

            {/* Statut */}
            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Service actif</span>
              </label>
            </div>

            {/* Boutons */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="flex-1"
              >
                <Save className="w-5 h-5" />
                {isEditing ? 'Mettre à jour' : 'Créer le service'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/company-admin/services')}
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

export default CreateService;