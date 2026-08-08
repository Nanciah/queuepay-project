import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, ArrowLeft, User, Mail, Phone, MapPin } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { superAdmin } from '../../services/api';

const CreateCompany = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    adminEmail: '',
    adminPhone: '',
    adminFirstName: '',
    adminLastName: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await superAdmin.createCompany(formData);
      toast.success('Entreprise créée avec succès!');
      
      // Afficher les identifiants de l'admin
      toast.success(
        `Admin créé:\nEmail: ${response.data.admin.email}\nMot de passe: ${response.data.admin.password}`,
        { duration: 10000 }
      );
      
      navigate('/super-admin/companies');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/super-admin/companies')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <Card>
          <Card.Header>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Building2 className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <Card.Title>Créer une entreprise</Card.Title>
                <p className="text-sm text-gray-500 mt-1">
                  Remplissez les informations pour créer une nouvelle entreprise
                </p>
              </div>
            </div>
          </Card.Header>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de l'entreprise */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                Informations de l'entreprise
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nom de l'entreprise"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nom de l'entreprise"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@entreprise.com"
                  icon={<Mail className="w-5 h-5" />}
                />
                <Input
                  label="Téléphone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0340000000"
                  icon={<Phone className="w-5 h-5" />}
                />
                <Input
                  label="Ville"
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Antananarivo"
                  icon={<MapPin className="w-5 h-5" />}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Adresse"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Adresse complète"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows="3"
                    placeholder="Description de l'entreprise..."
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Admin de l'entreprise */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                Admin de l'entreprise
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Prénom"
                  type="text"
                  value={formData.adminFirstName}
                  onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                  placeholder="Prénom"
                  required
                />
                <Input
                  label="Nom"
                  type="text"
                  value={formData.adminLastName}
                  onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                  placeholder="Nom"
                  required
                />
                <Input
                  label="Email Admin"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  placeholder="admin@entreprise.com"
                  icon={<Mail className="w-5 h-5" />}
                  required
                />
                <Input
                  label="Téléphone Admin"
                  type="tel"
                  value={formData.adminPhone}
                  onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                  placeholder="0340000000"
                  icon={<Phone className="w-5 h-5" />}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="flex-1"
              >
                Créer l'entreprise
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate('/super-admin/companies')}
              >
                Annuler
              </Button>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                ⚠️ Le mot de passe de l'admin sera généré automatiquement et affiché après la création.
                Assurez-vous de le communiquer de manière sécurisée.
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateCompany;