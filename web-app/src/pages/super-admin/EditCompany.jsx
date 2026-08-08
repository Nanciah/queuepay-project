import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Building2, Mail, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import { superAdmin } from '../../services/api';

const EditCompany = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    status: 'active',
  });

  useEffect(() => {
    fetchCompany();
  }, [id]);

  const fetchCompany = async () => {
    try {
      const response = await superAdmin.getCompany(id);
      const company = response.data.company;
      setFormData({
        name: company.name || '',
        description: company.description || '',
        address: company.address || '',
        city: company.city || '',
        phone: company.phone || '',
        email: company.email || '',
        status: company.status || 'active',
      });
    } catch (error) {
      toast.error('Erreur lors du chargement');
      navigate('/super-admin/companies');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await superAdmin.updateCompany(id, formData);
      toast.success('Entreprise mise à jour avec succès !');
      navigate(`/super-admin/companies/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <Layout title="Modifier l'entreprise">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(`/super-admin/companies/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <Card>
          <Card.Header>
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-indigo-600" />
              <div>
                <Card.Title>Modifier l'entreprise</Card.Title>
                <p className="text-sm text-gray-500 mt-1">Modifiez les informations de l'entreprise</p>
              </div>
            </div>
          </Card.Header>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Nom de l'entreprise *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="3"
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Adresse"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  icon={<MapPin className="w-5 h-5" />}
                />
              </div>
              <Input
                label="Ville"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
              <Input
                label="Téléphone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                icon={<Phone className="w-5 h-5" />}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                icon={<Mail className="w-5 h-5" />}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="active">Actif</option>
                  <option value="pending">En attente</option>
                  <option value="suspended">Suspendu</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <Button
                type="submit"
                variant="primary"
                isLoading={saving}
                className="flex-1"
              >
                <Save className="w-5 h-5" />
                Enregistrer les modifications
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/super-admin/companies/${id}`)}
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

export default EditCompany;